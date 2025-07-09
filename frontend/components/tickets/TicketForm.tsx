import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting
import { getCustomTicketTypes } from './CreateTicketTypeForm'; // Import helper function
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface CustomTicketType {
  value: string;
  label: string;
}

// Keep predefined types separate for logic
const predefinedTicketTypes = {
  devolucion_recibos: "Devolución de recibos",
  anulacion_poliza: "Anulación de póliza",
  regularizacion_poliza: "Regularización de póliza",
  cambio_mediador: "Cambio de mediador",
  contrasenas: "Contraseñas",
};

type PredefinedTicketValue = keyof typeof predefinedTicketTypes;
type TicketValue = PredefinedTicketValue | string; // Allow custom string values

interface FormData {
  ticketType: TicketValue;
  policyNumber: string;
  receiptNumber: string;
  currentMediator: string;
  newMediator: string;
  reason: string;
  details: string;
  requestedChange: string;
  effectiveDate: Date | undefined;
  username: string;
  systemAffected: string;
  requestType: 'reset' | 'unlock' | 'new' | '';
  // Fields for custom types
  customSubject: string;
  customDescription: string;
}

const TicketForm: React.FC = () => {
  const [allTicketTypes, setAllTicketTypes] = useState<CustomTicketType[]>([]);
  const { toast } = useToast(); // Initialize toast

  // Load types on mount
  useEffect(() => {
    const predefined = Object.entries(predefinedTicketTypes).map(([value, label]) => ({ value, label }));
    const custom = getCustomTicketTypes();
    setAllTicketTypes([...predefined, ...custom]);
    // Note: If CreateTicketTypeForm could notify this component of changes,
    // we could reload here instead of requiring a manual refresh.
  }, []);

  const [formData, setFormData] = useState<FormData>({
    ticketType: '',
    policyNumber: '',
    receiptNumber: '',
    currentMediator: '',
    newMediator: '',
    reason: '',
    details: '',
    requestedChange: '',
    effectiveDate: undefined,
    username: '',
    systemAffected: '',
    requestType: '',
    customSubject: '', // Initialize new fields
    customDescription: '', // Initialize new fields
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
     // Reset potentially irrelevant fields when type changes
    setFormData(prev => ({
      ...prev, 
      [name]: value,
      // Reset fields specific to other types?
      // policyNumber: '', receiptNumber: '', ...
      // customSubject: '', customDescription: '', ... 
      // This can be complex, decide if reset is needed
    }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, effectiveDate: date }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Simulando creación de ticket:", formData);
    // alert('Ticket simulado creado. Revisa la consola para ver los datos.'); // Remove alert
    // Use toast instead
    toast({ 
        title: "Simulación completa", 
        description: "Ticket simulado \"creado\". Revisa la consola para ver los datos."
    });
    // Consider resetting the form here if desired
    // setFormData({ ...initial empty state... }); 
  };

  const renderFields = () => {
    const selectedType = formData.ticketType as TicketValue;

    // Check if the selected type is one of the predefined ones
    if (selectedType in predefinedTicketTypes) {
        // Render predefined fields based on type
        switch (selectedType as PredefinedTicketValue) {
          case 'regularizacion_poliza':
            return (
              <>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Nº póliza</Label>
                  <Input id="policyNumber" name="policyNumber" value={formData.policyNumber} onChange={handleInputChange} placeholder="Ej: 001234567Z" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Input id="reason" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="Ej: Cambio de domicilio" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="requestedChange">Cambio solicitado</Label>
                  <Textarea id="requestedChange" name="requestedChange" value={formData.requestedChange} onChange={handleInputChange} placeholder="Detalla el cambio requerido..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales</Label>
                  <Textarea id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="Añade cualquier información relevante..." />
                </div>
              </>
            );
          case 'anulacion_poliza':
             return (
              <>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Nº póliza</Label>
                  <Input id="policyNumber" name="policyNumber" value={formData.policyNumber} onChange={handleInputChange} placeholder="Ej: 001234567Z" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Input id="reason" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="Ej: Venta de vehículo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Fecha efectiva</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.effectiveDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.effectiveDate ? format(formData.effectiveDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.effectiveDate}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales</Label>
                  <Textarea id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="Añade cualquier información relevante..." />
                </div>
              </>
            );
          case 'contrasenas':
             return (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Ej: p.sanchez" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemAffected">Sistema afectado</Label>
                  <Input id="systemAffected" name="systemAffected" value={formData.systemAffected} onChange={handleInputChange} placeholder="Ej: ERP Interno, Portal Cliente" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestType">Tipo de solicitud</Label>
                  <Select name="requestType" onValueChange={handleSelectChange('requestType')} value={formData.requestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reset">Resetear contraseña</SelectItem>
                      <SelectItem value="unlock">Desbloquear usuario</SelectItem>
                      <SelectItem value="new">Nueva cuenta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales</Label>
                  <Textarea id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="Motivo de la solicitud, urgencia..." />
                </div>
              </>
            );
          case 'devolucion_recibos':
            return (
               <>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Nº póliza</Label>
                  <Input id="policyNumber" name="policyNumber" value={formData.policyNumber} onChange={handleInputChange} placeholder="Ej: 001234567Z" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Nº recibo</Label>
                  <Input id="receiptNumber" name="receiptNumber" value={formData.receiptNumber} onChange={handleInputChange} placeholder="Ej: R2024/12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo devolución</Label>
                  <Input id="reason" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="Ej: Cargo indebido" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales</Label>
                  <Textarea id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="Añade cualquier información relevante..." />
                </div>
              </>
            );
          case 'cambio_mediador':
             return (
               <>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Nº póliza</Label>
                  <Input id="policyNumber" name="policyNumber" value={formData.policyNumber} onChange={handleInputChange} placeholder="Ej: 001234567Z" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="currentMediator">Mediador actual</Label>
                  <Input id="currentMediator" name="currentMediator" value={formData.currentMediator} onChange={handleInputChange} placeholder="Ej: 1234 - Oficina Central" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="newMediator">Nuevo mediador</Label>
                  <Input id="newMediator" name="newMediator" value={formData.newMediator} onChange={handleInputChange} placeholder="Ej: 5678 - Sucursal Norte" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="reason">Motivo del cambio</Label>
                  <Input id="reason" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="Ej: Cambio de residencia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales</Label>
                  <Textarea id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="Añade cualquier información relevante..." />
                </div>
              </>
            );
        }
    } else if (selectedType) { 
        // Render generic fields for custom types
        return (
             <>
                <div className="space-y-2">
                    <Label htmlFor="customSubject">Asunto</Label>
                    <Input id="customSubject" name="customSubject" value={formData.customSubject} onChange={handleInputChange} placeholder="Asunto principal del ticket" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customDescription">Descripción</Label>
                    <Textarea id="customDescription" name="customDescription" value={formData.customDescription} onChange={handleInputChange} placeholder="Describe el motivo del ticket..." />
                </div>
            </>
        );
    }
    // If no type is selected, show placeholder
    return <p className="text-muted-foreground pt-4">Selecciona un tipo de ticket para ver los campos.</p>;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ticketType">Tipo de ticket</Label>
        <Select name="ticketType" onValueChange={handleSelectChange('ticketType')} value={formData.ticketType}>
          <SelectTrigger id="ticketType">
            <SelectValue placeholder="Selecciona el tipo de ticket" />
          </SelectTrigger>
          <SelectContent>
            {/* Map through all loaded types */} 
            {allTicketTypes.map((type, index) => (
                 <React.Fragment key={type.value}>
                  {/* Add separator if moving from predefined to custom */}
                  {index === Object.keys(predefinedTicketTypes).length && allTicketTypes.length > index && <SelectSeparator />}
                  <SelectItem value={type.value}>{type.label}</SelectItem>
                </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {renderFields()}

      {formData.ticketType && (
         <Button type="submit">Crear ticket (simulación)</Button>
      )}
    </form>
  );
};

export default TicketForm; 