const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/dashboard/stats', productController.getDashboardStats);

// Recent activity endpoint
router.get('/recent-activity', productController.getRecentActivity);

// CAS number lookup endpoint
router.get('/cas-lookup/:casNumber', productController.lookupCAS);

router.post('/', [
  body('productName').optional().trim(),
  body('productLine').notEmpty().trim(),
  body('sbu').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['775', 'P90', '440', 'P87', 'P89', 'P85'].includes(value);
  }),
  body('chemicalProperties.casNumber').matches(/^\d{1,7}-\d{2}-\d$/),
  body('skuVariants').optional().isArray({ min: 1 }),
  body('skuVariants.*.type').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['PREPACK', 'CONF', 'SPEC', 'VAR'].includes(value);
  }),
  body('skuVariants.*.sku').optional().trim(),
  body('skuVariants.*.packageSize.value').optional().isNumeric(),
  body('skuVariants.*.packageSize.unit').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['mg', 'g', 'kg', 'mL', 'L', 'units', 'vials', 'plates', 'bulk'].includes(value);
  }),
  body('skuVariants.*.pricing.listPrice').optional().isNumeric(),
  body('hazardClassification.ghsClass').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['H200-H299', 'H300-H399', 'H400-H499'].includes(value);
  }),
  body('hazardClassification.signalWord').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['WARNING', 'DANGER', 'Danger', 'Warning'].includes(value);
  }),
  body('chemicalProperties.physicalState').optional().custom(value => {
    if (value === '') return true; // Allow empty strings, will be cleaned up in controller
    return ['Solid', 'Liquid', 'Gas', 'Powder', 'Crystal'].includes(value);
  })
], productController.createTicket);

router.post('/draft', [
  body('productName').optional().trim(),
  body('productLine').optional().trim(),
  body('sbu').optional().custom(value => {
    if (value === '') return true;
    return ['775', 'P90', '440', 'P87', 'P89', 'P85'].includes(value);
  }),
  body('chemicalProperties.casNumber').optional().matches(/^\d{1,7}-\d{2}-\d$/),
], productController.saveDraft);

router.get('/', productController.getTickets);

router.get('/archived', productController.getArchivedTickets);

router.get('/:id', productController.getTicketById);

router.put('/:id', [
  body('productName').optional().notEmpty().trim(),
  body('productLine').optional().notEmpty().trim(),
  body('chemicalProperties.casNumber').optional().matches(/^\d{1,7}-\d{2}-\d$/),
  body('skuVariants').optional().isArray({ min: 1 })
], productController.updateTicket);

router.patch('/:id/status', [
  body('status').isIn(['DRAFT', 'IN_PROCESS', 'COMPLETED', 'CANCELED']),
  body('reason').optional().trim()
], productController.updateTicketStatus);

router.post('/:id/comments', [
  body('content').notEmpty().trim()
], productController.addComment);

module.exports = router;