# Guía de implementación

## Gateway de Voz y Middleware para integración con Eleven Labs

---

### 1. Propósito del documento

Este documento explica, de forma operativa y neutral respecto a proveedores cloud, cómo desplegar una **pasarela de voz (Gateway)** y acoplarla con el **middleware del cliente (Nogal)** para que:

1. La llamada *solo* salga de la PBX de Nogal hacia Eleven Labs al inicio.
2. Todo el tráfico posterior (transcripciones, hand‑off, métricas) pase **exclusivamente** por el Gateway antes de llegar al ecosistema del cliente.
3. Se cumplan las restricciones de seguridad, auditoría y compartición de claves descritas en el contrato marco y en el Anexo III de requisitos técnicos. citeturn0file0turn0file1

> **Destinatarios**: equipos de IA/DevOps interesados en construir o extender la solución (Prestador y terceras integradoras).

---

### 2. Actores y dominios

| Dominio                        | Responsable  | Función principal                                                    |
| ------------------------------ | ------------ | -------------------------------------------------------------------- |
| **PBX Nogal**                  | Nogal        | Centralita existente. Reenvía llamadas al número IA.                 |
| **Eleven Labs (IA)**           | SaaS externo | Maneja audio y turno de palabra.                                     |
| **Gateway de Voz (Prestador)** | Prestador    | Intermediario: orquesta, recibe eventos de la IA y contacta a Nogal. |
| **Middleware de Nogal**        | Nogal        | Persiste llamadas y da servicio al Dashboard.                        |

---

### 3. Arquitectura de alto nivel

```
┌──── PBX Nogal ───┐        único desvío
│  91 XXX XX XX    │ ────►  +34 93X XX XX  (fijo IA – Eleven Labs)
└──────────────────┘
                         ▲
                   audio SIP/TLS
                         │
                    Eleven Labs
                         │ eventos (HTTPS / WS)
                         ▼
               ┌────────────────────────┐
               │ Gateway de Voz         │
               │ • SBC / B2BUA          │
               │ • Session Controller   │
               └────────────────────────┘
                        ▲         │
     SIP REFER/INVITE   │         │ REST push (443)
           (5061)       │         │
                        │         ▼
                     PBX Nogal   Middleware Nogal
                    (colas)      (dashboard)
```

---

### 4. Flujo de llamada resumido

1. **Desvío inicial**: la PBX redirige la llamada **directamente** al número fijo del agente IA en Eleven Labs.
2. **Puente IA**: el Gateway crea una sesión con Eleven Labs y actúa de B2BUA.
3. **Eventos**: la IA envía *transcripts* y señales *handoff* → Gateway.
4. **Escalada** (opcional): el Gateway llama a la cola humana de Nogal y mergea ambas patas.
5. **Persistencia**: el Gateway notifica al Middleware Nogal con un JSON compacto (ver § 5) y almacena los logs completos en su BD.

---

### 5. Interfaces y contratos API

#### 5.1 Eventos IA → Gateway

```json
{
  "call_id": "e11-9f8c...",
  "type": "transcript.final",
  "text": "Buenas tardes, en qué puedo ayudarle…",
  "speaker": "AI",
  "timestamps": [[0.0, 3.4]]
}
```

#### 5.2 Webhook Gateway → Middleware Nogal

* **URL**: `POST https://middleware.nogal.local/calls/{call_id}/events`
* **Cabeceras**: `X-Signature-HMAC`, `X-Timestamp` (previenen replay).
* **Payload** (normalizado):

```json
{
  "call_id": "GW-2025-05-22-1234",
  "event": "transcript.final",
  "text": "Buenas tardes…",
  "metrics": {
    "sentiment": 0.71,
    "interruptions": 2
  },
  "handoff": false
}
```

#### 5.3 Transferencia a cola humana

| Parámetro | Ejemplo                    | Descripción                |
| --------- | -------------------------- | -------------------------- |
| `target`  | `SIP/6001@pbx.nogal.local` | Destino de la segunda pata |
| `mode`    | `refer`/`conference`       | Tipo de unión              |
| `reason`  | `user_request`             | Motivo de la transfer      |

---

### 6. Responsabilidades

