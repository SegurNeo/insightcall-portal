#!/bin/bash

echo "🚀 PROBANDO SISTEMA NOGAL CON GEMINI"
echo "========================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api/v1"

echo ""
echo -e "${YELLOW}1. PROBANDO HEALTH CHECK DEL API...${NC}"
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Error en health check"

echo ""
echo -e "${YELLOW}2. PROBANDO HEALTH CHECK DE TRADUCCIÓN...${NC}"
curl -s "$BASE_URL/translation/health" | jq '.' || echo "❌ Error en translation health"

echo ""
echo -e "${YELLOW}3. PROBANDO TRADUCCIÓN BÁSICA...${NC}"
curl -s -X POST "$BASE_URL/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Customer called about insurance inquiry and wants to cancel policy"
  }' | jq '.' || echo "❌ Error en traducción"

echo ""
echo -e "${YELLOW}4. PROBANDO TRADUCCIÓN COMPLEJA...${NC}"
curl -s -X POST "$BASE_URL/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The customer is experiencing difficulties with their claim processing and requires immediate assistance to resolve billing discrepancies."
  }' | jq '.' || echo "❌ Error en traducción compleja"

echo ""
echo -e "${YELLOW}5. PROBANDO TEXTO YA EN ESPAÑOL...${NC}"
curl -s -X POST "$BASE_URL/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "El cliente llamó para consultar sobre su póliza de seguro de coche"
  }' | jq '.' || echo "❌ Error con texto en español"

echo ""
echo -e "${YELLOW}6. PROBANDO ERROR HANDLING...${NC}"
curl -s -X POST "$BASE_URL/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "❌ Error en manejo de errores"

echo ""
echo -e "${GREEN}✅ PRUEBAS COMPLETADAS${NC}"
echo "Si todo funciona, deberías ver respuestas JSON con traducciones en español"
echo ""
echo "📝 Para probar el dashboard completo:"
echo "   1. npm run dev (en la carpeta raíz)"
echo "   2. Ve a http://localhost:5173"
echo "   3. Navega a la página de llamadas"