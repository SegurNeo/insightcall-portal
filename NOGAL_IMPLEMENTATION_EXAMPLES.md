 # 🛠️ Ejemplos de Implementación - Endpoint Nogal

Esta documentación proporciona ejemplos completos de implementación del endpoint `/api/calls` para recibir datos de Segurneo Voice en diferentes frameworks y lenguajes.

---

## 🚀 **Express.js + TypeScript (Node.js)**

### **📦 Instalación**
```bash
npm install express cors helmet express-rate-limit
npm install --save-dev @types/express @types/node typescript
```

### **📄 Tipos TypeScript**
```typescript
// types/calls.ts
export interface CallData {
  call_id: string;
  conversation_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: 'completed' | 'failed' | 'abandoned';
  cost: number;
  termination_reason?: string;
  transcript_summary?: string;
  call_successful: boolean;
  participant_count: {
    agent_messages: number;
    user_messages: number;
    total_messages: number;
  };
  audio_available: boolean;
  created_at: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  call_id?: string;
  nogal_internal_id?: string;
  errors?: string[];
}
```

### **🔧 Implementación del Endpoint**
```typescript
// routes/calls.ts
import express, { Request, Response } from 'express';
import { CallData, ApiResponse } from '../types/calls';
import { validateCallData, saveCallToDatabase, checkDuplicateConversation } from '../services/callService';

const router = express.Router();

// POST /api/calls - Receive call data from Segurneo
router.post('/calls', async (req: Request, res: Response) => {
  try {
    const callData: CallData = req.body;
    
    // 1. Validate required fields
    const validation = validateCallData(callData);
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
      return res.status(400).json(response);
    }
    
    // 2. Check for duplicate conversation_id
    const isDuplicate = await checkDuplicateConversation(callData.conversation_id);
    if (isDuplicate) {
      const response: ApiResponse = {
        success: false,
        message: 'Duplicate conversation_id already exists'
      };
      return res.status(409).json(response);
    }
    
    // 3. Save to database
    const nogalInternalId = await saveCallToDatabase(callData);
    
    // 4. Success response
    const response: ApiResponse = {
      success: true,
      message: 'Call data received successfully',
      call_id: callData.call_id,
      nogal_internal_id: nogalInternalId
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error processing call data:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
    
    res.status(500).json(response);
  }
});

export default router;
```

