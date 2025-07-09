import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

import '@/styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  // Obtener la API key del servidor
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Combinar props existentes con la API key
  const enhancedProps = {
    ...pageProps,
    geminiApiKey,
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Component {...enhancedProps} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App; 