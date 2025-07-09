import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function generateTextResponse(prompt: string, context?: string): Promise<string> {
  try {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    throw new Error(`Failed to generate Gemini response: ${error.message}`);
  }
}

export async function generateStructuredResponse<T>(
  prompt: string,
  context?: string,
  validator?: (response: any) => T
): Promise<T> {
  try {
    const response = await generateTextResponse(prompt, context);
    
    // Try to parse the response as JSON
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      throw new Error('Failed to parse Gemini response as JSON');
    }

    // If a validator is provided, use it to validate and transform the response
    if (validator) {
      return validator(parsedResponse);
    }

    return parsedResponse as T;
  } catch (error: any) {
    console.error('Error generating structured Gemini response:', error);
    throw new Error(`Failed to generate structured response: ${error.message}`);
  }
}

export const geminiClient = {
  generateTextResponse,
  generateStructuredResponse,
}; 