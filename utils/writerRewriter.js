export async function rewriteText(text, style = 'grade-6') {
  if ('Rewriter' in self && typeof Rewriter.availability === 'function') {
    const availability = await Rewriter.availability();
    if (availability !== 'unavailable') {
      // ✅ Remove tone/length completely for compatibility
      const rewriter = await Rewriter.create({
        guidance: `Rephrase this text to a ${style} reading level. Use short, clear sentences and accessible language.`
      });

      const result = await rewriter.rewrite(text);

      console.log("🧠 Rewriter result:", result);
      return result;
    }
  }

  // fallback if API unavailable
  return text.replace(/[,;:()\-]/g, '.').replace(/\s{2,}/g, ' ');
}

export async function writeText(task, context = '') {
  if ('Writer' in self && typeof Writer.availability === 'function') {
    const availability = await Writer.availability();
    if (availability !== 'unavailable') {
      // ✅ Same here: omit tone/length, keep guidance only
      const writer = await Writer.create({
        guidance: 'Write concise, accessibility-focused text.'
      });

      const result = await writer.write(task, { context });

      console.log("🧠 Writer result:", result);
      return result;
    }
  }

  // fallback if Writer API unavailable
  return `${task}\n${context}`;
}
