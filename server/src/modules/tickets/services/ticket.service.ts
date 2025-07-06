import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketInsert, TicketUpdate, Json } from '@/types/supabase.types';
import { TicketsRepository } from '../repositories/tickets.repository';
import { nogalApiClient } from '@/modules/shared/infra';

export interface CreateTicketDTO {
  conversation_id: string;
  description: string;
  tipo_incidencia: string;
  motivo_incidencia: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  metadata?: {
    externalTicketId?: string;
    [key: string]: any;
  };
}

export interface UpdateTicketDTO {
  description?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  metadata?: {
    externalTicketId?: string;
    [key: string]: any;
  };
}

interface TicketMetadata {
  externalTicketId?: string;
  nogalStatus?: string;
  [key: string]: any;
}

export class TicketService {
  constructor(
    private readonly ticketsRepository: TicketsRepository = new TicketsRepository()
  ) {}

  async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
    const ticket: TicketInsert = {
      id: uuidv4(),
      conversation_id: dto.conversation_id,
      description: dto.description,
      tipo_incidencia: dto.tipo_incidencia,
      motivo_incidencia: dto.motivo_incidencia,
      priority: dto.priority,
      status: dto.status,
      metadata: dto.metadata as Json,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const createdTicket = await this.ticketsRepository.create(ticket);
    const metadata = createdTicket.metadata as TicketMetadata;

    // Si el ticket tiene un ID externo de Nogal, sincronizamos el estado
    if (metadata?.externalTicketId) {
      try {
        const nogalStatus = await nogalApiClient.getTicketStatus(metadata.externalTicketId);
        await this.updateTicket(createdTicket.id, {
          status: nogalStatus.status,
          metadata: {
            ...metadata,
            nogalStatus: nogalStatus.status
          }
        });
      } catch (error) {
        console.error(`Error syncing Nogal ticket status: ${error}`);
        // No fallamos la creación del ticket si falla la sincronización
      }
    }

    return createdTicket;
  }

  async updateTicket(id: string, dto: UpdateTicketDTO): Promise<Ticket> {
    const update: TicketUpdate = {
      ...dto,
      metadata: dto.metadata as Json,
      updated_at: new Date().toISOString()
    };

    const updatedTicket = await this.ticketsRepository.update(id, update);
    const metadata = updatedTicket.metadata as TicketMetadata;

    // Si el ticket tiene un ID externo de Nogal y se está actualizando el estado,
    // sincronizamos con Nogal
    if (dto.status && metadata?.externalTicketId) {
      try {
        await nogalApiClient.updateTicket(metadata.externalTicketId, {
          "TipoIncidencia": updatedTicket.tipo_incidencia,
          "MotivoIncidencia": updatedTicket.motivo_incidencia,
          "Notas": `Estado actualizado a: ${dto.status}`
        });
      } catch (error) {
        console.error(`Error updating Nogal ticket status: ${error}`);
        // No fallamos la actualización si falla la sincronización con Nogal
      }
    }

    return updatedTicket;
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    return this.ticketsRepository.findById(id);
  }

  async getTicketsByConversation(conversationId: string): Promise<Ticket[]> {
    return this.ticketsRepository.findByConversationId(conversationId);
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return this.ticketsRepository.findByStatus(status);
  }

  async deleteTicket(id: string): Promise<void> {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const metadata = ticket.metadata as TicketMetadata;

    // Si el ticket tiene un ID externo de Nogal, intentamos eliminarlo también
    if (metadata?.externalTicketId) {
      try {
        await nogalApiClient.updateTicket(metadata.externalTicketId, {
          "TipoIncidencia": ticket.tipo_incidencia,
          "MotivoIncidencia": ticket.motivo_incidencia,
          "Notas": "Ticket cancelado desde el portal"
        });
      } catch (error) {
        console.error(`Error cancelling Nogal ticket: ${error}`);
        // No fallamos la eliminación si falla la sincronización con Nogal
      }
    }

    await this.ticketsRepository.delete(id);
  }
}

// Exportar una instancia por defecto del servicio
export const ticketService = new TicketService(); 