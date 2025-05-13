
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Updated model to gemini-1.5-flash, which is more suitable for text generation tasks.
  model: 'googleai/gemini-1.5-flash', 
});

