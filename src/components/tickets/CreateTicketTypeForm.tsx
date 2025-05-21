import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast'; // Assuming useToast hook exists
import { Trash2 } from 'lucide-react'; // Import trash icon
import { Separator } from '@/components/ui/separator'; // Import Separator
// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // We won't use the trigger directly
} from "@/components/ui/alert-dialog"

// Helper function to get/set custom types from localStorage
const CUSTOM_TICKET_TYPES_KEY = 'customTicketTypes';

interface CustomTicketType {
  value: string;
  label: string;
}

const getCustomTicketTypes = (): CustomTicketType[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_TICKET_TYPES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading custom ticket types from localStorage:", error);
    return [];
  }
};

const addCustomTicketType = (newType: CustomTicketType): boolean => {
  try {
    const currentTypes = getCustomTicketTypes();
    // Basic validation: check if value already exists
    if (currentTypes.some(t => t.value === newType.value)) {
      return false; // Indicate failure (duplicate value)
    }
    const updatedTypes = [...currentTypes, newType];
    localStorage.setItem(CUSTOM_TICKET_TYPES_KEY, JSON.stringify(updatedTypes));
    return true; // Indicate success
  } catch (error) {
    console.error("Error saving custom ticket type to localStorage:", error);
    return false; // Indicate failure
  }
};

// New helper function to delete a custom type
const deleteCustomTicketType = (valueToDelete: string): boolean => {
  try {
    let currentTypes = getCustomTicketTypes();
    const updatedTypes = currentTypes.filter(t => t.value !== valueToDelete);
    // Check if something was actually deleted
    if (currentTypes.length === updatedTypes.length) {
       console.warn(`Attempted to delete non-existent custom ticket type: ${valueToDelete}`);
       return false; // Or handle as success if desired, type wasn't there anyway
    }
    localStorage.setItem(CUSTOM_TICKET_TYPES_KEY, JSON.stringify(updatedTypes));
    return true; // Indicate success
  } catch (error) {
    console.error("Error deleting custom ticket type from localStorage:", error);
    return false; // Indicate failure
  }
};

const CreateTicketTypeForm: React.FC = () => {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [customTypes, setCustomTypes] = useState<CustomTicketType[]>([]); // State for the list
  const { toast } = useToast(); // Use toast for feedback
  // State for AlertDialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CustomTicketType | null>(null);

  // Load custom types on mount
  useEffect(() => {
    setCustomTypes(getCustomTicketTypes());
  }, []);

  // Function to refresh the list (can be called after add/delete)
  const refreshCustomTypes = () => {
      setCustomTypes(getCustomTicketTypes());
       // Maybe notify TicketForm here in a real app
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    // Auto-generate value based on label (simple slug)
    setValue(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow manual override of value, keep it simple (lowercase, underscore, alphanumeric)
     setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !value) {
       toast({ title: "Error", description: "Nombre e Identificador son requeridos.", variant: "destructive" });
      return;
    }

    const success = addCustomTicketType({ label, value });

    if (success) {
       toast({ title: "Éxito", description: `Nuevo tipo de ticket "${label}" guardado.` });
       // Clear form
       setLabel('');
       setValue('');
       refreshCustomTypes(); // Refresh the list shown below
    } else {
         toast({ title: "Error", description: `El identificador "${value}" ya existe o hubo un problema al guardar.`, variant: "destructive" });
    }
  };

  // Prepare deletion (open dialog)
  const requestDeleteType = (type: CustomTicketType) => {
    setTypeToDelete(type);
    setIsConfirmDialogOpen(true);
  };
  
  // Execute deletion (called from AlertDialog Action)
  const executeDelete = () => {
      if (!typeToDelete) return;

      const success = deleteCustomTicketType(typeToDelete.value);
      if (success) {
          toast({ title: "Eliminado", description: `Tipo "${typeToDelete.label}" eliminado correctamente.` });
          refreshCustomTypes(); 
      } else {
          toast({ title: "Error", description: `No se pudo eliminar el tipo "${typeToDelete.label}".`, variant: "destructive" });
      }
      setTypeToDelete(null); // Reset after execution
      // Dialog closes automatically on action
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo tipo de ticket</CardTitle>
          <CardDescription>Define un nuevo tipo para usar en la creación de tickets.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newTicketTypeLabel">Nombre / etiqueta</Label>
              <Input
                id="newTicketTypeLabel"
                value={label}
                onChange={handleLabelChange}
                placeholder="Ej: Consulta de Cobertura"
                required
              />
               <p className="text-xs text-muted-foreground">Nombre visible en el selector.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTicketTypeValue">Identificador / valor</Label>
              <Input
                id="newTicketTypeValue"
                value={value}
                onChange={handleValueChange}
                placeholder="Ej: consulta_cobertura"
                required
              />
               <p className="text-xs text-muted-foreground">Valor interno único (letras minúsculas, números, guion bajo).</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Guardar tipo</Button>
          </CardFooter>
        </form>

        {/* Section to display and delete custom types */}      
        {customTypes.length > 0 && (
            <React.Fragment>
              <Separator className="my-4" />
              <CardContent>
                  <h4 className="mb-4 text-sm font-medium text-muted-foreground">Tipos personalizados existentes:</h4>
                  <ul className="space-y-2">
                      {customTypes.map((type) => (
                          <li key={type.value} className="flex items-center justify-between text-sm">
                              <span>{type.label} ({type.value})</span>
                              <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive" 
                                  // Update onClick to open the dialog
                                  onClick={() => requestDeleteType(type)}
                                  title={`Eliminar tipo ${type.label}`}
                              > 
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </li>
                      ))}
                  </ul>
              </CardContent>
            </React.Fragment>
        )}
      </Card>

      {/* Confirmation Dialog */}      
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar el tipo "{typeToDelete?.label ?? ''}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTypeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateTicketTypeForm;
// Add helper functions here if not importing
export { getCustomTicketTypes }; // Export helper if needed elsewhere 