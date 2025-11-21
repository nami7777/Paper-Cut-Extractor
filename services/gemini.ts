
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionEntry } from "../types";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiKeywords = async (
  ocrText: string, 
  subject: string, 
  examples: QuestionEntry[]
): Promise<string[]> => {
  try {
    // Construct the prompt with Few-Shot examples
    let prompt = `
      You are an expert academic examiner for the subject: ${subject}.
      Your task is to analyze the following OCR text extracted from an exam question and suggest 5-10 relevant, specific keywords and topics.
      These keywords will be used for searching and organizing a repository.

      Rules:
      1. Ignore noise, artifacts, or question numbers in the OCR text.
      2. Focus on the core concepts, scientific terms, formulas, or theoretical units involved.
      3. Be concise (1-3 words per keyword).
    `;

    if (examples.length > 0) {
      prompt += `
      
      Here are examples of how the user has tagged questions in the past. Adapt your suggestions to match this style and granularity:
      `;
      
      examples.forEach((ex, i) => {
        // Truncate text slightly to save tokens if needed
        const cleanText = ex.ocrText?.slice(0, 300).replace(/\n/g, ' ') || '';
        if (cleanText) {
          prompt += `
          Example ${i + 1}:
          Text: "${cleanText}..."
          Keywords: ${JSON.stringify(ex.keywords)}
          `;
        }
      });
    }

    prompt += `
      
      Current Question Text to Analyze:
      "${ocrText}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return json.keywords || [];

  } catch (error) {
    console.error("Gemini AI Keyword Generation Failed:", error);
    // Return empty array so the UI can fallback or just show nothing
    return [];
  }
};
