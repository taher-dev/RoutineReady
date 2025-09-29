'use server';

/**
 * @fileOverview A Genkit flow that enhances OCR accuracy using an LLM.
 *
 * - enhanceOcrAccuracy - A function that takes OCR text and returns an enhanced, corrected version.
 * - EnhanceOcrAccuracyInput - The input type for the enhanceOcrAccuracy function.
 * - EnhanceOcrAccuracyOutput - The return type for the enhanceOcrAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceOcrAccuracyInputSchema = z.object({
  ocrText: z
    .string()
    .describe('The OCR extracted text that needs to be enhanced and corrected.'),
});
export type EnhanceOcrAccuracyInput = z.infer<typeof EnhanceOcrAccuracyInputSchema>;

const EnhanceOcrAccuracyOutputSchema = z.object({
  enhancedText: z
    .string()
    .describe('The enhanced and corrected text from the OCR process.'),
});
export type EnhanceOcrAccuracyOutput = z.infer<typeof EnhanceOcrAccuracyOutputSchema>;

export async function enhanceOcrAccuracy(input: EnhanceOcrAccuracyInput): Promise<EnhanceOcrAccuracyOutput> {
  return await enhanceOcrAccuracyFlow(input);
}

const enhanceOcrAccuracyPrompt = ai.definePrompt({
  name: 'enhanceOcrAccuracyPrompt',
  input: {schema: EnhanceOcrAccuracyInputSchema},
  output: {schema: EnhanceOcrAccuracyOutputSchema},
  prompt: `You are an expert in correcting OCR text, especially for class routines.

  Please correct the following OCR text to ensure that it is accurate and readable.
  Pay special attention to correcting common OCR errors, such as misinterpreting characters or words.
  Return the corrected text.

  OCR Text: {{{ocrText}}}`,
});

const enhanceOcrAccuracyFlow = ai.defineFlow(
  {
    name: 'enhanceOcrAccuracyFlow',
    inputSchema: EnhanceOcrAccuracyInputSchema,
    outputSchema: EnhanceOcrAccuracyOutputSchema,
  },
  async input => {
    const {output} = await enhanceOcrAccuracyPrompt(input);
    return output!;
  }
);
