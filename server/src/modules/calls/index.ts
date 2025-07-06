import { CallProcessingService } from './services/call-processing.service';
export { segurneoService } from './services/segurneo.service';
export { CallProcessingService as CallService } from './services/call-processing.service';
export const callService = new CallProcessingService(); 