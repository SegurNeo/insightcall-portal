// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import type { NogalTipoCreacion } from '../types/nogal_tickets.types';

// Tipo para la definición normalizada de tickets - CSV actualizado 15.07.25
export interface TicketDefinition {
  id: string; // uuid v4 generado a partir de la fila
  tipoIncidencia: string; // "Tipo de incidencia" en CSV
  motivoIncidencia: string; // "Motivo de gestión" en CSV
  ramo?: string | null; // Columna ramo
  consideraciones?: string | null; // Columna consideraciones
  necesidadCliente?: string | null; // Columna necesidad_cliente
  tipoCreacion: NogalTipoCreacion; // Valores exactos del CSV
}

// Lee el CSV y devuelve un array de definiciones de tickets
export function loadTicketDefinitions(csvFilePath: string = path.resolve(process.cwd(), 'tickets_nogal.csv')): TicketDefinition[] {
  const csvRaw = fs.readFileSync(csvFilePath, 'utf-8');

  // Parseo con cabeceras tomadas de la primera fila
  const records: Record<string, string>[] = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    // La librería reconoce las comillas automáticamente
    trim: true
  });

  // Normalización básica de cada fila
  const definitions = records.map<TicketDefinition>((row) => {
    const tipoRaw = row['Tipo de incidencia'];
    const motivoRaw = row['Motivo de gestión'];

    if (!tipoRaw || !motivoRaw) {
      throw new Error(`CSV malformed – missing required fields on row: ${JSON.stringify(row)}`);
    }

    // Determinar tipoCreacion según la columna "Tipo de creación" - valores exactos del CSV
    const creationCol = (row['Tipo de creación'] || '').toLowerCase();
    let tipoCreacion: NogalTipoCreacion = 'Manual / Automática';

    if (creationCol.includes('exclusiva') || creationCol.includes('exclusive')) {
      tipoCreacion = 'Exclusiva IA';
    } else if (creationCol.includes('manual') || creationCol.includes('automática') || creationCol.includes('automatica')) {
      tipoCreacion = 'Manual / Automática';
    }

    return {
      id: uuidv4(),
      tipoIncidencia: tipoRaw.trim(),
      motivoIncidencia: motivoRaw.trim(),
      ramo: (row['ramo (solo aplica para las incidencias en las que aparece relleno)'] || row['ramo (solo aplica para las incidencias en las que aparece relleno) '] )?.trim() || null,
      consideraciones: (row['consideraciones'] || row['consideraciones '] )?.trim() || null,
      necesidadCliente: (row['Necesidad del cliente'] || row['Necesidad del cliente '] )?.trim() || null,
      tipoCreacion
    };
  });

  return definitions;
}

// Cache en memoria para evitar múltiples lecturas
export const ticketDefinitions: TicketDefinition[] = loadTicketDefinitions(); 