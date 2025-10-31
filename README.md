# SUNA — Simplify. Understand. Navigate. Access.

**SUNA** is an AI-powered, accessibility-focused Chrome extension designed to make web browsing easier for everyone, especially users with disabilities or cognitive challenges. 
It uses **Google’s Built-in AI APIs** (Prompt API, Proofreader, Translator, Summarizer, Rewriter, and more) to simplify, describe, and read aloud web content in real time.

---

## Features

### Read Aloud
- Reads selected or entire page text aloud.
- Adjustable **speech rate** and **voice pitch**.
- Supports multiple languages via Chrome’s built-in AI.

### Simplify Mode
- Summarizes complex content into simpler, easy-to-understand language.
- Ideal for users with dyslexia, ADHD, or reading fatigue.

### Image Description
- Automatically detects images without `alt` tags.
- Uses the **Gemini multimodal API** to generate brief image descriptions.
- Displays captions below images for better accessibility.
- Reads aloud the image description describing the image. Most Readers like NVDA just specify image is present, failing to describe it. 

### Translation
- Instantly translates page text into the target language..

### Proofreading & Rewriting
- Detects grammar, tone, and clarity issues.
- Allows users to rewrite text in different styles (formal, concise, neutral).

## Tech Stack

| Component | Technology |
|------------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (Manifest V3) |
| **Chrome APIs** | Storage, ContextMenus, Tabs, Runtime, SpeechSynthesis |
| **AI APIs** | Google Built-in AI APIs (Prompt, Translator, Proofreader, Summarizer, Rewriter) |
| **Multimodal** | Image + text support using `LanguageModel.create()` |
| **Persistence** | Chrome `storage.local` for preferences |
| **Packaging** | Manifest V3 (MV3) with background service worker |

---

## Installation

1. **Download the ZIP**  
   Extract the contents of `SUNA - Simplify. Understand. Navigate. Access.`

2. **Load in Chrome**
   - Open Chrome Canary and go to `chrome://extensions/`
   - Turn on **Developer Mode**
   - Click **Load unpacked** and select the extracted folder

3. **Activate the Extension**
   - The SUNA icon will appear in your Chrome toolbar.
   - Click the icon to open the pop-up and configure preferences.

---
Pending Review: Chrome Web Store Listing ID: boabjeepbfdeaaidfhjdcpjkcefkejgi

