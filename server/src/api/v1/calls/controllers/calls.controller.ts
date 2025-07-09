import { Request, Response } from 'express';
import { callAnalysisService } from '../services/call-analysis.service';
import { callDataService } from '../services/call-data.service';

export class CallsController {
  
  /**
   * Health check for calls module
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Calls module is healthy',
        timestamp: new Date().toISOString(),
        module: 'calls',
        services: {
          analysis: 'available',
          data: 'available'
        }
      });
    } catch (error) {
      console.error('[CallsController] Health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        errors: ['An unexpected error occurred']
      });
    }
  }

  /**
   * Analyze call transcript
   */
  async analyzeCall(req: Request, res: Response): Promise<void> {
    try {
      const { transcript, metadata } = req.body;
      
      if (!transcript) {
        res.status(400).json({
          success: false,
          message: 'Transcript is required',
          errors: ['Missing transcript in request body']
        });
        return;
      }

      const analysisResult = await callAnalysisService.analyzeCallTranscript(transcript, metadata);
      
      res.status(200).json({
        success: true,
        message: 'Call analysis completed',
        data: analysisResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CallsController] Analyze call error:', error);
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        errors: ['An unexpected error occurred']
      });
    }
  }

  /**
   * Get calls list
   */
  async getCalls(req: Request, res: Response): Promise<void> {
    try {
      const filters = req.query;
      const callsResult = await callDataService.getCalls(filters);
      
      res.status(200).json({
        success: true,
        message: 'Calls retrieved successfully',
        data: callsResult.data,
        count: callsResult.count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CallsController] Get calls error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve calls',
        errors: ['An unexpected error occurred']
      });
    }
  }

  /**
   * Get specific call by ID
   */
  async getCallById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const callResult = await callDataService.getCallById(id);
      
      res.status(200).json({
        success: true,
        message: 'Call retrieved successfully',
        data: callResult.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CallsController] Get call by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve call',
        errors: ['An unexpected error occurred']
      });
    }
  }
}

export const callsController = new CallsController(); 