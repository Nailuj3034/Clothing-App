/**
 * Freistell-Modelle, die in Frage kommen. Nur frei nutzbare Lizenzen (siehe THIRD_PARTY_NOTICES.md).
 * Beide laufen über Transformers.js (bringt die ONNX-Runtime mit).
 */
export type ModelId = 'birefnet-lite' | 'isnet'
export type Dtype = 'fp32' | 'fp16' | 'q8'
export type Device = 'webgpu' | 'wasm'

export interface ModelInfo {
  id: ModelId
  label: string
  /** Modell-Repository auf Hugging Face */
  repo: string
  /** Feste Version, damit sich das Modell nicht unbemerkt ändert */
  revision: string
  license: string
}

export const MODELS: Record<ModelId, ModelInfo> = {
  'birefnet-lite': {
    id: 'birefnet-lite', label: 'BiRefNet lite', repo: 'onnx-community/BiRefNet_lite-ONNX', revision: 'main',
    license: 'MIT (ZhengPeng7/BiRefNet)',
  },
  isnet: {
    id: 'isnet', label: 'IS-Net', repo: 'onnx-community/ISNet-ONNX', revision: 'main',
    license: 'Apache-2.0 (xuebinqin/DIS)',
  },
}

/** Modell + Einstellungen, die die App standardmäßig nutzt (wird nach dem Vergleich im Labor festgelegt). */
export const ACTIVE_MODEL: { model: ModelId; dtype: Dtype } = { model: 'birefnet-lite', dtype: 'fp16' }

/** WebGPU, wenn der Browser es kann, sonst WebAssembly (CPU). */
export function bestDevice(): Device {
  return typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm'
}
