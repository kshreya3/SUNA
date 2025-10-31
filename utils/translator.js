export async function translateText(text, targetLanguage = 'en') {
  if (!('Translator' in self)) return text;

  // Default source language
  let sourceLanguage = 'en';

  try {
    // Detect source language if possible
    if ('LanguageDetector' in self) {
      const det = await LanguageDetector.create();
      const r = await det.detect(text.slice(0, 4000));
      sourceLanguage = r?.[0]?.detectedLanguage || 'en';
    }
  } catch {
    sourceLanguage = 'en';
  }

  // ✅ Fix: include both sourceLanguage and targetLanguage
  const cap = await Translator.availability({ sourceLanguage, targetLanguage });
  if (cap === 'unavailable') return text;

  const t = await Translator.create({ sourceLanguage, targetLanguage });
  const result = await t.translate(text);

  return result;
}
