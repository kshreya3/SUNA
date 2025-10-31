export async function detectLanguage(text){
  if (!('LanguageDetector' in self)) return { detectedLanguage:'unknown', confidence:0 };
  const avail = await LanguageDetector.availability();
  if (avail==='unavailable') return { detectedLanguage:'unknown', confidence:0 };
  const det = await LanguageDetector.create(); const r = await det.detect(text.slice(0,4000));
  return r?.[0] || { detectedLanguage:'unknown', confidence:0 };
}