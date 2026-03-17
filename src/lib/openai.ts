import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not defined in environment variables');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

export const MODELS = {
  transcription: 'whisper-1',
  extraction: 'gpt-4o-mini', // Cost-effective model for extraction
  reasoning: 'gpt-4o', // More powerful model for complex reasoning if needed
};
