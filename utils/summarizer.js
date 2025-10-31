export async function summarizePage(text, prefs={}){
  if (!('Summarizer' in self)) return text.slice(0,2000);
  const avail = await Summarizer.availability();
  if (avail==='unavailable') return text.slice(0,2000);
  const s = await Summarizer.create({
    type:'key-points', format:'plain-text', length:'medium',
    sharedContext:`Audience: cognitive load/dyslexia/low vision. Use short clear sentences at ${prefs.simplifyLevel||'grade-6'}.`,
    outputLanguage: prefs.targetLanguage||'en'
  });
  return await s.summarize(text, { context: 'Simplify and clarify for accessibility.' });
}