### **✅ Servicio de Validación**
```typescript
// services/callService.ts
import { CallData } from '../types/calls';
import { isUUID, isISO8601 } from 'validator';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCallData(data: CallData): ValidationResult {
  const errors: string[] = [];
  
  // Required fields validation
  if (!data.call_id || !isUUID(data.call_id)) {
    errors.push('call_id must be a valid UUID');
  }
  
  if (!data.conversation_id || data.conversation_id.trim() === '') {
    errors.push('conversation_id is required');
  }
  
  if (!data.agent_id || data.agent_id.trim() === '') {
    errors.push('agent_id is required');
  }
  
  if (!data.start_time || !isISO8601(data.start_time)) {
    errors.push('start_time must be valid ISO8601 format');
  }
  
  if (!data.end_time || !isISO8601(data.end_time)) {
    errors.push('end_time must be valid ISO8601 format');
  }
  
  if (typeof data.duration_seconds !== 'number' || data.duration_seconds < 0) {
    errors.push('duration_seconds must be a positive number');
  }
  
  if (!['completed', 'failed', 'abandoned'].includes(data.status)) {
    errors.push('status must be completed, failed, or abandoned');
  }
  
  if (typeof data.cost !== 'number' || data.cost < 0) {
    errors.push('cost must be a positive number');
  }
  
  if (typeof data.call_successful !== 'boolean') {
    errors.push('call_successful must be a boolean');
  }
  
  // Participant count validation
  if (!data.participant_count) {
    errors.push('participant_count is required');
  } else {
    const { agent_messages, user_messages, total_messages } = data.participant_count;
    
    if (typeof agent_messages !== 'number' || agent_messages < 0) {
      errors.push('participant_count.agent_messages must be a positive number');
    }
    
    if (typeof user_messages !== 'number' || user_messages < 0) {
      errors.push('participant_count.user_messages must be a positive number');
    }
    
    if (typeof total_messages !== 'number' || total_messages !== agent_messages + user_messages) {
      errors.push('participant_count.total_messages must equal agent_messages + user_messages');
    }
  }
  
  // Logic validation
  if (data.start_time && data.end_time) {
    const startDate = new Date(data.start_time);
    const endDate = new Date(data.end_time);
    
    if (endDate <= startDate) {
      errors.push('end_time must be after start_time');
    }
    
    const expectedDuration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    if (Math.abs(expectedDuration - data.duration_seconds) > 1) {
      errors.push('duration_seconds must match the time difference between start_time and end_time');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function checkDuplicateConversation(conversationId: string): Promise<boolean> {
  // Implement your database check here
  // Return true if conversation_id already exists
  const existingCall = await database.query(
    'SELECT id FROM voice_calls WHERE conversation_id = $1',
    [conversationId]
  );
  
  return existingCall.rows.length > 0;
}

export async function saveCallToDatabase(callData: CallData): Promise<string> {
  // Implement your database save logic here
  const result = await database.query(`
    INSERT INTO voice_calls (
      segurneo_call_id, conversation_id, agent_id, start_time, end_time,
      duration_seconds, status, cost_cents, termination_reason, transcript_summary,
      call_successful, agent_messages, user_messages, total_messages,
      audio_available, received_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16)
    RETURNING id
  `, [
    callData.call_id,
    callData.conversation_id,
    callData.agent_id,
    callData.start_time,
    callData.end_time,
    callData.duration_seconds,
    callData.status,
    callData.cost,
    callData.termination_reason,
    callData.transcript_summary,
    callData.call_successful,
    callData.participant_count.agent_messages,
    callData.participant_count.user_messages,
    callData.participant_count.total_messages,
    callData.audio_available,
    callData.created_at
  ]);
  
  return `NGH_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${result.rows[0].id}`;
}
```

---

## 🔴 **Ruby on Rails**

### **📄 Modelo**
```ruby
# app/models/voice_call.rb
class VoiceCall < ApplicationRecord
  validates :segurneo_call_id, presence: true, uniqueness: true
  validates :conversation_id, presence: true, uniqueness: true
  validates :agent_id, presence: true
  validates :duration_seconds, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: %w[completed failed abandoned] }
  validates :cost_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
  before_create :set_received_at
  
  private
  
  def set_received_at
    self.received_at = Time.current
  end
end
```

### **🔧 Controller**
```ruby
# app/controllers/api/calls_controller.rb
class Api::CallsController < ApplicationController
  before_action :authenticate_api_key, if: :api_key_required?
  
  def create
    @voice_call = VoiceCall.new(call_params)
    
    if @voice_call.save
      render json: {
        success: true,
        message: 'Call data received successfully',
        call_id: params[:call_id],
        nogal_internal_id: "NGH_#{Date.current.strftime('%Y%m%d')}_#{@voice_call.id}"
      }, status: :ok
    else
      render json: {
        success: false,
        message: 'Validation failed',
        errors: @voice_call.errors.full_messages
      }, status: :bad_request
    end
  rescue ActiveRecord::RecordNotUnique
    render json: {
      success: false,
      message: 'Duplicate conversation_id already exists'
    }, status: :conflict
  rescue StandardError => e
    Rails.logger.error "Error processing call data: #{e.message}"
    
    render json: {
      success: false,
      message: 'Internal server error'
    }, status: :internal_server_error
  end
  
  private
  
  def call_params
    params.require(:call).permit(
      :call_id, :conversation_id, :agent_id, :start_time, :end_time,
      :duration_seconds, :status, :cost, :termination_reason, :transcript_summary,
      :call_successful, :audio_available, :created_at,
      participant_count: [:agent_messages, :user_messages, :total_messages]
    ).tap do |permitted|
      # Transform nested participant_count
      if permitted[:participant_count]
        permitted[:agent_messages] = permitted[:participant_count][:agent_messages]
        permitted[:user_messages] = permitted[:participant_count][:user_messages]
        permitted[:total_messages] = permitted[:participant_count][:total_messages]
        permitted.delete(:participant_count)
      end
      
      # Transform call_id to segurneo_call_id
      permitted[:segurneo_call_id] = permitted.delete(:call_id)
      
      # Transform cost to cost_cents
      permitted[:cost_cents] = permitted.delete(:cost)
    end
  end
  
  def authenticate_api_key
    api_key = request.headers['Authorization']&.remove('Bearer ')
    
    unless api_key == Rails.application.credentials.nogal_api_key
      render json: {
        success: false,
        message: 'Invalid or missing API key'
      }, status: :unauthorized
    end
  end
  
  def api_key_required?
    Rails.env.production?
  end
end
```

