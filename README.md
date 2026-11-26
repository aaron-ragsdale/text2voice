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

## How it works

PDF.js extracts text locally. Kokoro-82M (via kokoro-js and Transformers.js) synthesizes speech in a Web Worker. The next section is generated while the current one plays. The browser stores reading position locally; the PDF itself is not persisted.

Documents are not sent to an inference server by the app. Model weights and JavaScript dependencies are downloaded from Hugging Face and CDN hosts. Internet is required for initial use; full offline operation is not guaranteed.

## Files

- index.html: responsive interface, document extraction, playback and navigation.
- voice-worker.js: local neural inference.

## Deploy

In repository Settings > Pages, select Deploy from a branch, main, / (root), then Save.

## Current limitations

Selectable-text PDFs only; scanned PDFs need OCR. Complex multi-column documents may be extracted out of order. Highlighting is section-level, not word-level. WAV export is per section. GPU mode is experimental. Browser performance and autoplay restrictions vary.

## Roadmap

OCR, academic paper reading order and citation filtering, persistent document library, full-document audio export, additional speech models and offline asset caching.

## Credits

- [Kokoro](https://github.com/hexgrad/kokoro) (Apache 2.0 model)
- [PDF.js](https://github.com/mozilla/pdf.js)
- [Transformers.js](https://github.com/huggingface/transformers.js)
