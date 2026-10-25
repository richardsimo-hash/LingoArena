# Corrección de audio para Safari/iOS

## Cambios incluidos
- `src/lib/voice.ts`: se mantiene una referencia a cada `SpeechSynthesisUtterance` activa hasta `onend`/`onerror`.
- El desbloqueo de audio también prepara `speechSynthesis` dentro del gesto del usuario con una locución silenciosa y reanuda el motor cuando está pausado.
- La ruta de voz del navegador consulta `getVoices()` de forma síncrona y no espera a `voiceschanged` antes de iniciar la locución.
- Se intenta reanudar `speechSynthesis` al llamar `speak()`, al desbloquear audio y al recuperar la pestaña.
- Se corrigió el acceso nullable a `AudioContext` en el listener de recuperación, que causaba `TS18047` y detenía el build de Vercel.
- `src/routes/index.tsx`: el contenedor raíz activa `unlockAudio()` en `pointerdown` y `keydown` de captura.
- `src/lib/lingo/audio.ts` sigue siendo un alias compatible que reexporta `src/lib/voice.ts`.

## Validación
Se verificó la transpilación sintáctica de los dos archivos TypeScript/TSX modificados. No fue posible completar `npm ci` en este entorno por falta de acceso/caché de dependencias; por tanto, no se afirma que `npm run build` ni la suite de pruebas se hayan ejecutado con éxito.

Antes de desplegar, desde la raíz del proyecto:
1. `npm ci`
2. `npm test`
3. `npm run build`
4. Probar en Safari de iPhone/iPad: desbloqueo por toque, voz de lección, voz tras cancelar una locución, volver a la pestaña después de bloquear/desbloquear el dispositivo y prueba de micrófono seguida de reproducción.
5. Confirmar en Android y Mac que el flujo anterior siga funcionando.

No se incluyeron archivos `.env*`, `node_modules`, `dist` ni `.git`.