---

## 🐍 **Python + FastAPI**

### **📄 Modelos Pydantic**
```python
# models/call_models.py
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import uuid

class ParticipantCount(BaseModel):
    agent_messages: int = Field(..., ge=0)
    user_messages: int = Field(..., ge=0)
    total_messages: int = Field(..., ge=0)
    
    @validator('total_messages')
    def validate_total_messages(cls, v, values):
        if 'agent_messages' in values and 'user_messages' in values:
            expected_total = values['agent_messages'] + values['user_messages']
            if v != expected_total:
                raise ValueError('total_messages must equal agent_messages + user_messages')
        return v

class CallData(BaseModel):
    call_id: str = Field(..., description="UUID of the call")
    conversation_id: str = Field(..., min_length=1)
    agent_id: str = Field(..., min_length=1)
    start_time: datetime
    end_time: datetime
    duration_seconds: int = Field(..., ge=0)
    status: str = Field(..., regex="^(completed|failed|abandoned)$")
    cost: int = Field(..., ge=0)
    termination_reason: Optional[str] = None
    transcript_summary: Optional[str] = None
    call_successful: bool
    participant_count: ParticipantCount
    audio_available: bool
    created_at: datetime
    
    @validator('call_id')
    def validate_call_id(cls, v):
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('call_id must be a valid UUID')
        return v
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v
    
    @validator('duration_seconds')
    def validate_duration(cls, v, values):
        if 'start_time' in values and 'end_time' in values:
            expected_duration = int((values['end_time'] - values['start_time']).total_seconds())
            if abs(v - expected_duration) > 1:
                raise ValueError('duration_seconds must match time difference')
        return v

class ApiResponse(BaseModel):
    success: bool
    message: str
    call_id: Optional[str] = None
    nogal_internal_id: Optional[str] = None
    errors: Optional[list] = None
```

