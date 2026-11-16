# Drittanbieter-Hinweise

Diese App nutzt folgende Modelle und Bibliotheken mit frei nutzbaren Lizenzen (auch kommerziell).
Die Lizenz wurde jeweils an der Originalquelle geprüft.

## KI-Modelle (Freistellen)

| Modell | Quelle | Lizenz | geprüft |
|---|---|---|---|
| BiRefNet lite | Original: https://github.com/ZhengPeng7/BiRefNet · ONNX: `onnx-community/BiRefNet_lite-ONNX` (Hugging Face) | MIT | 16.11.2026, LICENSE im Original-Repo |
| IS-Net (general use) | Original: https://github.com/xuebinqin/DIS · ONNX: `onnx-community/ISNet-ONNX` (Hugging Face) | Apache-2.0 | 16.11.2026, LICENSE.md im Original-Repo |

Nach dem Modellvergleich bleibt nur das gewählte Modell in der App; diese Tabelle wird entsprechend angepasst.

## Laufzeit-Bibliotheken (Auszug)

| Paket | Lizenz |
|---|---|
| @huggingface/transformers (inkl. ONNX Runtime Web) | Apache-2.0 (ONNX Runtime: MIT) |
| react, react-dom | MIT |
| @supabase/supabase-js | MIT |
| @tanstack/react-query | MIT |

Bewusst **nicht** verwendet: `@imgly/background-removal` (AGPL-3.0), BRIA RMBG (nur nicht-kommerziell).
