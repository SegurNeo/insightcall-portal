import { supabase } from '@/supabase/client';
import { ProcessedCall, ProcessedCallInsert } from '@/types/supabase.types';

export class ProcessedCallsRepository {
  private static readonly TABLE_NAME = 'processed_calls';

  async findByExternalId(externalCallId: string): Promise<ProcessedCall | null> {
    const { data, error } = await supabase
      .from(ProcessedCallsRepository.TABLE_NAME)
      .select('*')
      .eq('segurneo_external_call_id', externalCallId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching call by external ID: ${error.message}`);
    }

    return data as ProcessedCall | null;
  }

  async create(call: ProcessedCallInsert): Promise<ProcessedCall> {
    const { data, error } = await supabase
      .from(ProcessedCallsRepository.TABLE_NAME)
      .insert(call)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating processed call: ${error.message}`);
    }

    return data as ProcessedCall;
  }

  async update(id: string, updates: Partial<ProcessedCall>): Promise<ProcessedCall> {
    const { data, error } = await supabase
      .from(ProcessedCallsRepository.TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating processed call: ${error.message}`);
    }

    return data as ProcessedCall;
  }
} 