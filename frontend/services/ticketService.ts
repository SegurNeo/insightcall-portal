import { generateUUID } from '@/lib/utils';

export interface Ticket {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
  conversationId: string;
  createdAt: number;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

class TicketService {
  private STORAGE_KEY = 'tickets';

  private getTickets(): Ticket[] {
    const ticketsJson = localStorage.getItem(this.STORAGE_KEY);
    return ticketsJson ? JSON.parse(ticketsJson) : [];
  }

  private saveTickets(tickets: Ticket[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
  }

  async createTicket(data: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
    const tickets = this.getTickets();
    const newTicket: Ticket = {
      ...data,
      id: generateUUID(),
      createdAt: Date.now()
    };
    
    tickets.push(newTicket);
    this.saveTickets(tickets);
    return newTicket;
  }

  async getTicketsByConversationId(conversationId: string): Promise<Ticket[]> {
    const tickets = this.getTickets();
    return tickets.filter(ticket => ticket.conversationId === conversationId);
  }

  async updateTicket(ticketId: string, data: Partial<Omit<Ticket, 'id'>>): Promise<Ticket | null> {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    
    if (index === -1) return null;
    
    tickets[index] = {
      ...tickets[index],
      ...data
    };
    
    this.saveTickets(tickets);
    return tickets[index];
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    const tickets = this.getTickets();
    const filteredTickets = tickets.filter(t => t.id !== ticketId);
    
    if (filteredTickets.length === tickets.length) return false;
    
    this.saveTickets(filteredTickets);
    return true;
  }
}

export const ticketService = new TicketService(); 