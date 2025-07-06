#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { SegurneoSyncService } from '../services/segurneo-sync.service';
import { callProcessingService } from '../services/call_processing_service';
import { supabase } from '../lib/supabase';

// Cargar variables de entorno
config();

/**
 * Script para sincronización masiva de llamadas de Eleven Labs
 * 
 * Uso:
 *   npm run sync:elevenlabs
 *   npm run sync:elevenlabs -- --start-date=2024-01-01 --end-date=2024-12-31
 *   npm run sync:elevenlabs -- --force-reprocess
 */

interface SyncOptions {
  startDate?: string;
  endDate?: string;
  forceReprocess?: boolean;
  pageSize?: number;
}

async function parseArgs(): Promise<SyncOptions> {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    pageSize: 50,
    forceReprocess: false
  };

  for (const arg of args) {
    if (arg.startsWith('--start-date=')) {
      options.startDate = arg.split('=')[1];
    } else if (arg.startsWith('--end-date=')) {
      options.endDate = arg.split('=')[1];
    } else if (arg === '--force-reprocess') {
      options.forceReprocess = true;
    } else if (arg.startsWith('--page-size=')) {
      options.pageSize = parseInt(arg.split('=')[1], 10);
    }
  }

  return options;
}

async function main() {
  console.log('🚀 InsightCall Portal - Sincronización masiva de Eleven Labs\n');
  
  const options = await parseArgs();
  console.log('📋 Opciones:', options);
  console.log('');

  try {
    // 1. Sincronizar con SegurneoVoice
    console.log('1️⃣ Sincronizando llamadas desde SegurneoVoice...');
    const syncService = new SegurneoSyncService();
    const syncResult = await syncService.syncCalls({
      startDate: options.startDate,
      endDate: options.endDate,
      pageSize: options.pageSize
    });
    console.log(`✅ ${syncResult.processed} llamadas sincronizadas\n`);

    // 2. Obtener llamadas para procesar
    console.log('2️⃣ Obteniendo llamadas para procesar...');
    let query = supabase
      .from('processed_calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data: calls, error } = await query;
    
    if (error) {
      throw new Error(`Error obteniendo llamadas: ${error.message}`);
    }

    console.log(`📊 Se encontraron ${calls?.length || 0} llamadas\n`);

    // 3. Procesar cada llamada
    console.log('3️⃣ Procesando llamadas y creando tickets...');
    
    let processed = 0;
    let ticketsCreated = 0;
    let skipped = 0;
    let errors = 0;

    for (const call of calls || []) {
      try {
        // Verificar si necesita procesamiento
        if (call.ticket_ids?.length && !options.forceReprocess) {
          console.log(`⏭️  [${call.segurneo_external_call_id}] Ya tiene tickets`);
          skipped++;
          continue;
        }

        if (!call.segurneo_transcripts || call.segurneo_transcripts.length === 0) {
          console.log(`⚠️  [${call.segurneo_external_call_id}] Sin transcripciones`);
          skipped++;
          continue;
        }

        console.log(`🔄 [${call.segurneo_external_call_id}] Procesando...`);
        
        // Procesar llamada
        const result = await callProcessingService.processCallByExternalId(
          call.segurneo_external_call_id
        );

        if (result.ticket_ids?.length) {
          ticketsCreated += result.ticket_ids.length;
          console.log(`✅ [${call.segurneo_external_call_id}] ${result.ticket_ids.length} tickets creados`);
        } else {
          console.log(`✅ [${call.segurneo_external_call_id}] Procesado sin tickets`);
        }
        
        processed++;

        // Pausa para no saturar APIs
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`❌ [${call.segurneo_external_call_id}] Error:`, err);
        errors++;
      }
    }

    // 4. Mostrar resumen
    console.log('\n📈 RESUMEN DE SINCRONIZACIÓN');
    console.log('═══════════════════════════════');
    console.log(`📞 Total de llamadas: ${calls?.length || 0}`);
    console.log(`✅ Procesadas: ${processed}`);
    console.log(`🎫 Tickets creados: ${ticketsCreated}`);
    console.log(`⏭️  Omitidas: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('═══════════════════════════════\n');

    console.log('✨ Sincronización completada exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar script
main().catch(console.error); 