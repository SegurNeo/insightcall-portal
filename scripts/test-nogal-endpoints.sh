#!/bin/bash

# Script de testing para endpoints de Nogal
BASE_URL="https://insightcall-portal.onrender.com/api/v1/nogal/calls"
API_KEY="segurneo"

echo "🧪 Testing Nogal Dashboard Endpoints"
echo "Base URL: $BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Health Check (debería funcionar SIN autenticación)
echo "✅ Test 1: Health Check (público)"
health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/health")
health_body=$(echo $health_response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
health_status=$(echo $health_response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

echo "Status: $health_status"
echo "Response: $health_body"
echo ""

# Test 2: Create Call (debería funcionar CON autenticación)
echo "✅ Test 2: Create Call (con autenticación)"
call_id=$(uuidgen)
create_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "'$call_id'",
    "conversation_id": "test_conv_'$(date +%s)'",
    "agent_id": "test_agent_123",
    "start_time": "2025-01-27T14:30:00.000Z",
    "end_time": "2025-01-27T14:35:30.000Z",
    "duration_seconds": 330,
    "status": "completed",
    "cost": 1250,
    "termination_reason": "end_call tool was called",
    "transcript_summary": "Test call summary for Nogal integration",
    "call_successful": true,
    "participant_count": {
      "agent_messages": 5,
      "user_messages": 4,
      "total_messages": 9
    },
    "audio_available": true,
    "created_at": "2025-01-27T14:36:00.000Z"
  }')

create_body=$(echo $create_response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
create_status=$(echo $create_response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

echo "Status: $create_status"
echo "Response: $create_body"
echo ""

# Test 3: Get Call (debería funcionar CON autenticación)
if [ "$create_status" -eq 201 ]; then
  echo "✅ Test 3: Get Call (con autenticación)"
  get_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/$call_id" \
    -H "Authorization: Bearer $API_KEY")
  
  get_body=$(echo $get_response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
  get_status=$(echo $get_response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
  
  echo "Status: $get_status"
  echo "Response: $get_body"
  echo ""
fi

# Test 4: Stats (debería funcionar CON autenticación)
echo "✅ Test 4: Get Stats (con autenticación)"
stats_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/stats" \
  -H "Authorization: Bearer $API_KEY")

stats_body=$(echo $stats_response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
stats_status=$(echo $stats_response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

echo "Status: $stats_status"
echo "Response: $stats_body"
echo ""

# Test 5: Sin autenticación (debería fallar)
echo "❌ Test 5: Create Call sin autenticación (debería fallar)"
no_auth_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

no_auth_body=$(echo $no_auth_response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
no_auth_status=$(echo $no_auth_response | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

echo "Status: $no_auth_status"
echo "Response: $no_auth_body"
echo ""

# Resumen
echo "🎯 RESUMEN DE TESTS:"
echo "Health Check: $([ "$health_status" -eq 200 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Create Call: $([ "$create_status" -eq 201 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Get Call: $([ "$get_status" -eq 200 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Get Stats: $([ "$stats_status" -eq 200 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "No Auth: $([ "$no_auth_status" -eq 401 ] && echo "✅ PASS (correcto rechazo)" || echo "❌ FAIL")"
echo ""
echo "🚀 Dashboard Nogal está listo para recibir llamadas de Segurneo!" 