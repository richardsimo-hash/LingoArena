import { useEffect, useRef, useState } from "react";
import { canChooseSpeaker, getPreferredSpeakerId, setPreferredSpeakerId, testSound } from "@/lib/voice";
import { getPreferredMicId, setPreferredMicId, startLiveCapture, VIRTUAL_MIC_PATTERN, type LiveCapture } from "@/lib/liveCapture";
import { logDiagnostic } from "@/lib/diagnostics";

/** Microphone and speaker pickers. Choices are saved per browser and apply immediately. */
export function AudioDeviceSettings() {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState(getPreferredMicId() || "");
  const [speakerId, setSpeakerId] = useState(getPreferredSpeakerId());
  const [labelsHidden, setLabelsHidden] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const captureRef = useRef<LiveCapture | null>(null);

  const load = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
    setInputs(devices.filter((d) => d.kind === "audioinput" && d.deviceId !== "default" && d.deviceId !== "communications"));
    setOutputs(devices.filter((d) => d.kind === "audiooutput" && d.deviceId !== "default" && d.deviceId !== "communications"));
    setLabelsHidden(devices.some((d) => (d.kind === "audioinput" || d.kind === "audiooutput") && !d.label));
  };
  useEffect(() => {
    void load();
    navigator.mediaDevices?.addEventListener?.("devicechange", load);
    return () => { navigator.mediaDevices?.removeEventListener?.("devicechange", load); captureRef.current?.stop(); };
  }, []);

  // Browsers only reveal device names after microphone access has been granted once.
  const showNames = async () => {
    try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((track) => track.stop()); }
    catch { setStatus("Microphone access is blocked. Allow it from the icon left of the address bar."); }
    await load();
  };

  const chooseMic = (id: string) => {
    setMicId(id); setPreferredMicId(id || null);
    logDiagnostic("mic", "settings_mic_selected", "info", { custom: Boolean(id), virtual: VIRTUAL_MIC_PATTERN.test(inputs.find((d) => d.deviceId === id)?.label || "") });
  };
  const chooseSpeaker = (id: string) => {
    setSpeakerId(id); setPreferredSpeakerId(id);
    logDiagnostic("mic", "settings_speaker_selected", "info", { custom: Boolean(id) });
  };

  const testMic = async () => {
    if (captureRef.current) return;
    setStatus("Speak now…"); setLevel(0);
    let peak = 0;
    try {
      const capture = await startLiveCapture({ deviceId: micId || undefined, onLevel: (rms) => { peak = Math.max(peak, rms); setLevel(rms); }, noVoiceTimeoutMs: 60_000, maxDurationMs: 60_000 });
      captureRef.current = capture;
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      const stats = capture.stats();
      capture.stop(); captureRef.current = null;
      setStatus(peak < 0.002 ? `No sound from ${stats.device}. Choose another microphone.` : stats.heardVoice ? `Working: ${stats.device}${stats.switchedFromVirtual ? " (skipped a silent virtual device)" : ""}.` : `Very quiet on ${stats.device}. Speak closer or choose another microphone.`);
      logDiagnostic("mic", "settings_mic_test", peak < 0.002 ? "warn" : "info", stats);
    } catch (error) {
      captureRef.current = null;
      setStatus(error instanceof Error && error.name === "NotAllowedError" ? "Microphone access is blocked. Allow it from the icon left of the address bar." : `Microphone error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLevel(null); void load();
    }
  };

  const testSpeaker = async () => {
    try { await testSound(); setStatus("Played a test tone. Did you hear it?"); }
    catch (error) { setStatus(`Speaker test failed: ${error instanceof Error ? error.message : String(error)}`); }
  };

  const name = (d: MediaDeviceInfo, i: number, kind: string) => d.label || `${kind} ${i + 1}`;
  const selectClass = "min-w-0 flex-1 rounded-2xl border-2 border-border bg-background p-3 font-bold";
  const testClass = "shrink-0 rounded-2xl border-2 border-border px-3 text-sm font-extrabold hover:bg-muted disabled:opacity-50";
  return (
    <div className="mb-5 space-y-3">
      <label className="block text-xs font-extrabold uppercase text-muted-foreground" htmlFor="settings-mic">Microphone</label>
      <div className="flex gap-2">
        <select id="settings-mic" value={micId} onChange={(e) => chooseMic(e.target.value)} className={selectClass}>
          <option value="">Automatic (skips silent virtual devices)</option>
          {inputs.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{name(d, i, "Microphone")}{VIRTUAL_MIC_PATTERN.test(d.label) ? " · virtual" : ""}</option>)}
        </select>
        <button type="button" onClick={() => void testMic()} disabled={level !== null} className={testClass}>Test</button>
      </div>
      {level !== null && <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width] duration-75" style={{ width: `${Math.min(100, Math.round(Math.sqrt(level) * 220))}%` }} /></div>}

      <label className="block text-xs font-extrabold uppercase text-muted-foreground" htmlFor="settings-speaker">Speaker</label>
      <div className="flex gap-2">
        <select id="settings-speaker" value={speakerId} onChange={(e) => chooseSpeaker(e.target.value)} disabled={!canChooseSpeaker()} className={selectClass}>
          <option value="">System default</option>
          {outputs.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{name(d, i, "Speaker")}</option>)}
        </select>
        <button type="button" onClick={() => void testSpeaker()} className={testClass}>Test</button>
      </div>
      <p className="text-xs text-muted-foreground">
        {canChooseSpeaker() ? "Applies to lesson audio and sounds. The browser's built-in voice always uses your system output." : "This browser always plays through the system output; change it in your system sound settings."}
      </p>
      {labelsHidden && <button type="button" onClick={() => void showNames()} className="text-xs font-bold text-primary underline">Show device names (asks for microphone access)</button>}
      {status && <p role="status" className="text-xs font-bold">{status}</p>}
    </div>
  );
}
