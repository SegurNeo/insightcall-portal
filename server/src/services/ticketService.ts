import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase/client';
import { Ticket, TicketInsert, TicketUpdate } from '@/types/supabase.types';

const TICKETS_TABLE = 'tickets';

class TicketService {
  async createTicket(payload: TicketInsert): Promise<Ticket> {
    const newTicketId = uuidv4();
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .insert([{ ...payload, id: newTicketId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      throw new Error('Could not create ticket: ' + error.message);
    }
    if (!data) {
      throw new Error('Ticket creation returned no data');
    }
    return data as Ticket;
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for 'exactly one row expected'
        return null; // Not found
      }
      console.error('Error fetching ticket by ID:', error);
      throw new Error('Could not fetch ticket: ' + error.message);
    }
    return data as Ticket | null;
  }

  async getTicketsByConversationId(conversationId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error fetching tickets by conversation ID:', error);
      throw new Error('Could not fetch tickets: ' + error.message);
    }
    return (data as Ticket[]) || [];
  }

  async listTickets(filters?: Partial<Pick<Ticket, 'status' | 'priority' | 'assignee_id' | 'type'>>): Promise<Ticket[]> {
    let query = supabase.from(TICKETS_TABLE).select('*');

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
      if (filters.type) query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing tickets:', error);
      throw new Error('Could not list tickets: ' + error.message);
    }
    return (data as Ticket[]) || [];
  }

  async updateTicket(ticketId: string, payload: TicketUpdate): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .update(payload)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      throw new Error('Could not update ticket: ' + error.message);
    }
    if (!data) {
      return null;
    }
    return data as Ticket;
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    const { error, count } = await supabase
      .from(TICKETS_TABLE)
      .delete()
      .eq('id', ticketId);

    if (error) {
      console.error('Error deleting ticket:', error);
      throw new Error('Could not delete ticket: ' + error.message);
    }
    return count !== null && count > 0;
  }
}

export const ticketService = new TicketService(); 