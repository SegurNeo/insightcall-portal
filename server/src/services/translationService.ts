import { generateTextResponse } from '../lib/gemini';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage: 'en' | 'es' | 'unknown';
  confidence: number;
}

class TranslationService {
  
  /**
   * Detecta si un texto está en inglés y lo traduce al español si es necesario
   */
  async translateToSpanish(text: string): Promise<TranslationResult> {
    try {
      console.log(`[TranslationService] Analizando texto: "${text.substring(0, 50)}..."`);
      
      // Detectar si ya está en español
      if (this.isSpanish(text)) {
        console.log('[TranslationService] Texto ya está en español');
        return {
          originalText: text,
          translatedText: text,
          detectedLanguage: 'es',
          confidence: 0.9
        };
      }

      // Usar Gemini directamente para traducir
      const prompt = `Traduce este texto al español de manera natural y profesional. Mantén el tono y significado original.

TEXTO A TRADUCIR:
${text}

TRADUCCIÓN AL ESPAÑOL:`;

      console.log('[TranslationService] Enviando a Gemini para traducción...');
      const translatedText = await generateTextResponse(prompt);

      if (!translatedText || translatedText.trim().length === 0) {
        throw new Error('Gemini devolvió una respuesta vacía');
      }

      const result: TranslationResult = {
        originalText: text,
        translatedText: translatedText.trim(),
        detectedLanguage: 'en',
        confidence: 0.9
      };

      console.log(`[TranslationService] Traducción exitosa: "${result.translatedText.substring(0, 50)}..."`);
      return result;
      
    } catch (error) {
      console.error('[TranslationService] Error en traducción:', error);
      // En caso de error, devolver texto original
      return {
        originalText: text,
        translatedText: text,
        detectedLanguage: 'unknown',
        confidence: 0.5
      };
    }
  }

  /**
   * Detecta si un texto está en español usando palabras clave
   */
  private isSpanish(text: string): boolean {
    const spanishWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'mi', 'está', 'tiene', 'le', 'ha', 'me', 'si', 'sin', 'sobre', 'este', 'ya', 'entre', 'cuando', 'todo', 'esta', 'ser', 'son', 'dos', 'también', 'fue', 'había', 'era', 'muy', 'años', 'hasta', 'desde', 'está', 'estaba', 'estamos', 'pueden', 'como', 'llama', 'llamada', 'cliente', 'seguro', 'póliza', 'incidencia', 'ticket', 'gracias', 'buenos días', 'buenas tardes', 'hola', 'adiós'
    ];

    const lowerText = text.toLowerCase();
    const spanishWordCount = spanishWords.filter(word => 
      lowerText.includes(` ${word} `) || 
      lowerText.startsWith(`${word} `) || 
      lowerText.endsWith(` ${word}`)
    ).length;

    // Si encontramos más de 3 palabras españolas, asumimos que está en español
    return spanishWordCount > 3;
  }

  /**
   * Traduce múltiples textos en lote
   */
  async translateBatch(texts: string[]): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (const text of texts) {
      if (!text || text.trim().length === 0) {
        results.push({
          originalText: text,
          translatedText: text,
          detectedLanguage: 'unknown',
          confidence: 1.0
        });
        continue;
      }
      
      const result = await this.translateToSpanish(text);
      results.push(result);
      
      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

export const translationService = new TranslationService(); 