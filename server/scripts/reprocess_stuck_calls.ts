// @ts-nocheck

import { supabase } from '../src/lib/supabase';
import { callProcessingService } from '../src/services/call_processing_service';

(async () => {
  console.log('🔍  Buscando llamadas en estados intermedios...');
  const { data: calls, error } = await supabase
    .from('processed_calls')
    .select('*')
    .in('status', ['pending_sync', 'pending_analysis', 'processing'])
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('❌  Error al consultar llamadas:', error);
    process.exit(1);
  }

  if (!calls || calls.length === 0) {
    console.log('✅  No hay llamadas atascadas.');
    process.exit(0);
  }

  console.log(`➡️  Encontradas ${calls.length} llamadas potencialmente atascadas. Procediendo a re-procesarlas una a una...`);

  for (const call of calls) {
    const externalId = call.segurneo_external_call_id;
    console.log(`\n⚙️  Reprocesando llamada ${call.id} (external: ${externalId}) con estado actual '${call.status}'`);
    try {
      const result = await callProcessingService.processCallByExternalId(externalId);
      console.log(`✅  Llamada ${result.id} procesada hasta estado '${result.status}'.`);
    } catch (err) {
      console.error(`❌  Error reprocesando la llamada ${call.id}:`, err);
    }
  }

  console.log('\n🏁  Proceso de reprocesamiento finalizado.');
  process.exit(0);
})();