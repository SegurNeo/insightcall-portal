#!/bin/bash

echo "🚀 Procesando llamadas pendientes..."
echo "====================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Ejecuta este script desde el directorio server/"
  exit 1
fi

# Cargar variables de entorno desde .env
if [ -f "../.env" ]; then
  echo "📋 Cargando variables de entorno desde .env..."
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# Verificar que las variables de entorno están configuradas
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY no está configurada"
  echo "   Configúrala con: export OPENAI_API_KEY='tu-api-key'"
  exit 1
fi

if [ -z "$SEGURNEO_VOICE_API_KEY" ]; then
  echo "❌ Error: SEGURNEO_VOICE_API_KEY no está configurada"
  echo "   Configúrala con: export SEGURNEO_VOICE_API_KEY='tu-api-key'"
  exit 1
fi

# Ejecutar el script
echo "🔧 Compilando..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Error en la compilación"
  exit 1
fi

echo "🎵 Procesando llamadas..."
echo "📁 Directorio de llamadas pendientes: $(pwd)/calls/pending"
ls -l calls/pending/

# Usar npx ts-node-dev para mejor logging
echo "🚀 Iniciando procesamiento con ts-node-dev..."
NODE_ENV=development npx ts-node-dev -r tsconfig-paths/register src/test/process-mp3-files.ts calls/pending

echo "🎉 Proceso completado" 