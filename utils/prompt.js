export async function promptDescribeImage(imageArrayBuffer) {
  // Check for LanguageModel API availability
  if (!('LanguageModel' in self)) return '(image)';
  const available = await LanguageModel.availability({
    expectedInputs: [{ type: 'image', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  });
  if (available === 'unavailable') return '(image)';

  // Create a session
  const session = await LanguageModel.create({
    expectedInputs: [{ type: 'image', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
    initialPrompts: [
      {
        role: 'system',
        content: 'Generate concise, objective ALT text for accessibility. Avoid "image of". Limit to 20 words.'
      }
    ]
  });

  // Send image to Gemini
  const file = new Blob([imageArrayBuffer]);
  const result = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'Describe this image for ALT text (max 20 words, objective).' },
        { type: 'image', value: file }
      ]
    }
  ]);

  // 🧠 Extract and normalize text response
  const desc =
    typeof result === 'string'
      ? result
      : result?.output ||
        result?.text ||
        result?.candidates?.[0]?.output ||
        result?.[0]?.output ||
        '(image)';

  // Always return a clean string to background.js
  return desc.trim();
}

export async function promptTranscribeAudio(audioArrayBuffer){
  if (!('LanguageModel' in self)) return '';
  const available = await LanguageModel.availability({ expectedInputs:[{type:'audio',languages:['en']}], expectedOutputs:[{type:'text',languages:['en']}] });
  if (available==='unavailable') return '';
  const session = await LanguageModel.create({
    expectedInputs:[{type:'audio',languages:['en']}], expectedOutputs:[{type:'text',languages:['en']}],
    initialPrompts:[{ role:'system', content:'You are a real-time captioner. Output only transcript.' }]
  });
  const file = new Blob([audioArrayBuffer], { type:'audio/webm' });
  const result = await session.prompt([{ role:'user', content:[ {type:'text', value:'Transcribe with punctuation:'}, {type:'audio', value:file} ] }]);
  return result;
}