import { summarizePage } from "../utils/summarizer.js";
import { translateText } from "../utils/translator.js";
import { detectLanguage } from "../utils/languageDetector.js";
import { rewriteText, writeText } from "../utils/writerRewriter.js";
import { proofreadText } from "../utils/proofreader.js";
import { promptDescribeImage, promptTranscribeAudio } from "../utils/prompt.js";
import { getPrefs } from "../utils/storage.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enableAI_prefs: {
      targetLanguage: "en",
      ttsRate: 1.0,
      ttsPitch: 1.0,
      simplifyLevel: "grade-6",
      captionStyle: "large-high-contrast",
      voiceNav: true,
      focusMode: true
    }
  });
});

// keyboard command -> tell tab to toggle panel
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-panel") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const prefs = await getPrefs();
    try {
      switch (msg.type) {
        case "AI_SUMMARIZE":
          sendResponse({ ok: true, data: await summarizePage(msg.text, prefs) });
          break;
        case "AI_TRANSLATE":
          sendResponse({ ok: true, data: await translateText(msg.text, msg.to || prefs.targetLanguage) });
          break;
        case "AI_DETECT_LANGUAGE":
          sendResponse({ ok: true, data: await detectLanguage(msg.text) });
          break;
        case "AI_REWRITE":
          sendResponse({ ok: true, data: await rewriteText(msg.text, msg.style || prefs.simplifyLevel) });
          break;
        case "AI_WRITE":
          sendResponse({ ok: true, data: await writeText(msg.task, msg.context) });
          break;
        case "AI_PROOFREAD":
          sendResponse({ ok: true, data: await proofreadText(msg.text, msg.explainLanguage || "en") });
          break;
       case "AI_PROMPT_DESCRIBE_IMAGE": {
 let imageBuffer = null;
if (msg.imageBlob) {
  imageBuffer = msg.imageBlob;
} else if (msg.imageUrl) {
  const resp = await fetch(msg.imageUrl);
  const arr = await resp.arrayBuffer();
  imageBuffer = arr;
}
const result = await promptDescribeImage(imageBuffer);

  // 🔍 Log the full Gemini return for debugging
  console.log("🔎 Gemini raw result:", result);

  let desc = "(image)";

  if (typeof result === "string") {
    desc = result;
  } else if (result?.output) {
    desc = result.output;
  } else if (result?.text) {
    desc = result.text;
  } else if (Array.isArray(result) && result[0]) {
    desc = result[0].output || result[0].text || "(image)";
  } else if (result?.candidates?.length) {
    desc = result.candidates[0]?.output || result.candidates[0]?.text || "(image)";
  } else if (result?.response) {
    desc = result.response?.output || result.response?.text || "(image)";
  }

  console.log("✅ Gemini parsed ALT text:", desc);
  sendResponse({ ok: true, data: desc.trim() });
  break;
}


        case "AI_PROMPT_TRANSCRIBE_AUDIO":
          sendResponse({ ok: true, data: await promptTranscribeAudio(msg.audioBlob) });
          break;
        default:
          sendResponse({ ok: false, error: "Unknown message type" });
      }
    } catch (e) {
      console.error(e);
      sendResponse({ ok: false, error: e.message || String(e) });
    }
  })();
  return true;
});