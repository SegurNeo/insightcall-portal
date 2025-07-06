import { useState, useCallback } from 'react';
import { VoiceCallUIState, TestScenario, VoiceCallResponse } from '@shared/types/voiceCalls.types';
import { voiceCallsService, TEST_SCENARIOS } from '../services/voiceCallsService';

export const useVoiceCalls = () => {
  const [state, setState] = useState<VoiceCallUIState>({
    isLoading: false,
    error: null,
    lastResponse: null,
    testResults: []
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLastResponse = useCallback((response: VoiceCallResponse | null) => {
    setState(prev => ({ ...prev, lastResponse: response }));
  }, []);

  const updateTestResult = useCallback((scenarioName: string, status: 'pending' | 'success' | 'error', response?: VoiceCallResponse, error?: string) => {
    setState(prev => ({
      ...prev,
      testResults: prev.testResults.map(result => 
        result.scenario === scenarioName 
          ? { ...result, status, response, error }
          : result
      )
    }));
  }, []);

  const initializeTestResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      testResults: TEST_SCENARIOS.map(scenario => ({
        scenario: scenario.name,
        status: 'pending' as const,
      }))
    }));
  }, []);

  const sendVoiceCall = useCallback(async (payload: any, apiKey?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceCallsService.sendVoiceCall(payload, apiKey);
      setLastResponse(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLastResponse]);

  const getVoiceCall = useCallback(async (callId: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceCallsService.getVoiceCall(callId, apiKey);
      setLastResponse(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLastResponse]);

  const getRecentVoiceCalls = useCallback(async (limit: number = 10, apiKey?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceCallsService.getRecentVoiceCalls(limit, apiKey);
      setLastResponse(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLastResponse]);

  const getStats = useCallback(async (apiKey?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceCallsService.getStats(apiKey);
      setLastResponse(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLastResponse]);

  const healthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceCallsService.healthCheck();
      setLastResponse(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLastResponse]);

  const runTestScenario = useCallback(async (scenario: TestScenario, apiKey?: string) => {
    updateTestResult(scenario.name, 'pending');
    
    try {
      const result = await voiceCallsService.runTestScenario(scenario, apiKey);
      
      if (result.success) {
        updateTestResult(scenario.name, 'success', result.response);
      } else {
        updateTestResult(scenario.name, 'error', undefined, result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      updateTestResult(scenario.name, 'error', undefined, errorMessage);
      throw error;
    }
  }, [updateTestResult]);

  const runAllTestScenarios = useCallback(async (apiKey?: string) => {
    initializeTestResults();
    setLoading(true);
    
    const results = [];
    
    for (const scenario of TEST_SCENARIOS) {
      try {
        const result = await runTestScenario(scenario, apiKey);
        results.push({ scenario: scenario.name, ...result });
        
        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({ 
          scenario: scenario.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }
    
    setLoading(false);
    return results;
  }, [initializeTestResults, setLoading, runTestScenario]);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      lastResponse: null,
      testResults: []
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    sendVoiceCall,
    getVoiceCall,
    getRecentVoiceCalls,
    getStats,
    healthCheck,
    runTestScenario,
    runAllTestScenarios,
    clearResults,
    
    // Test scenarios
    testScenarios: TEST_SCENARIOS,
  };
}; 