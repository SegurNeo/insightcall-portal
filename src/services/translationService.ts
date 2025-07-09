interface TranslationResponse {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
  processingTime?: number;
}

class TranslationService {

  async translateToSpanish(text: string): Promise<TranslationResponse> {
    if (!text || text.trim().length === 0) {
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: 'unknown',
        toLanguage: 'es'
      };
    }

    try {
      // Llamar al endpoint de traducción del backend
      const response = await fetch('/api/v1/translation/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          targetLanguage: 'es'
        })
      });

      if (!response.ok) {
        // Si hay error, intentar obtener el fallback del response
        const errorData = await response.json();
        if (errorData.fallback) {
          console.warn('Usando fallback del servidor:', errorData.error);
          return errorData.fallback;
        }
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result: TranslationResponse = await response.json();
      
      console.log(`✅ Traducción completada en ${result.processingTime || 0}ms`);
      return result;

    } catch (error) {
      console.error('❌ Error en traducción:', error);
      
      // Fallback: devolver texto original
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: 'error',
        toLanguage: 'es'
      };
    }
  }

  // Método utilitario para traducir múltiples textos
  async translateMultiple(texts: string[]): Promise<TranslationResponse[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateToSpanish(text))
    );
    return translations;
  }

  // Health check del servicio
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/translation/health');
      return response.ok;
    } catch (error) {
      console.error('❌ Error en health check de traducción:', error);
      return false;
    }
  }
}

export const translationService = new TranslationService();
export type { TranslationResponse };