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

Select Academic paper under Reading mode. Toggle citation removal (common author-year parentheticals and numeric bracket citations), repeated margin headers and footers, page numbers, references, and two-column detection. Optional caption and footnote line filtering is off by default. Click Apply reading options to rebuild the spoken text without changing the PDF. The interface reports the cleanup and retains the current page where possible.

These are heuristic rules, not semantic understanding. Unusual layouts, multiline captions and notes, equations, narrative citations, and unrecognized bibliography headings may require standard mode. Review the cleaned text before listening; numeric brackets can occasionally be meaningful content rather than citations.

## How it works

PDF.js extracts text locally. Kokoro-82M (via kokoro-js and Transformers.js) synthesizes speech in a Web Worker. Up to six upcoming sections are generated during playback. Optional startup buffering includes 1, 3, 5 sections or preparing all remaining sections. The browser stores reading position locally; the PDF itself is not persisted. Optional IndexedDB audio caching retains generated clips locally, including their text-based cache keys, until cleared. Full-document preparation holds clips in memory and can use substantial RAM.

Documents are not sent to an inference server by the app. Model weights and JavaScript dependencies are downloaded from Hugging Face and CDN hosts. Internet is required for initial use; full offline operation is not guaranteed.

## Files

- index.html: responsive interface, document extraction, playback and navigation.
- academic.js: geometry-based reading order and academic text cleanup.
- voice-worker.js: local neural inference.

## Deploy

In repository Settings > Pages, select Deploy from a branch, main, / (root), then Save.

## Current limitations

Selectable-text PDFs only; scanned PDFs need OCR. Complex multi-column documents may be extracted out of order. Highlighting is section-level, not word-level. WAV export is per section. GPU mode, Q4 CPU mode and the community KittenTTS Nano browser engine are experimental. Kokoro Q8 CPU remains the default. Browser performance and autoplay restrictions vary.

## Roadmap

OCR, improved academic layout detection, persistent document library, full-document audio export, additional speech models and offline asset caching.

## Credits

- [KittenTTS community JavaScript port](https://github.com/Algiras/kitten-tts-js) (Apache 2.0)
- [Kokoro](https://github.com/hexgrad/kokoro) (Apache 2.0 model)
- [PDF.js](https://github.com/mozilla/pdf.js)
- [Transformers.js](https://github.com/huggingface/transformers.js)
