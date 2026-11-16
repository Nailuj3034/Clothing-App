// Kopiert die ONNX-Runtime-Dateien (WASM) von Transformers.js nach public/ort,
// damit die App sie von der eigenen Adresse lädt (statt von einem CDN) – wichtig für Offline-Betrieb.
import { copyFileSync, mkdirSync } from 'node:fs'

const src = 'node_modules/@huggingface/transformers/dist/'
const dest = 'public/ort/'
mkdirSync(dest, { recursive: true })
for (const f of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) copyFileSync(src + f, dest + f)
console.log('ORT-Dateien nach public/ort kopiert')
