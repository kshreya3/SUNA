# SUNA — Simplify. Understand. Navigate. Access.

![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-4285F4)
![AI](https://img.shields.io/badge/AI-Gemini%20Nano%20%2B%20Built--in%20APIs-orange)
![Privacy](https://img.shields.io/badge/privacy-offline%20first-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-pending%20review-yellow)

**SUNA** is an AI-powered, accessibility-focused Chrome extension designed to make web browsing easier for everyone, especially users with disabilities or cognitive challenges.  
It uses **Google's Built-in AI APIs** (Prompt API, Proofreader, Translator, Summarizer, Rewriter) and **Gemini multimodal** to simplify, describe, and read aloud web content — entirely on-device, with no data leaving the browser.

> Pending Chrome Web Store review — Store ID: `boabjeepbfdeaaidfhjdcpjkcefkejgi`

---

## Why On-Device AI?

Most AI accessibility tools send page content to cloud servers. For users who most need assistive technology — those with medical needs, legal documents, or sensitive browsing — that's a privacy violation they can't accept. SUNA runs all AI inference locally via Chrome's built-in AI APIs backed by Gemini Nano: no API keys, no billing, no data transmitted.

---

## Architecture

```
  Web Page
     │
     ▼
  Content Script (content.js)
  ├── DOM traversal — extract readable text blocks
  ├── Image scanner — detect missing alt tags
  ├── Selection listener — user highlights text
  └── MutationObserver — handle dynamic page content
     │
     ▼
  Background Service Worker (background.js)
  ├── window.ai.languageModel        ← Gemini Nano (on-device)
  │    ├── Simplify / Summarize selected text
  │    ├── Proofread & rewrite in target style
  │    └── Generate image descriptions (multimodal)
  ├── window.ai.translator           ← Built-in Translator API
  ├── window.ai.summarizer           ← Built-in Summarizer API
  └── SpeechSynthesis (Web Speech API) ← offline text-to-speech
     │
     ▼
  Popup UI (HTML5 + CSS3 + JS)
  ├── Feature toggles (Read Aloud, Simplify, Translate, Proofread)
  ├── Voice/rate controls
  ├── Language selector
  └── Preferences → chrome.storage.local (persisted)
```

**Key invariant:** All AI calls go through `window.ai.*` (Chrome built-in). Zero `fetch()` to external AI endpoints. Network isolation is enforced by design, not policy.

---

## Features

### Read Aloud
- Reads selected or entire page text aloud
- Adjustable **speech rate** and **voice pitch**
- Supports multiple languages via Chrome's built-in AI
- Reads generated image descriptions aloud (unlike NVDA, which only announces image presence)

### Simplify Mode
- Summarizes complex content into simpler, easy-to-understand language
- Targets 6th-grade reading level for maximum accessibility
- Ideal for users with dyslexia, ADHD, or reading fatigue

### Image Description (Multimodal)
- Automatically detects images missing `alt` tags
- Uses **Gemini multimodal** (`LanguageModel.create()`) to generate brief, accurate image descriptions
- Displays captions below images and reads them aloud
- Solves the gap where screen readers like NVDA identify image presence but cannot describe content

### Translation
- Instant page-text translation via Chrome's built-in Translator API
- No external API calls — translation model runs on-device

### Proofreading & Rewriting
- Detects grammar, tone, and clarity issues
- Rewrites text in different styles: formal, concise, neutral

---

## Privacy Design

| Principle | Implementation |
|---|---|
| No telemetry | Zero usage data collected |
| No external AI requests | All inference via `window.ai.*` (on-device) |
| No content storage | Page text processed in memory, never written to storage |
| Minimal permissions | `activeTab` only — no broad host permissions |
| Offline capable | All features work without internet after model download |

---

## Tech Stack

| Component | Technology |
|---|---|
| AI inference | Chrome Built-in AI (Prompt, Summarizer, Translator, Proofreader, Rewriter APIs) |
| Multimodal | Gemini Nano via `LanguageModel.create()` — image + text |
| Extension framework | Chrome Manifest V3 (MV3) |
| Background | Service Worker |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Audio | Web Speech API (`SpeechSynthesis`) — offline |
| Storage | `chrome.storage.local` (preferences only) |

---

## Installation (Developer Mode)

1. Clone or download this repo
2. Open Chrome Canary → `chrome://extensions/`
3. Enable **Developer Mode**
4. Click **Load unpacked** → select the repo folder
5. Enable required flags:
   - `chrome://flags/#prompt-api-for-gemini-nano` → Enabled
   - `chrome://flags/#optimization-guide-on-device-model` → Enabled BypassPerfRequirement
6. Download on-device model: `chrome://components` → Optimization Guide On Device Model → Check for update

---

## Accessibility Impact

Standard screen readers (NVDA, JAWS) announce image presence but cannot describe image content. SUNA's multimodal image description fills this gap — generating meaningful captions for images that lack alt text, then reading them aloud. This is particularly impactful for visually impaired users browsing image-heavy content like news, social media, and e-commerce.

---

## License

MIT