### **🔧 Endpoint FastAPI**
```python
# main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models.call_models import CallData, ApiResponse
from database import get_db_session, VoiceCall
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from datetime import date

app = FastAPI(title="Nogal Voice Calls API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    
    api_key = authorization.replace("Bearer ", "")
    # Replace with your actual API key validation
    if api_key != "your_secret_nogal_api_key":
        raise HTTPException(status_code=401, detail="Invalid API key")

@app.post("/api/calls", response_model=ApiResponse)
async def receive_call_data(
    call_data: CallData,
    db: Session = Depends(get_db_session),
    api_key: str = Depends(verify_api_key)
):
    """Receive call data from Segurneo Voice middleware"""
    try:
        # Check for duplicate conversation_id
        existing_call = db.query(VoiceCall).filter(
            VoiceCall.conversation_id == call_data.conversation_id
        ).first()
        
        if existing_call:
            return JSONResponse(
                status_code=409,
                content={
                    "success": False,
                    "message": "Duplicate conversation_id already exists"
                }
            )
        
        # Create new voice call record
        voice_call = VoiceCall(
            segurneo_call_id=call_data.call_id,
            conversation_id=call_data.conversation_id,
            agent_id=call_data.agent_id,
            start_time=call_data.start_time,
            end_time=call_data.end_time,
            duration_seconds=call_data.duration_seconds,
            status=call_data.status,
            cost_cents=call_data.cost,
            termination_reason=call_data.termination_reason,
            transcript_summary=call_data.transcript_summary,
            call_successful=call_data.call_successful,
            agent_messages=call_data.participant_count.agent_messages,
            user_messages=call_data.participant_count.user_messages,
            total_messages=call_data.participant_count.total_messages,
            audio_available=call_data.audio_available,
            created_at=call_data.created_at
        )
        
        db.add(voice_call)
        db.commit()
        db.refresh(voice_call)
        
        nogal_internal_id = f"NGH_{date.today().strftime('%Y%m%d')}_{voice_call.id}"
        
        return ApiResponse(
            success=True,
            message="Call data received successfully",
            call_id=call_data.call_id,
            nogal_internal_id=nogal_internal_id
        )
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {e}")
        
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "message": "Duplicate conversation_id already exists"
            }
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing call data: {e}")
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error"
            }
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "nogal-voice-api"}
```

---

## 🏗️ **Django + Django REST Framework**

### **📄 Modelo Django**
```python
# models.py
from django.db import models
import uuid

class VoiceCall(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('abandoned', 'Abandoned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    segurneo_call_id = models.UUIDField(unique=True)
    conversation_id = models.CharField(max_length=255, unique=True)
    agent_id = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_seconds = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    cost_cents = models.PositiveIntegerField(default=0)
    termination_reason = models.TextField(blank=True, null=True)
    transcript_summary = models.TextField(blank=True, null=True)
    call_successful = models.BooleanField(default=False)
    agent_messages = models.PositiveIntegerField(default=0)
    user_messages = models.PositiveIntegerField(default=0)
    total_messages = models.PositiveIntegerField(default=0)
    audio_available = models.BooleanField(default=False)
    received_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField()
    
    class Meta:
        db_table = 'voice_calls'
        indexes = [
            models.Index(fields=['conversation_id']),
            models.Index(fields=['agent_id']),
            models.Index(fields=['start_time']),
            models.Index(fields=['received_at']),
        ]
```

### **📄 Serializer**
```python
# serializers.py
from rest_framework import serializers
from .models import VoiceCall

class ParticipantCountSerializer(serializers.Serializer):
    agent_messages = serializers.IntegerField(min_value=0)
    user_messages = serializers.IntegerField(min_value=0)
    total_messages = serializers.IntegerField(min_value=0)
    
    def validate(self, data):
        if data['total_messages'] != data['agent_messages'] + data['user_messages']:
            raise serializers.ValidationError(
                "total_messages must equal agent_messages + user_messages"
            )
        return data

class CallDataSerializer(serializers.Serializer):
    call_id = serializers.UUIDField()
    conversation_id = serializers.CharField(max_length=255)
    agent_id = serializers.CharField(max_length=255)
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    duration_seconds = serializers.IntegerField(min_value=0)
    status = serializers.ChoiceField(choices=['completed', 'failed', 'abandoned'])
    cost = serializers.IntegerField(min_value=0)
    termination_reason = serializers.CharField(required=False, allow_blank=True)
    transcript_summary = serializers.CharField(required=False, allow_blank=True)
    call_successful = serializers.BooleanField()
    participant_count = ParticipantCountSerializer()
    audio_available = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    
    def validate(self, data):
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError("end_time must be after start_time")
        
        expected_duration = int((data['end_time'] - data['start_time']).total_seconds())
        if abs(data['duration_seconds'] - expected_duration) > 1:
            raise serializers.ValidationError(
                "duration_seconds must match time difference between start_time and end_time"
            )
        
        return data
```

