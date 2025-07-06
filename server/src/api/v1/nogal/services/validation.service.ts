import { VoiceCallPayload, ValidationResult, ValidationError, VOICE_CALL_STATUSES } from '../../../../types/voiceCalls.types';

export class ValidationService {
  
  validateVoiceCallPayload(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      // Check if data exists
      if (!data || typeof data !== 'object') {
        errors.push({ field: 'payload', message: 'Request body must be a valid JSON object' });
        return { isValid: false, errors };
      }
      
      // Required fields validation
      this.validateCallId(data.call_id, errors);
      this.validateConversationId(data.conversation_id, errors);
      this.validateAgentId(data.agent_id, errors);
      this.validateTimestamps(data, errors);
      this.validateDuration(data.duration_seconds, errors);
      this.validateStatus(data.status, errors);
      this.validateCost(data.cost, errors);
      this.validateCallSuccessful(data.call_successful, errors);
      this.validateParticipantCount(data.participant_count, errors);
      this.validateAudioAvailable(data.audio_available, errors);
      this.validateCreatedAt(data.created_at, errors);
      
      // Optional fields validation
      if (data.termination_reason !== undefined && data.termination_reason !== null) {
        this.validateTerminationReason(data.termination_reason, errors);
      }
      
      if (data.transcript_summary !== undefined && data.transcript_summary !== null) {
        this.validateTranscriptSummary(data.transcript_summary, errors);
      }
      
      // Cross-field validations
      this.validateTimeLogic(data, errors);
      this.validateParticipantLogic(data, errors);
      
    } catch (error) {
      errors.push({ 
        field: 'validation', 
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validateCallId(callId: any, errors: ValidationError[]): void {
    if (!callId) {
      errors.push({ field: 'call_id', message: 'call_id is required' });
      return;
    }
    
    if (typeof callId !== 'string') {
      errors.push({ field: 'call_id', message: 'call_id must be a string' });
      return;
    }
    
    // UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(callId)) {
      errors.push({ field: 'call_id', message: 'call_id must be a valid UUID v4' });
    }
  }
  
  private validateConversationId(conversationId: any, errors: ValidationError[]): void {
    if (!conversationId) {
      errors.push({ field: 'conversation_id', message: 'conversation_id is required' });
      return;
    }
    
    if (typeof conversationId !== 'string') {
      errors.push({ field: 'conversation_id', message: 'conversation_id must be a string' });
      return;
    }
    
    if (conversationId.trim().length === 0) {
      errors.push({ field: 'conversation_id', message: 'conversation_id cannot be empty' });
      return;
    }
    
    if (conversationId.length > 255) {
      errors.push({ field: 'conversation_id', message: 'conversation_id cannot exceed 255 characters' });
    }
  }
  
  private validateAgentId(agentId: any, errors: ValidationError[]): void {
    if (!agentId) {
      errors.push({ field: 'agent_id', message: 'agent_id is required' });
      return;
    }
    
    if (typeof agentId !== 'string') {
      errors.push({ field: 'agent_id', message: 'agent_id must be a string' });
      return;
    }
    
    if (agentId.trim().length === 0) {
      errors.push({ field: 'agent_id', message: 'agent_id cannot be empty' });
      return;
    }
    
    if (agentId.length > 255) {
      errors.push({ field: 'agent_id', message: 'agent_id cannot exceed 255 characters' });
    }
  }
  
  private validateTimestamps(data: any, errors: ValidationError[]): void {
    // Validate start_time
    if (!data.start_time) {
      errors.push({ field: 'start_time', message: 'start_time is required' });
    } else if (!this.isValidISO8601(data.start_time)) {
      errors.push({ field: 'start_time', message: 'start_time must be a valid ISO8601 timestamp' });
    }
    
    // Validate end_time
    if (!data.end_time) {
      errors.push({ field: 'end_time', message: 'end_time is required' });
    } else if (!this.isValidISO8601(data.end_time)) {
      errors.push({ field: 'end_time', message: 'end_time must be a valid ISO8601 timestamp' });
    }
  }
  
  private validateDuration(duration: any, errors: ValidationError[]): void {
    if (duration === undefined || duration === null) {
      errors.push({ field: 'duration_seconds', message: 'duration_seconds is required' });
      return;
    }
    
    if (typeof duration !== 'number' || !Number.isInteger(duration)) {
      errors.push({ field: 'duration_seconds', message: 'duration_seconds must be an integer' });
      return;
    }
    
    if (duration < 0) {
      errors.push({ field: 'duration_seconds', message: 'duration_seconds must be non-negative' });
    }
    
    if (duration > 86400) { // 24 hours
      errors.push({ field: 'duration_seconds', message: 'duration_seconds cannot exceed 24 hours (86400 seconds)' });
    }
  }
  
  private validateStatus(status: any, errors: ValidationError[]): void {
    if (!status) {
      errors.push({ field: 'status', message: 'status is required' });
      return;
    }
    
    if (typeof status !== 'string') {
      errors.push({ field: 'status', message: 'status must be a string' });
      return;
    }
    
    if (!VOICE_CALL_STATUSES.includes(status as any)) {
      errors.push({ 
        field: 'status', 
        message: `status must be one of: ${VOICE_CALL_STATUSES.join(', ')}` 
      });
    }
  }
  
  private validateCost(cost: any, errors: ValidationError[]): void {
    if (cost === undefined || cost === null) {
      errors.push({ field: 'cost', message: 'cost is required' });
      return;
    }
    
    if (typeof cost !== 'number' || !Number.isInteger(cost)) {
      errors.push({ field: 'cost', message: 'cost must be an integer (in cents)' });
      return;
    }
    
    if (cost < 0) {
      errors.push({ field: 'cost', message: 'cost must be non-negative' });
    }
    
    if (cost > 100000000) { // 1M euros in cents
      errors.push({ field: 'cost', message: 'cost cannot exceed 1,000,000 euros' });
    }
  }
  
  private validateCallSuccessful(callSuccessful: any, errors: ValidationError[]): void {
    if (callSuccessful === undefined || callSuccessful === null) {
      errors.push({ field: 'call_successful', message: 'call_successful is required' });
      return;
    }
    
    if (typeof callSuccessful !== 'boolean') {
      errors.push({ field: 'call_successful', message: 'call_successful must be a boolean' });
    }
  }
  
  private validateParticipantCount(participantCount: any, errors: ValidationError[]): void {
    if (!participantCount) {
      errors.push({ field: 'participant_count', message: 'participant_count is required' });
      return;
    }
    
    if (typeof participantCount !== 'object') {
      errors.push({ field: 'participant_count', message: 'participant_count must be an object' });
      return;
    }
    
    // Validate agent_messages
    if (typeof participantCount.agent_messages !== 'number' || !Number.isInteger(participantCount.agent_messages)) {
      errors.push({ field: 'participant_count.agent_messages', message: 'agent_messages must be an integer' });
    } else if (participantCount.agent_messages < 0) {
      errors.push({ field: 'participant_count.agent_messages', message: 'agent_messages must be non-negative' });
    }
    
    // Validate user_messages
    if (typeof participantCount.user_messages !== 'number' || !Number.isInteger(participantCount.user_messages)) {
      errors.push({ field: 'participant_count.user_messages', message: 'user_messages must be an integer' });
    } else if (participantCount.user_messages < 0) {
      errors.push({ field: 'participant_count.user_messages', message: 'user_messages must be non-negative' });
    }
    
    // Validate total_messages
    if (typeof participantCount.total_messages !== 'number' || !Number.isInteger(participantCount.total_messages)) {
      errors.push({ field: 'participant_count.total_messages', message: 'total_messages must be an integer' });
    } else if (participantCount.total_messages < 0) {
      errors.push({ field: 'participant_count.total_messages', message: 'total_messages must be non-negative' });
    }
  }
  
  private validateAudioAvailable(audioAvailable: any, errors: ValidationError[]): void {
    if (audioAvailable === undefined || audioAvailable === null) {
      errors.push({ field: 'audio_available', message: 'audio_available is required' });
      return;
    }
    
    if (typeof audioAvailable !== 'boolean') {
      errors.push({ field: 'audio_available', message: 'audio_available must be a boolean' });
    }
  }
  
  private validateCreatedAt(createdAt: any, errors: ValidationError[]): void {
    if (!createdAt) {
      errors.push({ field: 'created_at', message: 'created_at is required' });
      return;
    }
    
    if (!this.isValidISO8601(createdAt)) {
      errors.push({ field: 'created_at', message: 'created_at must be a valid ISO8601 timestamp' });
    }
  }
  
  private validateTerminationReason(reason: any, errors: ValidationError[]): void {
    if (typeof reason !== 'string') {
      errors.push({ field: 'termination_reason', message: 'termination_reason must be a string' });
      return;
    }
    
    if (reason.length > 1000) {
      errors.push({ field: 'termination_reason', message: 'termination_reason cannot exceed 1000 characters' });
    }
  }
  
  private validateTranscriptSummary(summary: any, errors: ValidationError[]): void {
    if (typeof summary !== 'string') {
      errors.push({ field: 'transcript_summary', message: 'transcript_summary must be a string' });
      return;
    }
    
    if (summary.length > 5000) {
      errors.push({ field: 'transcript_summary', message: 'transcript_summary cannot exceed 5000 characters' });
    }
  }
  
  private validateTimeLogic(data: any, errors: ValidationError[]): void {
    if (!this.isValidISO8601(data.start_time) || !this.isValidISO8601(data.end_time)) {
      return; // Skip if timestamps are invalid
    }
    
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    if (endTime <= startTime) {
      errors.push({ field: 'end_time', message: 'end_time must be after start_time' });
      return;
    }
    
    // Validate duration matches time difference
    if (typeof data.duration_seconds === 'number') {
      const calculatedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const tolerance = 2; // Allow 2 seconds tolerance
      
      if (Math.abs(calculatedDuration - data.duration_seconds) > tolerance) {
        errors.push({ 
          field: 'duration_seconds', 
          message: `duration_seconds (${data.duration_seconds}) does not match time difference (${calculatedDuration} seconds)` 
        });
      }
    }
  }
  
  private validateParticipantLogic(data: any, errors: ValidationError[]): void {
    const pc = data.participant_count;
    if (!pc || typeof pc !== 'object') return;
    
    const { agent_messages, user_messages, total_messages } = pc;
    
    if (typeof agent_messages === 'number' && 
        typeof user_messages === 'number' && 
        typeof total_messages === 'number') {
      
      if (total_messages !== agent_messages + user_messages) {
        errors.push({ 
          field: 'participant_count.total_messages', 
          message: `total_messages (${total_messages}) must equal agent_messages (${agent_messages}) + user_messages (${user_messages})` 
        });
      }
    }
  }
  
  private isValidISO8601(dateString: any): boolean {
    if (typeof dateString !== 'string') return false;
    
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }
}

export const validationService = new ValidationService(); 