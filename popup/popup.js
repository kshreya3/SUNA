import { getPrefs, setPrefs } from "../utils/storage.js";

// --- Utility to wait for DOM ---
function domReady() {
  return new Promise((resolve) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
    }
  });
}

// --- Utility to wait for specific elements ---
async function waitForElements(ids, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const elements = ids.map((id) => document.getElementById(id));
    if (elements.every((el) => el)) return elements;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Popup elements not found after waiting.");
}

(async () => {
  await domReady();

  // Wait for all UI elements safely
  const [lang, rate, pitch, simplify, status, saveBtn] = await waitForElements([
    "lang",
    "rate",
    "pitch",
    "simplify",
    "status",
    "save",
  ]);

  // --- Load stored prefs ---
  try {
    const p = await getPrefs();
    if (p) {
      lang.value = p.targetLanguage || "en";
      rate.value = p.ttsRate ?? 1;
      pitch.value = p.ttsPitch ?? 1;
      simplify.value = p.simplifyLevel || "grade-6";
    }
  } catch (err) {
    console.error("Error loading prefs:", err);
  }

  // --- Save prefs ---
  async function savePrefs(showStatus = true) {
    try {
      await setPrefs({
        targetLanguage: lang.value,
        ttsRate: Number(rate.value),
        ttsPitch: Number(pitch.value),
        simplifyLevel: simplify.value,
      });
      if (showStatus) {
        status.textContent = "✅ Preferences saved!";
        status.style.color = "green";
      }
    } catch (e) {
      console.error("Save failed:", e);
      status.textContent = "⚠️ Failed to save";
      status.style.color = "red";
    }
  }

  // --- Manual Save button ---
  saveBtn.addEventListener("click", async () => {
    await savePrefs(true);
    // Close popup safely
    try {
      window.close();
    } catch {
      try {
        chrome.action.setPopup({ popup: "" });
        window.close();
      } catch (e) {
        console.warn("Force close failed:", e);
      }
    }
  });

  // --- Auto-save on any change ---
  [lang, rate, pitch, simplify].forEach((el) => {
    el.addEventListener("change", async () => {
      await savePrefs(false);
      status.textContent = "💾 Auto-saved!";
      status.style.color = "#2563eb";
      setTimeout(() => (status.textContent = ""), 1000);
    });
  });
})();
