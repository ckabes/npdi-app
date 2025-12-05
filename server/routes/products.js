const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/dashboard/stats', productController.getDashboardStats);

// Recent activity endpoint
router.get('/recent-activity', productController.getRecentActivity);

// CAS number lookup endpoint
router.get('/cas-lookup/:casNumber', productController.lookupCAS);

// SAP MARA data search endpoint (via Palantir Foundry)
// Supports searching by part number, product name, or CAS number
// Query params: type (partNumber|productName|casNumber), value (search term)
router.get('/sap-search', productController.searchMARA);

// Similar products search endpoint (searches by CAS number)
router.get('/similar-products/:casNumber', productController.searchSimilarProducts);

// AI-powered CorpBase content generation endpoint
router.post('/generate-corpbase-content', [
  body('productData.productName').notEmpty().trim().withMessage('Product name is required'),
  body('productData.casNumber').optional().trim(),
  body('productData.molecularFormula').optional().trim(),
  body('fields').optional().isArray().withMessage('Fields must be an array')
], productController.generateCorpBaseContent);

router.post('/', [
  body('productName').notEmpty().withMessage('Product name is required').trim(),
  body('sbu').notEmpty().withMessage('SBU is required').trim(),
  body('chemicalProperties.casNumber').optional().custom(value => {
    if (!value || value === '') return true; // Allow empty/missing CAS numbers
    return /^\d{1,7}-\d{2}-\d$/.test(value);
  }).withMessage('CAS Number must be in format: 123-45-6 (or leave blank if not applicable)'),
  body('skuVariants').isArray({ min: 1 }).withMessage('At least one SKU variant is required'),
  body('skuVariants.*.type').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'].includes(value);
  }).withMessage('SKU type must be one of: BULK, CONF, SPEC, VAR, PREPACK'),
  body('skuVariants.*.sku').optional().trim(),
  body('skuVariants.*.packageSize.value').optional().isNumeric().withMessage('Package size value must be a number'),
  body('skuVariants.*.packageSize.unit').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['mg', 'g', 'kg', 'mL', 'L', 'units', 'vials', 'plates', 'bulk'].includes(value);
  }).withMessage('Package size unit must be one of: mg, g, kg, mL, L, units, vials, plates, bulk'),
  body('skuVariants.*.pricing.listPrice').optional().isNumeric().withMessage('List price must be a number'),
  body('hazardClassification.ghsClass').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['H200-H299', 'H300-H399', 'H400-H499'].includes(value);
  }).withMessage('GHS class must be one of: H200-H299, H300-H399, H400-H499'),
  body('hazardClassification.signalWord').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be confirmed up in controller
    return ['WARNING', 'DANGER', 'Danger', 'Warning'].includes(value);
  }).withMessage('Signal word must be one of: WARNING, DANGER, Danger, Warning'),
  body('chemicalProperties.physicalState').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['Solid', 'Liquid', 'Gas', 'Powder', 'Crystal'].includes(value);
  }).withMessage('Physical state must be one of: Solid, Liquid, Gas, Powder, Crystal')
], productController.createTicket);

router.post('/draft', [
  body('productName').optional().trim(),
  body('sbu').optional().trim(),
  body('chemicalProperties.casNumber').optional().custom(value => {
    if (!value || value === '') return true; // Allow empty/missing CAS numbers
    return /^\d{1,7}-\d{2}-\d$/.test(value);
  }),
], productController.saveDraft);

router.get('/', productController.getTickets);

router.get('/archived', productController.getArchivedTickets);

router.get('/:id', productController.getTicketById);

router.put('/:id', [
  body('productName').optional().notEmpty().withMessage('Product name cannot be empty').trim(),
  body('chemicalProperties.casNumber').optional().custom(value => {
    if (!value || value === '') return true; // Allow empty/missing CAS numbers
    return /^\d{1,7}-\d{2}-\d$/.test(value);
  }).withMessage('CAS Number must be in format: 123-45-6 (or leave blank if not applicable)'),
  body('skuVariants').optional().isArray().withMessage('SKU variants must be an array')
], productController.updateTicket);

router.patch('/:id/status', [
  body('status').isIn(['DRAFT', 'IN_PROCESS', 'COMPLETED', 'CANCELED']),
  body('reason').optional().trim()
], productController.updateTicketStatus);

router.post('/:id/comments', [
  body('content').notEmpty().trim()
], productController.addComment);

// Export ticket as PDP Checklist
router.get('/:id/export-pdp', productController.exportPDPChecklist);

// Export ticket as PIF
router.get('/:id/export-pif', productController.exportPIF);

// Export ticket data as Excel
router.get('/:id/export-data', productController.exportDataExcel);

module.exports = router;