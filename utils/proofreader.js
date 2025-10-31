export async function proofreadText(text, explainLanguage = 'en') {
  try {
    if ('Proofreader' in self && typeof Proofreader.availability === 'function') {
      const a = await Proofreader.availability();
      if (a !== 'unavailable') {
        const p = await Proofreader.create({ explanationLanguage: explainLanguage });
        // Different Chrome builds may expose different method names; detect safely.
        const methodName = ['correct', 'proofread', 'check', 'revise', 'edit', 'correctText']
          .find((m) => typeof p?.[m] === 'function');

        if (methodName) {
          const out = await p[methodName](text, { includeExplanations: true, includeLabels: true });
          const corrected = typeof out === 'string' ? out : (out?.corrected ?? out?.text ?? '');
          const explanations = Array.isArray(out?.explanations) ? out.explanations : [];
          return { corrected: corrected || text, explanations };
        }
      }
    }
  } catch (e) {
    // Swallow and fall back below to a safe, consistent shape
  }
  // Fallback keeps API stable for callers
  return { corrected: text, explanations: [] };
}
