/**
 * Microphone capture as raw 16 kHz mono PCM, with voice-activity detection.
 * PCM feeds on-device Whisper directly (no decode step) for live and final transcripts,
 * and is wrapped as WAV only when the cloud fallback is needed.
 */
export type LiveCapture = {
  /** Copy of everything captured so far, 16 kHz mono. */
  samples: () => Float32Array;
  heardVoice: () => boolean;
  /** True when the default input was a silent virtual device and a real mic was used instead. */
  switchedFromVirtual: boolean;
  durationMs: () => number;
  /** Level and device metadata for diagnostics (no audio content). */
  stats: () => Record<string, string | number | boolean>;
  stop: () => Float32Array;
};

export type LiveCaptureOptions = {
  /** Fired once after voice was heard and then ~silenceMs of quiet followed. */
  onSilenceAfterVoice?: () => void;
  /** Fired once if no voice is detected within noVoiceTimeoutMs. */
  onNoVoice?: () => void;
  /** Fired once when maxDurationMs is reached. */
  onMaxDuration?: () => void;
  /** Input device to use; defaults to the one chosen on /test, else the system default. */
  deviceId?: string;
  /** Disable echo cancellation / noise suppression / auto gain (for diagnosing silent input). */
  raw?: boolean;
  /** Called with each buffer's RMS level (for meters). */
  onLevel?: (rms: number) => void;
  silenceMs?: number;
  noVoiceTimeoutMs?: number;
  maxDurationMs?: number;
};

const TARGET_RATE = 16000;
const MIC_KEY = "lingoarena-mic-device";
/** Virtual inputs that are silent unless their app is in a call or routing audio. */
export const VIRTUAL_MIC_PATTERN = /virtual|teams audio|zoomaudio|zoom audio|blackhole|loopback|soundflower|krisp|vb-audio|voicemeeter|camo|obs/i;
export function getPreferredMicId(): string | undefined {
  try { return localStorage.getItem(MIC_KEY) || undefined; } catch { return undefined; }
}
export function setPreferredMicId(id: string | null) {
  try { if (id) localStorage.setItem(MIC_KEY, id); else localStorage.removeItem(MIC_KEY); } catch { /* storage may be disabled */ }
}

