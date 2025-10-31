// content.bundle.js — NO imports. Standalone, MV3-safe.

// --- simple store for state ---
const EA_STATE = { panel: null, captionActive: false, captionEl: null, focusMode: false };

// --- helpers (inline) ---
function speak(text) {
  const u = new SpeechSynthesisUtterance(text || "");
  try {
    chrome.storage.local.get("enableAI_prefs", ({ enableAI_prefs }) => {
      if (enableAI_prefs) {
        u.rate = enableAI_prefs.ttsRate ?? 1;
        u.pitch = enableAI_prefs.ttsPitch ?? 1;
        const lang = enableAI_prefs.targetLanguage || "en-US";
        u.lang = lang.includes("-") ? lang : (lang === "en" ? "en-US" : lang);
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  } catch { window.speechSynthesis.speak(u); }
}
function stopSpeaking(){ window.speechSynthesis.cancel(); }

function chunkText(text, max=8000){ const out=[]; for(let i=0;i<text.length;i+=max) out.push(text.slice(i,i+max)); return out; }

// SpeechRecognition fallback
let __ea_recog;
async function startSpeechRecognition(onResult) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error("SpeechRecognition not supported.");
  __ea_recog = new SR();
  __ea_recog.lang = "en-US"; __ea_recog.continuous = true; __ea_recog.interimResults = true;
  __ea_recog.onresult = (e)=>{
    const result = [...e.results].map(r => r[0].transcript).join(" ");
    onResult(result);
  };
  __ea_recog.start();
}
function stopSpeechRecognition(){ try{__ea_recog?.stop();}catch{} __ea_recog=null; }

function announce(msg){
  const live = document.getElementById("enableai-live");
  if (live) live.textContent = msg;
}

function getPageText(){
  const t = document.body?.innerText || "";
  return chunkText(t,8000).join("\n");
}

function showModal(title, content){
  const win = window.open("","_blank","popup,width=520,height=640");
  if (!win) return alert(content);
  const esc = s => (s||"").replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
  win.document.write(`<pre style="white-space:pre-wrap;font:14px/1.5 system-ui">${esc(title)}\n\n${esc(content||"")}</pre>`);
}

function clickByText(regex){
  const el = [...document.querySelectorAll("button, a, [role='button']")]
    .find(n => regex.test(n.textContent || n.getAttribute("aria-label") || ""));
  el?.click();
}

// --- floating panel ---
function buildPanel(){
  if (EA_STATE.panel) return EA_STATE.panel;
  const panel = document.createElement("section");
  panel.className = "enableai-panel";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","SUNA controls");
  panel.tabIndex = -1;
  panel.innerHTML = `
    <div style="padding:12px">
      <h2 style="font-size:20px; margin:0 0 8px">SUNA</h2>
      <div class="sr-only" aria-live="polite" id="enableai-live"></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px">
        <button class="enableai-btn" id="ea-simplify">Simplify</button>
        <button class="enableai-btn" id="ea-translate">Translate</button>
        <button class="enableai-btn" id="ea-read">Read Aloud</button>
        <button class="enableai-btn" id="ea-focus">Focus Mode</button>
        <button class="enableai-btn" id="ea-captions" style="display:none;">Live Captions</button>
        <button class="enableai-btn" id="ea-scan-img">Describe Images</button>
      </div>
      <label style="display:block; margin:8px 0">
        <span>Selected text</span>
        <textarea id="ea-selected" rows="3" style="width:100%" aria-label="Selected text"></textarea>
      </label>
      <div style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="enableai-btn" id="ea-proof">Proofread</button>
        <button class="enableai-btn" id="ea-rewrite">Rewrite Simple</button>
        <button class="enableai-btn" id="ea-stop-tts">Stop Audio</button>
      </div>
    </div>`;
  document.documentElement.appendChild(panel);

  // wire
  panel.querySelector("#ea-selected").value = window.getSelection()?.toString() || "";

  panel.querySelector("#ea-simplify").onclick = async ()=>{
    const res = await chrome.runtime.sendMessage({ type:"AI_SUMMARIZE", text:getPageText() });
    if (res?.ok){ announce("Simplified content ready. Reading aloud."); speak(res.data); }
    else announce(res?.error||"Error");
  };

  panel.querySelector("#ea-translate").onclick = async ()=>{
    const text = window.getSelection()?.toString() || getPageText();
    const res = await chrome.runtime.sendMessage({ type:"AI_TRANSLATE", text });
    if (res?.ok){ announce("Translation ready. Reading aloud."); speak(res.data); }
    else announce(res?.error||"Error");
  };

  panel.querySelector("#ea-read").onclick = ()=>{
    const text = window.getSelection()?.toString() || getPageText();
    speak(text);
  };

  panel.querySelector("#ea-stop-tts").onclick = stopSpeaking;

  panel.querySelector("#ea-focus").onclick = toggleFocus;
  panel.querySelector("#ea-captions").onclick = toggleCaptions;
  panel.querySelector("#ea-scan-img").onclick = describeMissingAlt;

  panel.querySelector("#ea-proof").onclick = async ()=>{
  const t = panel.querySelector("#ea-selected").value || window.getSelection()?.toString();
  if (!t) return announce("Select text to proofread.");

  // Ask the background to proofread first
  let resultText = "";
  try {
    const res = await chrome.runtime.sendMessage({ type:"AI_PROOFREAD", text:t });
    if (res?.ok) {
      // Some models return object, some return plain string
      resultText = res.data?.corrected || res.data || "(no response)";
    } else {
      resultText = `Error: ${res?.error || "Unknown"}`;
    }
  } catch (err) {
    resultText = `Error: ${err.message}`;
  }

  // Only then open modal with plain HTML (no chrome.* calls)
  showModal("Proofread Result", resultText);
};

  panel.querySelector("#ea-rewrite").onclick = async ()=>{
    const t = panel.querySelector("#ea-selected").value || window.getSelection()?.toString();
    if (!t) return announce("Select text to rewrite.");
    const res = await chrome.runtime.sendMessage({ type:"AI_REWRITE", text:t, style:"grade-6" });
    if (res?.ok) showModal("Rewritten", res.data);
    else announce(res?.error||"Error");
  };

  EA_STATE.panel = panel;
  return panel;
}

function togglePanel(){
  const p = buildPanel();
  const hidden = p.hasAttribute("hidden");
  if (hidden) p.removeAttribute("hidden"); else p.setAttribute("hidden","");
}

function toggleFocus(){
  EA_STATE.focusMode = !EA_STATE.focusMode;
  if (EA_STATE.focusMode){
    document.querySelectorAll("nav, header, footer, aside, [role='banner'], [role='complementary'], .ad, [aria-label*='cookie']").forEach(el=>el.classList.add("enableai-focus-hide"));
    announce("Focus mode enabled.");
  } else {
    document.querySelectorAll(".enableai-focus-hide").forEach(el=>el.classList.remove("enableai-focus-hide"));
    announce("Focus mode disabled.");
  }
}

async function toggleCaptions(){
  if (EA_STATE.captionActive){
    EA_STATE.captionActive = false;
    stopSpeechRecognition();
    EA_STATE.captionEl?.remove();
    EA_STATE.captionEl = null;
    return;
  }
  EA_STATE.captionActive = true;
  const bar = document.createElement("div");
  bar.className = "enableai-caption-bar";
  bar.setAttribute("role","log"); bar.setAttribute("aria-live","polite");
  bar.textContent = "Captions starting…";
  document.documentElement.appendChild(bar);
  EA_STATE.captionEl = bar;
  try {
    await startSpeechRecognition((text)=>{ bar.textContent = text; });
  } catch(e) {
    bar.textContent = "Captions unavailable on this device.";
  }
}

function injectLanguageModelBridge() {
  const code = `
    window.enableAI_describeImage = async (src) => {
      try {
        if (!("LanguageModel" in self)) {
          window.postMessage({ type: "EnableAI_ImageDescription", src, error: "LanguageModel not available" }, "*");
          return;
        }
        const blob = await (await fetch(src)).blob();
        const session = await LanguageModel.create({
          expectedInputs: [{ type: "image", languages: ["en"] }],
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: "system", content: "Describe this image briefly and objectively for ALT text." }]
        });
        const res = await session.prompt([
          { role: "user", content: [
            { type: "text", value: "Describe this image for accessibility (alt text <= 20 words)" },
            { type: "image", value: blob }
          ]}
        ]);
        const desc = res?.output || res || "(no response)";
        window.postMessage({ type: "EnableAI_ImageDescription", src, desc }, "*");
      } catch (e) {
        window.postMessage({ type: "EnableAI_ImageDescription", src, error: e.message }, "*");
      }
    };
  `;
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const s = document.createElement("script");
  s.src = url;
  (document.head || document.documentElement).appendChild(s);
  s.onload = () => {
    URL.revokeObjectURL(url);
    s.remove();
  };
}

function injectProofreaderBridge() {
  const code = `
    window.enableAI_proofread = async (text) => {
      try {
        if (!('Proofreader' in self)) {
          window.postMessage({ type: 'EnableAI_ProofreadResult', error: 'Proofreader not available' }, '*');
          return;
        }
        const avail = await Proofreader.availability();
        if (avail === 'unavailable') {
          window.postMessage({ type: 'EnableAI_ProofreadResult', error: 'Unavailable' }, '*');
          return;
        }
        const proof = await Proofreader.create({ explanationLanguage: 'en' });
        const methodName = ['correct', 'proofread', 'check', 'revise', 'edit', 'correctText']
          .find(m => typeof proof?.[m] === 'function');
        if (!methodName) {
          window.postMessage({ type: 'EnableAI_ProofreadResult', error: 'No valid method' }, '*');
          return;
        }
        const out = await proof[methodName](text, { includeExplanations: true, includeLabels: true });
        window.postMessage({ type: 'EnableAI_ProofreadResult', result: out }, '*');
      } catch(e) {
        window.postMessage({ type: 'EnableAI_ProofreadResult', error: e.message }, '*');
      }
    };
  `;
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const s = document.createElement("script");
  s.src = url;
  (document.head || document.documentElement).appendChild(s);
  s.onload = () => {
    URL.revokeObjectURL(url);
    s.remove();
  };
}
injectLanguageModelBridge();
injectProofreaderBridge();


// Listen for messages coming back from page-world script
// Listen for messages coming back from page-world script
window.addEventListener("message", (e) => {
  const data = e.data;

  // === Proofreader result handling ===
  if (data?.type === 'EnableAI_ProofreadResult') {
    if (data.result) {
      const corrected = data.result.corrected || data.result.text || '';
      showModal('Proofread Result', corrected);
    } else if (data.error) {
      showModal('Proofreader Error', data.error);
    }
  }

  // === NEW: Handle AI-generated image descriptions ===
  if (data?.type === "EnableAI_ImageDescription") {
    const { src, desc, error } = data;
    const img = [...document.images].find(i => i.src === src);

    if (!img) return;

    if (desc && !error) {
      const altText = typeof desc === "string"
        ? desc
        : (desc.output || desc[0]?.output || "(no description)");

      img.alt = altText.trim();
      img.setAttribute("data-enableai-alt", "true");

      // Optional small overlay indicator
      const tag = document.createElement("span");
      tag.textContent = "ALT ✓";
      tag.style.cssText = `
        position:absolute; background:#0a0; color:#fff;
        font-size:10px; padding:1px 3px; border-radius:3px;
        top:2px; left:2px; z-index:9999;
      `;
      img.style.position = "relative";
      img.parentElement?.appendChild(tag);

      announce("ALT added for one image.");
    } else if (error) {
      console.warn("EnableAI Image Description error:", error);
    }
  }
});

// --- Fallback bridge to ensure AI image descriptions are applied ---
// === Handle AI-generated image descriptions (updated) ===
window.addEventListener("message", (e) => {
  const data = e.data;
  if (data?.type !== "EnableAI_ImageDescription") return;

  const { src, desc, error } = data;
  const img = [...document.images].find(i => i.src === src);
  if (!img) return;

  if (desc && !error) {
    const altText = (typeof desc === "string"
      ? desc
      : desc.output || desc[0]?.output || "(no description)").trim();

    // 1️⃣ Add alt attribute
    img.alt = altText;
    img.setAttribute("data-enableai-alt", "true");

    // 2️⃣ Display below image (visible caption)
    const caption = document.createElement("div");
    caption.textContent = altText;
    caption.style.cssText = `
      font-size: 13px;
      color: #333;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px 6px;
      margin-top: 4px;
      max-width: ${img.width || 200}px;
      font-family: system-ui, sans-serif;
    `;
    // Avoid duplicate captions
    if (!img.nextElementSibling || !img.nextElementSibling.classList.contains("enableai-caption")) {
      caption.className = "enableai-caption";
      img.insertAdjacentElement("afterend", caption);
    }

    // 3️⃣ Speak the alt text aloud
    const utter = new SpeechSynthesisUtterance(altText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

    // 4️⃣ Announce in accessibility live region
    announce(`ALT text added and spoken: ${altText}`);

  } else if (error) {
    console.warn("EnableAI Image Description error:", error);
  }
});



// Initialize the bridge immediately
injectLanguageModelBridge();

async function describeMissingAlt() {
  const imgs = [...document.images].filter(i => !i.alt || i.alt.trim() === "");
  if (!imgs.length) { announce("All images already have alt text."); return; }

  let count = 0;
  for (const img of imgs) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: "AI_PROMPT_DESCRIBE_IMAGE",
        imageUrl: img.src
      });

      const altText =
        typeof res?.data === "string"
          ? res.data
          : res?.data?.output ||
            res?.data?.[0]?.output ||
            "image";

      const cleanAlt = altText.trim();
      img.alt = cleanAlt;
      img.setAttribute("data-enableai-alt", "true");

      // 🧾 Show caption below the image
      const caption = document.createElement("div");
      caption.textContent = cleanAlt;
      caption.className = "enableai-caption";
      caption.style.cssText = `
        font-size: 13px;
        color: #333;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 6px;
        margin-top: 4px;
        max-width: ${img.width || 200}px;
        font-family: system-ui, sans-serif;
      `;
      if (!img.nextElementSibling || !img.nextElementSibling.classList.contains("enableai-caption")) {
        img.insertAdjacentElement("afterend", caption);
      }

      // 🔊 Speak the alt text aloud with delay
      await new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(cleanAlt);
        utter.onend = resolve;
        window.speechSynthesis.speak(utter);
      });

      count++;
    } catch (e) {
      console.warn("AI ALT fallback:", e);
      img.alt = "image";
    }
  }

  announce(`Added and spoke AI ALT text for ${count} image${count === 1 ? "" : "s"}.`);
}


