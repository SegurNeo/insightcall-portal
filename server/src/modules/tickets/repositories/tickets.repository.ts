import { supabase } from '@/supabase/client';
import { Ticket, TicketInsert, TicketUpdate } from '@/types/supabase.types';

export class TicketsRepository {
  private static readonly TABLE_NAME = 'tickets';

  async findById(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching ticket: ${error.message}`);
    }

    return data as Ticket | null;
  }

  async findByConversationId(conversationId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      throw new Error(`Error fetching tickets by conversation: ${error.message}`);
    }

    return data as Ticket[];
  }

  async create(ticket: TicketInsert): Promise<Ticket> {
    const { data, error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .insert(ticket)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating ticket: ${error.message}`);
    }

    return data as Ticket;
  }

  async update(id: string, updates: TicketUpdate): Promise<Ticket> {
    const { data, error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating ticket: ${error.message}`);
    }

    return data as Ticket;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting ticket: ${error.message}`);
    }
  }

  async findByStatus(status: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from(TicketsRepository.TABLE_NAME)
      .select('*')
      .eq('status', status);

    if (error) {
      throw new Error(`Error fetching tickets by status: ${error.message}`);
    }

    return data as Ticket[];
  }
} 