export async function startLiveCapture(options: LiveCaptureOptions = {}): Promise<LiveCapture> {
  const { silenceMs = 1300, noVoiceTimeoutMs = 12000, maxDurationMs = 30000 } = options;
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) throw new Error("LIVE_CAPTURE_UNAVAILABLE");
  const deviceId = options.deviceId ?? getPreferredMicId();
  const processing = !options.raw;
  const constraints = (id?: string): MediaStreamConstraints => ({ audio: { echoCancellation: processing, noiseSuppression: processing, autoGainControl: processing, ...(id ? { deviceId: { exact: id } } : {}) } });
  let stream = await navigator.mediaDevices.getUserMedia(constraints(deviceId))
    // A remembered device may have been unplugged; fall back to the default input.
    .catch((error) => deviceId ? navigator.mediaDevices.getUserMedia(constraints()) : Promise.reject(error));
  // If the system default is a virtual device (e.g. "Microsoft Teams Audio Device"), it delivers
  // silence outside calls. Unless the user explicitly picked it, switch to a real microphone.
  let switchedFrom = "";
  const firstLabel = stream.getAudioTracks()[0]?.label || "";
  if (!options.deviceId && !getPreferredMicId() && VIRTUAL_MIC_PATTERN.test(firstLabel)) {
    const inputs = (await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]))
      .filter((d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "default" && d.deviceId !== "communications" && !VIRTUAL_MIC_PATTERN.test(d.label));
    const real = inputs.find((d) => /built-in|macbook|internal/i.test(d.label)) ?? inputs[0];
    if (real) {
      const replacement = await navigator.mediaDevices.getUserMedia(constraints(real.deviceId)).catch(() => null);
      if (replacement) { stream.getTracks().forEach((track) => track.stop()); stream = replacement; switchedFrom = firstLabel; }
    }
  }
  const context = new AudioContextCtor();
  if (context.state === "suspended") await context.resume().catch(() => undefined);
  const source = context.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but universally available (incl. iOS Safari) and needs no worklet file.
  const processor = context.createScriptProcessor(4096, 1, 1);
  const ratio = context.sampleRate / TARGET_RATE;

  let chunks: Float32Array[] = [];
  let totalLength = 0;
  let carry = 0; // fractional read position carried across buffers for resampling
  let heardVoice = false;
  let silentSince = 0;
  let noiseFloor = 0.008;
  let peakRms = 0, rmsSum = 0, rmsCount = 0, buffers = 0;
  const calibration: number[] = [];
  const startedAt = performance.now();
  let stopped = false;
  let firedSilence = false, firedNoVoice = false, firedMax = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    // Box-filter downsample to 16 kHz.
    const outLength = Math.floor((input.length - carry) / ratio);
    const out = new Float32Array(Math.max(0, outLength));
    let sumSquares = 0;
    for (let i = 0; i < out.length; i++) {
      const start = Math.floor(carry + i * ratio);
      const end = Math.min(input.length, Math.max(start + 1, Math.floor(carry + (i + 1) * ratio)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j]!;
      out[i] = sum / (end - start);
      sumSquares += out[i]! * out[i]!;
    }
    carry = carry + out.length * ratio - input.length;
    if (carry < 0) carry = 0;
    if (out.length) { chunks.push(out); totalLength += out.length; }

    const rms = Math.sqrt(sumSquares / Math.max(1, out.length));
    options.onLevel?.(rms);
    buffers++; rmsSum += rms; rmsCount++; if (rms > peakRms) peakRms = rms;
    const elapsed = performance.now() - startedAt;
    if (elapsed < 400) { calibration.push(rms); noiseFloor = Math.max(0.003, calibration.reduce((a, b) => a + b, 0) / calibration.length); }
    // Auto-gain and noise suppression keep speech fairly quiet, so stay sensitive.
    const threshold = Math.max(0.01, noiseFloor * 2.2 + 0.004);
    if (rms > threshold) { heardVoice = true; silentSince = 0; }
    else if (heardVoice) {
      if (!silentSince) silentSince = performance.now();
      if (!firedSilence && performance.now() - silentSince > silenceMs) { firedSilence = true; options.onSilenceAfterVoice?.(); }
    }
    if (!heardVoice && !firedNoVoice && elapsed > noVoiceTimeoutMs) { firedNoVoice = true; options.onNoVoice?.(); }
    if (!firedMax && elapsed > maxDurationMs) { firedMax = true; options.onMaxDuration?.(); }
  };
  source.connect(processor);
  // Some browsers only run the processor when it is connected to the destination; output is silent.
  processor.connect(context.destination);

  const samples = () => {
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
    chunks = [merged];
    return merged;
  };

  const track = stream.getAudioTracks()[0];
  const stats = () => {
    const settings = (track?.getSettings?.() ?? {}) as MediaTrackSettings;
    return {
      device: (track?.label || "unknown").slice(0, 80),
      switchedFromVirtual: switchedFrom.slice(0, 80),
      trackState: track?.readyState || "none",
      trackMuted: Boolean(track?.muted),
      trackEnabled: Boolean(track?.enabled),
      contextState: context.state,
      contextRate: context.sampleRate,
      deviceRate: settings.sampleRate ?? 0,
      echoCancellation: Boolean(settings.echoCancellation),
      noiseSuppression: Boolean(settings.noiseSuppression),
      autoGainControl: Boolean(settings.autoGainControl),
      buffers,
      peakRms: Math.round(peakRms * 10000) / 10000,
      avgRms: Math.round((rmsSum / Math.max(1, rmsCount)) * 10000) / 10000,
      noiseFloor: Math.round(noiseFloor * 10000) / 10000,
      heardVoice,
    };
  };

  return {
    samples,
    stats,
    heardVoice: () => heardVoice,
    switchedFromVirtual: Boolean(switchedFrom),
    durationMs: () => (totalLength / TARGET_RATE) * 1000,
    stop: () => {
      if (!stopped) {
        stopped = true;
        processor.onaudioprocess = null;
        try { source.disconnect(); } catch { /* already disconnected */ }
        try { processor.disconnect(); } catch { /* already disconnected */ }
        stream.getTracks().forEach((track) => track.stop());
        void context.close().catch(() => undefined);
      }
      return samples();
    },
  };
}

/** Encodes 16 kHz mono PCM as a 16-bit WAV blob (for the cloud STT fallback). */
export function encodeWav(samples: Float32Array, sampleRate = TARGET_RATE): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  writeString(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); writeString(8, "WAVE");
  writeString(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeString(36, "data"); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
