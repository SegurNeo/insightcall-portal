import { Request, Response } from 'express';
import { generateStructuredResponse } from '../../lib/gemini';

interface TranslationRequest {
  text: string;
  targetLanguage?: string;
}

interface TranslationResponse {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
  processingTime: number;
}

export class TranslationController {
  
  /**
   * Traduce texto usando Gemini
   * POST /api/v1/translation/translate
   */
  async translateText(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      const { text, targetLanguage = 'es' }: TranslationRequest = req.body;

      // Validaciones
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Se requiere un texto válido para traducir'
        });
      }

      if (text.length > 2000) {
        return res.status(400).json({
          error: 'El texto es demasiado largo (máximo 2000 caracteres)'
        });
      }

      console.log(`[TranslationController] Traduciendo ${text.length} caracteres a ${targetLanguage}`);

      // Detectar si ya está en español
      if (this.isSpanish(text) && targetLanguage === 'es') {
        console.log('[TranslationController] Texto ya está en español, no es necesario traducir');
        
        const response: TranslationResponse = {
          translatedText: text,
          originalText: text,
          fromLanguage: 'es',
          toLanguage: 'es',
          processingTime: Date.now() - startTime
        };
        
        return res.json(response);
      }

      // Usar Gemini para traducción
      const prompt = `Traduce el siguiente texto al español manteniendo el tono y significado original. Responde SOLO con la traducción, sin comentarios adicionales.

Texto a traducir: ${text}`;

      console.log('[TranslationController] Enviando a Gemini...');
      
      // Usar generateStructuredResponse pero esperando texto simple
      const geminiResult = await generateStructuredResponse<{ translation: string }>(
        `${prompt}\n\nDevuelve el resultado en formato JSON: {"translation": "texto traducido aquí"}`
      );

      let translatedText = text; // fallback
      
      if (geminiResult && geminiResult.translation) {
        translatedText = geminiResult.translation.trim();
      } else {
        console.warn('[TranslationController] Respuesta de Gemini inválida, usando texto original');
      }

      const response: TranslationResponse = {
        translatedText,
        originalText: text,
        fromLanguage: 'auto',
        toLanguage: targetLanguage,
        processingTime: Date.now() - startTime
      };

      console.log(`[TranslationController] Traducción completada en ${response.processingTime}ms`);
      
      return res.json(response);

    } catch (error) {
      console.error('[TranslationController] Error en traducción:', error);
      
      // En caso de error, devolver el texto original
      const { text, targetLanguage = 'es' } = req.body;
      const response: TranslationResponse = {
        translatedText: text || '',
        originalText: text || '',
        fromLanguage: 'error',
        toLanguage: targetLanguage,
        processingTime: Date.now() - startTime
      };
      
      return res.status(500).json({
        error: 'Error en traducción',
        details: error instanceof Error ? error.message : 'Error desconocido',
        fallback: response
      });
    }
  }

  /**
   * Detecta si un texto está en español
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
   * Endpoint de prueba para verificar el servicio
   * GET /api/v1/translation/health
   */
  async healthCheck(req: Request, res: Response) {
    return res.json({
      status: 'ok',
      service: 'translation',
      timestamp: new Date().toISOString(),
      message: 'Servicio de traducción funcionando correctamente'
    });
  }
}