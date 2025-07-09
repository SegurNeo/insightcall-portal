import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TicketForm from '@/components/tickets/TicketForm';
import CreateTicketTypeForm from '@/components/tickets/CreateTicketTypeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TicketsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Gestión de tickets</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Crear nuevo ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
           <CreateTicketTypeForm />
        </div>

      </div>
      
      {/* Aquí podrías añadir una tabla o lista para mostrar tickets simulados */}
    </DashboardLayout>
  );
};

export default TicketsPage; 