| Tarea                       | Gateway (Prestador) | Middleware Nogal    |
| --------------------------- | ------------------- | ------------------- |
| Terminar SIP / grabar audio | ✔                   | ✗                   |
| Mantener claves Eleven Labs | ✔                   | ✗                   |
| Persistir transcripción     | ✔ (copia master)    | ✔ (copia operativa) |
| Alimentar Dashboard         | ✗                   | ✔                   |
| Cumplimiento logs Anexo III | ✔                   | ✔                   |

---

### 7. Seguridad y cumplimiento

* **Red**: el Middleware de Nogal no tiene rutas a dominios `*.elevenlabs.*` (ACL).
* **Claves**: API‑keys sólo en variables cifradas del Gateway.
* **Firma**: todos los webhooks Gateway → Nogal llevan HMAC con secreto compartido.
* **Borrado de audio**: retención máx. 90 días conforme Anexo III § 2.e. citeturn0file1

---

### 8. Roadmap de referencia

| Fecha  | Hito                                  | Responsable       |
| ------ | ------------------------------------- | ----------------- |
| 20 may | DID activo + llamada IA               | Nogal & Prestador |
| 22 may | Gateway recibe transcripciones        | Prestador         |
| 24 may | Webhook operativo en Middleware Nogal | Nogal             |
| 27 may | Test de hand‑off a agente humano      | Ambos             |
| 29 may | Demo E2E + validación contractual     | Todos             |

---

### 9. Checklist de pruebas

* Llamada básica IA responde ✅
* Transcripción completa llega al Dashboard ✅
* Escalada por palabra clave ("agente") une la cola humana ✅
* Log de red demuestra **0** conexiones salientes desde Nogal a Eleven Labs ✅

---

### 10. Glosario rápido

* **DID**: *Direct Inward Dialing*, número fijo que termina en el Gateway.
* **B2BUA**: *Back‑to‑Back User Agent*, servidor SIP que controla dos llamadas y puede unirlas.
* **HMAC**: *Hash‑based Message Authentication Code* para firmar mensajes.

---

### 11. Referencias contractuales

* Contrato marco 2025, cláusulas 3.1 a‑d (separación de software y datos). citeturn0file0
* Anexo III Requisitos técnicos, § 2.e (registro y retención). citeturn0file1

### 12. Detalles Técnicos de Implementación

#### 12.1 Configuración del Gateway

```yaml
# config/gateway.yaml
server:
  port: 5061
  host: 0.0.0.0
  ssl:
    enabled: true
    cert: /etc/certs/gateway.crt
    key: /etc/certs/gateway.key

monitoring:
  metrics_port: 9090
  health_check_interval: 30s
  
logging:
  level: info
  format: json
  retention: 90d

rate_limits:
  calls_per_minute: 100
  events_per_second: 50

circuit_breakers:
  eleven_labs:
    timeout: 5s
    max_failures: 3
    reset_timeout: 30s
```

#### 12.2 Monitorización y Alertas

- Métricas clave:
  - Latencia de respuesta
  - Tasa de éxito de llamadas
  - Tiempo de procesamiento de eventos
  - Uso de recursos (CPU, memoria, red)

- Alertas configuradas:
  - Alto tiempo de respuesta (>500ms)
  - Tasa de error elevada (>1%)
  - Saturación de recursos (>80%)
  - Fallos en circuit breakers

#### 12.3 Escalabilidad

- Implementación de cache distribuido (Redis)
- Balanceador de carga con health checks
- Auto-scaling basado en métricas de uso
- Particionamiento de base de datos por fecha

#### 12.4 Recuperación ante Fallos

- Estrategia de failover automático
- Backup periódico de configuración
- Replicación de logs en tiempo real
- Plan de disaster recovery documentado

#### 12.5 URL Base del Servidor Gateway (Segurneo Voice)

El API del Gateway de Segurneo Voice está desplegado y accesible en la siguiente URL base:

`https://segurneo-voice.onrender.com`

Todos los endpoints expuestos para el Middleware de Nogal (ej. `/api/v1/calls/...`) se construirán sobre esta URL.
Se recomienda que el Middleware de Nogal configure esta URL como una variable de entorno para facilitar cambios futuros.

---

> **Nota**: Esta sección técnica complementa el diseño de alto nivel y debe actualizarse según evolucionen los requisitos.

---

> **Contacto técnico**: `voice-gateway@prestador.com`
> **Última revisión**: 16‑may‑2025
