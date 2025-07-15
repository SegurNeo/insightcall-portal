# 👤 **API Crear Cliente - Dashboard Nogal**

## 📋 **Resumen**
Endpoint para crear clientes en Nogal desde el dashboard.

**URL**: `POST https://segurneo-voice.onrender.com/api/crear-cliente`

## 🔧 **Llamada básica**

### **Headers**
```
Content-Type: application/json
```

### **Campos requeridos**
- `IdCliente` - ID único del cliente
- `IdLlamada` - ID de la conversación
- `Nombre` - Nombre del cliente
- `PrimerApellido` - Primer apellido
- `SegundoApellido` - Segundo apellido
- `Telefono` - Teléfono principal
- `Email` - Email del cliente

### **Campos opcionales**
- `Telefono2` - Segundo teléfono
- `RecomendadoPor` - Quién lo recomendó
- `Campaña` - Campaña de origen
- `IdLead` - ID del lead

## 📤 **Ejemplo de llamada**

### **Payload mínimo (solo campos requeridos)**
```json
{
  "IdCliente": "CL12345",
  "IdLlamada": "conv_01k050grn3es2vnmt21wq30skb",
  "Nombre": "Juan",
  "PrimerApellido": "Pérez",
  "SegundoApellido": "Gómez",
  "Telefono": "123456789",
  "Email": "juan@ejemplo.com"
}
```

### **Payload completo (con opcionales)**
```json
{
  "IdCliente": "CL12345",
  "IdLlamada": "conv_01k050grn3es2vnmt21wq30skb",
  "Nombre": "Juan",
  "PrimerApellido": "Pérez",
  "SegundoApellido": "Gómez",
  "Telefono": "123456789",
  "Telefono2": "987654321",
  "Email": "juan@ejemplo.com",
  "RecomendadoPor": "Amigo",
  "Campaña": "Verano2025",
  "IdLead": "LEAD001"
}
```

### **CURL**
```bash
curl -X POST https://segurneo-voice.onrender.com/api/crear-cliente \
  -H "Content-Type: application/json" \
  -d '{
    "IdCliente": "CL12345",
    "IdLlamada": "conv_01k050grn3es2vnmt21wq30skb",
    "Nombre": "Juan",
    "PrimerApellido": "Pérez",
    "SegundoApellido": "Gómez",
    "Telefono": "123456789",
    "Email": "juan@ejemplo.com"
  }'
```

### **JavaScript (fetch)**
```javascript
const response = await fetch('https://segurneo-voice.onrender.com/api/crear-cliente', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    IdCliente: 'CL12345',
    IdLlamada: 'conv_01k050grn3es2vnmt21wq30skb',
    Nombre: 'Juan',
    PrimerApellido: 'Pérez',
    SegundoApellido: 'Gómez',
    Telefono: '123456789',
    Email: 'juan@ejemplo.com'
  })
});

const result = await response.json();
```

## 📥 **Respuestas**

### **✅ Éxito (200)**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente en Nogal",
  "client_id": "CL12345",
  "nogal_response": {
    "status": "ok",
    "mensaje": "Cliente creado exitosamente"
  }
}
```

### **❌ Error - Campos faltantes (400)**
```json
{
  "success": false,
  "message": "Faltan campos requeridos",
  "missing_fields": ["Telefono", "Email"]
}
```

### **❌ Error - Problema interno (500)**
```json
{
  "success": false,
  "message": "Error al crear cliente en Nogal",
  "errors": ["Error de conexión con Nogal"]
}
```

## 🛠️ **Manejo de respuestas**

```javascript
const result = await response.json();

if (result.success) {
  // Cliente creado exitosamente
  console.log('Cliente creado:', result.client_id);
} else {
  // Error al crear cliente
  console.error('Error:', result.message);
  if (result.missing_fields) {
    console.error('Campos faltantes:', result.missing_fields);
  }
}
```

## ⚠️ **Notas importantes**
- **Tiempo de respuesta**: < 5 segundos
- **Zona horaria**: Fecha/hora se generan automáticamente en CET/CEST
- **Logs**: Cada llamada genera logs para depuración
- **Validación**: Siempre verifica `success: true/false`

¡Listo para usar! 🚀 