// Selection sync
document.addEventListener("selectionchange", ()=>{
  const area = document.querySelector("#ea-selected");
  if (area) area.value = window.getSelection()?.toString() || "";
});

// Auto-mount panel once per page
buildPanel();

// Listen from background (Alt+E)
chrome.runtime.onMessage.addListener((msg)=>{
  if (msg?.type === "TOGGLE_PANEL") togglePanel();
});
// --- message API for popup ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case "EA_GET_TEXT":
          sendResponse({ ok:true, text: getPageText() }); break;
        case "EA_GET_SELECTION":
          sendResponse({ ok:true, text: window.getSelection()?.toString() || "" }); break;
        case "EA_SPEAK":
          speak(msg.text||""); sendResponse({ ok:true }); break;
        case "EA_STOP_TTS":
          stopSpeaking(); sendResponse({ ok:true }); break;
        case "EA_TOGGLE_FOCUS":
          toggleFocus(); sendResponse({ ok:true }); break;
        case "EA_TOGGLE_CAPTIONS":
          await toggleCaptions(); sendResponse({ ok:true }); break;
        case "EA_DESCRIBE_IMAGES":
          await describeMissingAlt(); sendResponse({ ok:true }); break;
        case "EA_SHOW_MODAL":
          showModal(msg.title||"EnableAI", msg.content||""); sendResponse({ ok:true }); break;
        default:
          // ignore
          break;
      }
    } catch (e) {
      try { sendResponse({ ok:false, error: String(e) }); } catch {}
    }
  })();
  return true;
});

document.addEventListener("keydown", (e) => {
  const isAltE = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyE";
  if (!isAltE) return;

  // Prevent triggering inside inputs or textareas
  const tag = (e.target.tagName || "").toLowerCase();
  if (["input", "textarea"].includes(tag) || e.target.isContentEditable) return;

  e.preventDefault();
  togglePanel(); // use the same function you already have
}, true);
