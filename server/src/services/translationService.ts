import { generateStructuredResponse } from '../lib/gemini';

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
      
      const prompt = `
Analiza el siguiente texto y determina:
1. ¿Está en inglés, español o es ambiguo?
2. Si está en inglés, tradúcelo al español manteniendo el contexto de seguros/telecomunicaciones
3. Si ya está en español, devuélvelo igual

TEXTO A ANALIZAR:
"${text}"

Responde en JSON con este formato exacto:
{
  "detectedLanguage": "en|es|unknown",
  "translatedText": "texto traducido o original si ya estaba en español",
  "confidence": 0.95
}

IMPORTANTE: 
- Si detectas inglés, traduce profesionalmente al español
- Si ya está en español, copia el texto original sin cambios
- Mantén la terminología de seguros (póliza, correduría, etc.)
`;

      const response = await generateStructuredResponse<{
        detectedLanguage: string;
        translatedText: string;
        confidence: number;
      }>(prompt);

      // Validar respuesta
      if (!response || !response.translatedText) {
        console.warn('[TranslationService] Respuesta de Gemini inválida, usando texto original');
        return {
          originalText: text,
          translatedText: text,
          detectedLanguage: 'unknown',
          confidence: 0.5
        };
      }

      const result: TranslationResult = {
        originalText: text,
        translatedText: response.translatedText,
        detectedLanguage: this.normalizeLanguage(response.detectedLanguage),
        confidence: Math.max(0, Math.min(1, response.confidence || 0.8))
      };

      console.log(`[TranslationService] Resultado:`, {
        detected: result.detectedLanguage,
        changed: result.originalText !== result.translatedText,
        confidence: result.confidence
      });

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
   * Normaliza el idioma detectado
   */
  private normalizeLanguage(detectedLang: string): 'en' | 'es' | 'unknown' {
    const lang = detectedLang?.toLowerCase();
    if (lang === 'en' || lang === 'english' || lang === 'inglés') return 'en';
    if (lang === 'es' || lang === 'spanish' || lang === 'español') return 'es';
    return 'unknown';
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