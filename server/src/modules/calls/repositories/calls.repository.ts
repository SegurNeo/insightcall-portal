import { supabase } from '../../../lib/supabase';
import type { ProcessedCall, ProcessedCallInsert, ProcessedCallUpdate } from '../../../types/supabase.types';

class CallsRepository {
  private table = 'processed_calls';

  async findByExternalId(externalId: string): Promise<ProcessedCall | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('segurneo_external_call_id', externalId)
      .maybeSingle<ProcessedCall>();

    if (error) throw error;
    return data;
  }

  async insert(payload: ProcessedCallInsert): Promise<ProcessedCall> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single<ProcessedCall>();

    if (error) throw error;
    return data;
  }

  async update(id: string, patch: ProcessedCallUpdate): Promise<ProcessedCall> {
    const { data, error } = await supabase
      .from(this.table)
      .update(patch)
      .eq('id', id)
      .select()
      .single<ProcessedCall>();

    if (error) throw error;
    return data;
  }
}

export const callsRepository = new CallsRepository(); 