### **🔧 View Django REST**
```python
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from .models import VoiceCall
from .serializers import CallDataSerializer
import logging
from datetime import date

logger = logging.getLogger(__name__)

class CallDataView(APIView):
    def post(self, request):
        """Receive call data from Segurneo Voice middleware"""
        serializer = CallDataSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': list(serializer.errors.values())
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            # Create voice call record
            voice_call = VoiceCall.objects.create(
                segurneo_call_id=data['call_id'],
                conversation_id=data['conversation_id'],
                agent_id=data['agent_id'],
                start_time=data['start_time'],
                end_time=data['end_time'],
                duration_seconds=data['duration_seconds'],
                status=data['status'],
                cost_cents=data['cost'],
                termination_reason=data.get('termination_reason', ''),
                transcript_summary=data.get('transcript_summary', ''),
                call_successful=data['call_successful'],
                agent_messages=data['participant_count']['agent_messages'],
                user_messages=data['participant_count']['user_messages'],
                total_messages=data['participant_count']['total_messages'],
                audio_available=data['audio_available'],
                created_at=data['created_at']
            )
            
            nogal_internal_id = f"NGH_{date.today().strftime('%Y%m%d')}_{voice_call.id}"
            
            return Response({
                'success': True,
                'message': 'Call data received successfully',
                'call_id': str(data['call_id']),
                'nogal_internal_id': nogal_internal_id
            }, status=status.HTTP_200_OK)
            
        except IntegrityError:
            return Response({
                'success': False,
                'message': 'Duplicate conversation_id already exists'
            }, status=status.HTTP_409_CONFLICT)
            
        except Exception as e:
            logger.error(f"Error processing call data: {e}")
            return Response({
                'success': False,
                'message': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

---

## 🧪 **Testing de los Endpoints**

### **📄 Script de Testing Universal**
```bash
#!/bin/bash

# Test script que funciona con cualquier implementación
ENDPOINT_URL="https://dashboard.nogal.local/api/calls"
API_KEY="your_secret_api_key"

echo "🧪 Testing Nogal Endpoint: $ENDPOINT_URL"

# Test 1: Successful call
echo "✅ Testing successful call..."
curl -X POST $ENDPOINT_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "call_id": "'$(uuidgen)'",
    "conversation_id": "test_'$(date +%s)'",
    "agent_id": "test_agent",
    "start_time": "2025-01-27T14:30:00.000Z",
    "end_time": "2025-01-27T14:35:30.000Z",
    "duration_seconds": 330,
    "status": "completed",
    "cost": 1250,
    "termination_reason": "end_call tool was called",
    "transcript_summary": "Test call summary",
    "call_successful": true,
    "participant_count": {
      "agent_messages": 5,
      "user_messages": 4,
      "total_messages": 9
    },
    "audio_available": true,
    "created_at": "2025-01-27T14:36:00.000Z"
  }'

echo -e "\n\n❌ Testing validation error..."
curl -X POST $ENDPOINT_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "call_id": "invalid-uuid",
    "conversation_id": "",
    "agent_id": "test_agent",
    "duration_seconds": -100
  }'

echo -e "\n\n🔐 Testing auth error..."
curl -X POST $ENDPOINT_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_key" \
  -d '{}'
```

---

## 🚀 **¡Implementación Lista!**

Con estos ejemplos, el equipo de Nogal puede implementar el endpoint en su framework preferido. Todos los ejemplos incluyen:

- ✅ **Validación completa** de datos de entrada
- ✅ **Manejo de errores** apropiado 
- ✅ **Respuestas consistentes** según la especificación
- ✅ **Autenticación** con API key
- ✅ **Prevención de duplicados** por `conversation_id`
- ✅ **Logging** para debugging
- ✅ **Tests** incluidos

¿Necesitas ayuda con algún framework específico o tienes dudas sobre la implementación? 🤔 