#!/bin/bash

echo "🎵 Script de Prueba con Archivos MP3"
echo "===================================="
echo ""

# Verificar si se proporcionó una carpeta
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la ruta a la carpeta con archivos MP3"
    echo ""
    echo "Uso: ./test-mp3.sh /ruta/a/carpeta/mp3"
    echo ""
    exit 1
fi

MP3_FOLDER="$1"

# Verificar que la carpeta existe
if [ ! -d "$MP3_FOLDER" ]; then
    echo "❌ Error: La carpeta '$MP3_FOLDER' no existe"
    exit 1
fi

# Contar archivos MP3
MP3_COUNT=$(find "$MP3_FOLDER" -name "*.mp3" | wc -l)

if [ "$MP3_COUNT" -eq 0 ]; then
    echo "❌ Error: No se encontraron archivos MP3 en la carpeta '$MP3_FOLDER'"
    exit 1
fi

echo "✅ Encontrados $MP3_COUNT archivos MP3 en la carpeta"
echo ""

# Verificar variables de entorno necesarias
echo "📋 Verificando configuración..."

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY no está configurada"
    echo "   Configúrala con: export GEMINI_API_KEY=tu-api-key"
    exit 1
fi

if [ -z "$SEGURNEO_API_KEY" ]; then
    echo "⚠️  Advertencia: SEGURNEO_API_KEY no está configurada"
    echo "   Usando valor por defecto: test-api-key"
fi

echo "✅ Configuración verificada"
echo ""

# Verificar que el backend esté corriendo
echo "🔍 Verificando que el backend esté corriendo..."
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

if ! curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "❌ Error: El backend no está respondiendo en $BACKEND_URL"
    echo "   Asegúrate de ejecutar 'npm run dev' en la carpeta server/"
    exit 1
fi

echo "✅ Backend activo en $BACKEND_URL"
echo ""

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Ejecutar el procesamiento
echo "🚀 Iniciando procesamiento de archivos MP3..."
echo "==========================================="
echo ""

npm run process-mp3 "$MP3_FOLDER" 