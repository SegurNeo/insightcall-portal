# InsightCall Portal

Portal de análisis y gestión de llamadas telefónicas con integración de IA para transcripción, análisis automático y generación de tickets.

## 🏗️ Estructura del Proyecto

```
insightcall-portal/
├── src/                     # Frontend (React + TypeScript)
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios y API calls
│   └── types/              # Definiciones de tipos
├── server/                  # Backend (Node.js + TypeScript)
│   ├── src/                # Código fuente del servidor
│   └── tests/              # Scripts de testing y desarrollo
├── docs/                   # Documentación del proyecto
│   ├── api/                # Especificaciones de API
│   ├── implementation/     # Documentación de implementación
│   └── migrations/         # Documentación de migraciones
├── scripts/                # Scripts de desarrollo y testing
└── shared/                 # Tipos y utilidades compartidas
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm
- Acceso a las APIs de Segurneo y Nogal

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd insightcall-portal
   ```

2. **Instalar dependencias del frontend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del backend**
   ```bash
   cd server
   npm install
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con las configuraciones necesarias
   ```

### Desarrollo

1. **Iniciar el frontend**
   ```bash
   npm run dev
   ```

2. **Iniciar el backend**
   ```bash
   cd server
   npm run dev
   ```

## 🔧 Tecnologías

### Frontend
- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Shadcn/ui** - Componentes de UI
- **React Query** - Gestión de estado del servidor

### Backend
- **Node.js** - Runtime
- **TypeScript** - Tipado estático
- **Express** - Framework web
- **Supabase** - Base de datos y autenticación

### Integraciones
- **Segurneo Voice API** - Transcripción de llamadas
- **Nogal API** - Gestión de tickets de seguros
- **Gemini AI** - Análisis de contenido con IA

## 📚 Documentación

- [API Documentation](./docs/api/) - Especificaciones de las APIs
- [Implementation Guide](./docs/implementation/) - Guías de implementación
- [Migration Notes](./docs/migrations/) - Notas de migración de datos

## 🧪 Testing

Los scripts de testing se encuentran en:
- `./scripts/` - Scripts de testing del frontend
- `./server/tests/` - Scripts de testing del backend

## 🚦 Estados del Proyecto

- ✅ **Transcripción de llamadas** - Completado
- ✅ **Análisis con IA** - Completado  
- ✅ **Generación de tickets** - Completado
- ✅ **Portal de gestión** - Completado
- 🔄 **Optimizaciones** - En progreso

## 📄 Licencia

Este proyecto es privado y confidencial.

---

Para más información, consulta la documentación en la carpeta `docs/` o contacta al equipo de desarrollo.
