'use server';

import { enhanceOcrAccuracy as enhanceOcrAccuracyFlow } from '@/ai/flows/enhance-ocr-accuracy';

export async function enhanceOcrAccuracy(ocrText: string): Promise<{ enhancedText: string }> {
  try {
    const result = await enhanceOcrAccuracyFlow({ ocrText });
    return result;
  } catch (error) {
    console.error("Error in enhanceOcrAccuracy action:", error);
    throw new Error("Failed to enhance OCR text.");
  }
}
