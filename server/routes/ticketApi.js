const express = require('express');
const router = express.Router();
const ticketApiController = require('../controllers/ticketApiController');
const { authenticateApiKey } = require('../middleware/apiAuth');

/**
 * Public API routes for external applications to retrieve ticket information
 * Base path: /api/v1/tickets
 *
 * Authentication: All endpoints require an API key in the X-API-Key header
 */

// Apply API key authentication to all routes
router.use(authenticateApiKey);

// Get all tickets with filtering and pagination
router.get('/', ticketApiController.getAllTickets);

// Get ticket statistics
router.get('/statistics', ticketApiController.getTicketStatistics);

// Get ticket schema/fields information
router.get('/schema', ticketApiController.getTicketSchema);

// Get default template structure
router.get('/template/default', ticketApiController.getDefaultTemplate);

// Get available templates
router.get('/templates', ticketApiController.getAvailableTemplates);

// Get tickets by template ID
router.get('/template/:templateId', ticketApiController.getTicketsByTemplate);

// Get single ticket by ID
router.get('/:id', ticketApiController.getTicketById);

// Get ticket by ticket number
router.get('/number/:ticketNumber', ticketApiController.getTicketByNumber);

// Advanced search endpoint
router.post('/search', ticketApiController.searchTickets);

module.exports = router;
