// 🎫 RUTAS PARA CREAR TICKETS EN NOGAL
// Configuración de endpoints para gestión de tickets

import { Router } from 'express';
import { crearTicketController } from './crear-ticket.controller';

const router = Router();

// 🎯 POST /api/crear-ticket - Crear ticket en Nogal
router.post('/', (req, res) => crearTicketController.crearTicket(req, res));

// 🧪 GET /api/crear-ticket/test - Probar conectividad
router.get('/test', (req, res) => crearTicketController.testConnectivity(req, res));

// 📋 GET /api/crear-ticket/example - Mostrar ejemplo de payload
router.get('/example', (req, res) => crearTicketController.showExample(req, res));

export default router; 