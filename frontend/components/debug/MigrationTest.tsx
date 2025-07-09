// 🧪 COMPONENTE DE PRUEBA PARA MIGRACIÓN
// Componente simple para probar el nuevo sistema

import React from 'react';
import { useCallsNew } from '@/hooks/useCallsNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MigrationTest() {
  const { data, isLoading, error, testBackend } = useCallsNew();

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="text-lg">🧪 Test de Migración</CardTitle>
        <p className="text-sm text-gray-600">
          Probar conexión con el nuevo backend
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Botón de prueba */}
        <button
          onClick={testBackend}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Probando...' : 'Probar Backend'}
        </button>

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-blue-600">
            🔄 Conectando con el nuevo backend...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            ❌ Error: {error}
          </div>
        )}

        {/* Resultado exitoso */}
        {data && (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            <div className="text-green-700 font-semibold mb-2">
              ✅ Conexión exitosa!
            </div>
            <div className="text-sm space-y-1">
              <div>Total de llamadas: {data.total}</div>
              <div>Llamadas obtenidas: {data.calls.length}</div>
              <div>Página: {data.page}</div>
              
              {data.calls.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium">Primera llamada:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(data.calls[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
} 