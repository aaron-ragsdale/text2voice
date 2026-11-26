# text2voice

A local-first neural text-to-speech reading studio for PDFs and plain text.

## [Launch text2voice](https://aaron-ragsdale.github.io/text2voice/)

No account or API key required. Open in Chrome or Edge for initial testing.

## Getting started

1. Open the website and select a PDF or paste text.
2. Choose a voice. CPU mode is the default for compatibility.
3. Click Load voice model or Play. The initial download may take a while.
4. Listen, navigate sections, adjust playback speed or download a section as WAV.
5. Reopen the same document to restore your saved section.

## Academic paper mode

The document header shows the applied reading mode, cleanup summary and active filters. Use Spoken text / Original extracted text to compare the cleaned text with the original extraction (current page for PDFs). This is a visual preview only; audio always uses the applied reading mode. Audio and generation status identify the source mode. Changing filter checkboxes requires Apply reading options, which stops playback and resets prepared in-memory audio for the previous text.

Select Academic paper under Reading mode. Toggle citation removal (common author-year parentheticals and numeric bracket citations), repeated margin headers and footers, page numbers, references, and two-column detection. Optional caption and footnote line filtering is off by default. Click Apply reading options to rebuild the spoken text without changing the PDF. The interface reports the cleanup and retains the current page where possible.

These are heuristic rules, not semantic understanding. Unusual layouts, multiline captions and notes, equations, narrative citations, and unrecognized bibliography headings may require standard mode. Review the cleaned text before listening; numeric brackets can occasionally be meaningful content rather than citations.

## Web articles

Paste an HTTP(S) article URL into Import a web article and choose Extract article. Direct fetching works only when the source website permits cross-origin browser access (CORS). If blocked, open the original article, save the webpage as HTML using Ctrl/Cmd+S, and upload the saved HTML file. Alternatively paste the article text.

The importer uses Mozilla Readability (Apache 2.0) with a local structural fallback. It removes common advertising and navigation elements and extracts plain text, titles, headings and available author information. Imported markup is never inserted into the visible application. Review the extracted text before playback. Dynamic pages, paywalls, incomplete saved pages and unusual layouts may not import correctly. No third-party fetching proxy is used.

## Prepare audio for later

Choose Generate entire document to synthesize every section silently without autoplay. Progress is shown separately from reading progress. Cancel stops scheduling new sections; an in-flight inference may finish. Completed sections remain in memory until changing document, reading settings or voice/model settings. Enable optional saved audio caching before generation if you want to reuse clips after reopening the page. Once all sections are prepared, press Play or Download full WAV. The WAV contains the full extracted document at the model's original speed, not the playback speed slider setting.

Keep the browser tab open and device awake during generation. Large documents and full WAV export can consume significant RAM. Browser storage quotas and background throttling apply.

## How it works

PDF.js extracts text locally. Kokoro-82M (via kokoro-js and Transformers.js) synthesizes speech in a Web Worker. Up to six upcoming sections are generated during playback. Optional startup buffering includes 1, 3, 5 sections or preparing all remaining sections. The browser stores reading position locally; the PDF itself is not persisted. Optional IndexedDB audio caching retains generated clips locally, including their text-based cache keys, until cleared. Full-document preparation holds clips in memory and can use substantial RAM.

Documents are not sent to an inference server by the app. Model weights and JavaScript dependencies are downloaded from Hugging Face and CDN hosts. Internet is required for initial use; full offline operation is not guaranteed.

## Files

- index.html: responsive interface, document extraction, playback and navigation.
- article.js: local HTML extraction and CORS-aware URL import.
- academic.js: geometry-based reading order and academic text cleanup.
- voice-worker.js: local neural inference.

## Deploy

In repository Settings > Pages, select Deploy from a branch, main, / (root), then Save.

## Current limitations

Selectable-text PDFs only; scanned PDFs need OCR. Complex multi-column documents may be extracted out of order. Highlighting is section-level, not word-level. WAV export supports individual sections and full prepared documents. GPU mode, Q4 CPU mode and the community KittenTTS Nano browser engine are experimental. Kokoro Q8 CPU remains the default. Browser performance and autoplay restrictions vary.

## Roadmap

OCR, improved academic layout detection, persistent document library, additional speech models and offline asset caching.

## Credits

- [Mozilla Readability](https://github.com/mozilla/readability)

- [KittenTTS community JavaScript port](https://github.com/Algiras/kitten-tts-js) (Apache 2.0)
- [Kokoro](https://github.com/hexgrad/kokoro) (Apache 2.0 model)
- [PDF.js](https://github.com/mozilla/pdf.js)
- [Transformers.js](https://github.com/huggingface/transformers.js)

## Experimental MediaPipe engines and benchmarking

Choose MediaPipe Kokoro (CPU or hybrid WebGPU), PocketTTS English (CPU, about 163 MB), or Phonon (CPU, about 87 MB) in Speech model. Existing Kokoro ONNX Q8/Q4/GPU and KittenTTS remain available. The MediaPipe bundles are downloaded from Hugging Face on demand. Kokoro's GPU bundle is about 295 MB. GPU support varies by browser and hardware. All synthesis stays in the browser worker.

Open Speech performance benchmark and run the same passage with each engine. Load time includes initialization/download if needed; first audio is the first generated PCM chunk for MediaPipe or the complete clip for ONNX/Kitten. Speed is audio duration divided by generation time; above 1x is faster than normal playback. The gaps column counts section transitions without ready audio in the session, not gaps measured during the benchmark itself. Results are session-only. MediaPipe streaming chunks are assembled into section WAV files to preserve playback, caching and export; immediate clause-by-clause playback is not yet implemented. These engines are experimental and require browser testing.

- [MediaPipe TTS documentation](https://developers.google.com/edge/mediapipe/solutions/audio/text_to_speech)
- [PocketTTS by Kyutai](https://github.com/kyutai-labs/pocket-tts), model licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- [Phonon by Gradium, LiteRT bundle](https://huggingface.co/litert-community/phonon-31m-en), Apache 2.0.
