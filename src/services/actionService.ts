import { Action } from '@/types';

class ActionService {
  private actions: Action[] = [
    { id: 'devolucion-recibos', name: 'Devolución de Recibos' },
    { id: 'anulacion-polizas', name: 'Anulación de Pólizas' },
    { id: 'siniestros', name: 'Gestión de Siniestros' },
    { id: 'cambios-mediador', name: 'Cambio de Mediador' },
    { id: 'contrasenas', name: 'Gestión de Contraseñas' }
  ];

  async getActions(): Promise<Action[]> {
    return this.actions;
  }

  async getAction(id: string): Promise<Action | undefined> {
    return this.actions.find(action => action.id === id);
  }
}

export const actionService = new ActionService(); 