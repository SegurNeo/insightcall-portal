interface TranslationResponse {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
}

class TranslationService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  async translateToSpanish(text: string, apiKey?: string): Promise<TranslationResponse> {
    if (!text || text.trim().length === 0) {
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: 'unknown',
        toLanguage: 'es'
      };
    }

    // Si ya está en español, no traducir
    if (this.isSpanish(text)) {
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: 'es',
        toLanguage: 'es'
      };
    }

    try {
      if (!apiKey) {
        throw new Error('API key requerida para traducción');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un traductor profesional. Traduce el texto al español manteniendo el tono y significado original. Responde SOLO con la traducción, sin comentarios adicionales.'
            },
            {
              role: 'user',
              content: `Traduce al español: ${text}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Error de traducción: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim() || text;

      return {
        translatedText,
        originalText: text,
        fromLanguage: 'auto',
        toLanguage: 'es'
      };

    } catch (error) {
      console.error('Error en traducción:', error);
      // En caso de error, devolver el texto original
      return {
        translatedText: text,
        originalText: text,
        fromLanguage: 'error',
        toLanguage: 'es'
      };
    }
  }

  private isSpanish(text: string): boolean {
    // Palabras comunes en español para detectar el idioma
    const spanishWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'mi', 'está', 'tiene', 'le', 'ha', 'me', 'si', 'sin', 'sobre', 'este', 'ya', 'entre', 'cuando', 'todo', 'esta', 'ser', 'son', 'dos', 'también', 'fue', 'había', 'era', 'muy', 'años', 'hasta', 'desde', 'está', 'estaba', 'estamos', 'pueden', 'como', 'llama', 'llamada', 'cliente', 'seguro', 'póliza', 'incidencia', 'ticket', 'gracias', 'buenos días', 'buenas tardes', 'hola', 'adiós'
    ];

    const lowerText = text.toLowerCase();
    const spanishWordCount = spanishWords.filter(word => 
      lowerText.includes(word)
    ).length;

    // Si encontramos más de 3 palabras españolas, asumimos que está en español
    return spanishWordCount > 3;
  }

  // Método utilitario para traducir múltiples textos
  async translateMultiple(texts: string[], apiKey?: string): Promise<TranslationResponse[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateToSpanish(text, apiKey))
    );
    return translations;
  }
}

export const translationService = new TranslationService();
export type { TranslationResponse };