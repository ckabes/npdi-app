const ProductTicket = require('../models/ProductTicket');
const TicketTemplate = require('../models/TicketTemplate');
const FormConfiguration = require('../models/FormConfiguration');

/**
 * Transform ticket data for API response
 * Ensures SKUs include part numbers and forecast data is properly attributed
 */
const transformTicketForAPI = (ticket) => {
  const transformed = { ...ticket };

  // If ticket has a base part number, ensure all SKUs include it in their full SKU
  if (transformed.partNumber && transformed.partNumber.baseNumber && transformed.skuVariants) {
    transformed.skuVariants = transformed.skuVariants.map(sku => ({
      ...sku,
      // Ensure full SKU is populated with base part number
      partNumber: transformed.partNumber.baseNumber,
      // Include forecast data for PREPACK SKUs
      forecastedSalesVolume: sku.type === 'PREPACK' && sku.forecastedSalesVolume
        ? {
            year1: sku.forecastedSalesVolume.year1 || 0,
            year2: sku.forecastedSalesVolume.year2 || 0,
            year3: sku.forecastedSalesVolume.year3 || 0
          }
        : undefined
    }));
  }

  return transformed;
};

/**
 * Get all tickets with filtering and pagination
 */
exports.getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      sbu,
      createdBy,
      assignedTo,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (priority) {
      filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
    }

    if (sbu) {
      filter.sbu = Array.isArray(sbu) ? { $in: sbu } : sbu;
    }

    if (createdBy) {
      filter.createdBy = createdBy;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with aggregation to combine pagination + count
    const result = await ProductTicket.aggregate([
      { $match: filter },
      {
        $facet: {
          tickets: [
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $project: { __v: 0 } }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    const tickets = result[0].tickets;
    const total = result[0].total[0]?.count || 0;

    // Transform tickets for API response
    const transformedTickets = tickets.map(transformTicketForAPI);

    res.json({
      success: true,
      data: transformedTickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

/**
 * Get single ticket by ID
 */
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ProductTicket.findById(id)
      .select('-__v')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Transform ticket for API response
    const transformedTicket = transformTicketForAPI(ticket);

    res.json({
      success: true,
      data: transformedTicket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

/**
 * Get ticket by ticket number
 */
exports.getTicketByNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await ProductTicket.findOne({ ticketNumber })
      .select('-__v')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Transform ticket for API response
    const transformedTicket = transformTicketForAPI(ticket);

    res.json({
      success: true,
      data: transformedTicket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

/**
 * Get tickets by template ID
 */
exports.getTicketsByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify template exists
    const template = await TicketTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // For now, we return all tickets since tickets don't directly reference templates
    // This would need to be enhanced based on your business logic
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with aggregation to combine pagination + count
    const result = await ProductTicket.aggregate([
      { $match: {} },
      {
        $facet: {
          tickets: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $project: { __v: 0 } }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    const tickets = result[0].tickets;
    const total = result[0].total[0]?.count || 0;

    // Transform tickets for API response
    const transformedTickets = tickets.map(transformTicketForAPI);

    res.json({
      success: true,
      data: transformedTickets,
      template: {
        id: template._id,
        name: template.name,
        description: template.description
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets by template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

/**
 * Get default template structure
 */
exports.getDefaultTemplate = async (req, res) => {
  try {
    const template = await TicketTemplate.findOne({ isDefault: true, isActive: true })
      .populate('formConfiguration')
      .select('-__v')
      .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Default template not found'
      });
    }

    res.json({
      success: true,
      data: {
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
          isDefault: template.isDefault,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        },
        formConfiguration: template.formConfiguration
      }
    });
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default template',
      error: error.message
    });
  }
};

/**
 * Advanced search with multiple filters
 */
exports.searchTickets = async (req, res) => {
  try {
    const {
      query,
      filters = {},
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fields
    } = req.body;

    // Build search filter
    const searchFilter = { ...filters };

    // Text search across multiple fields if query provided
    if (query) {
      searchFilter.$or = [
        { ticketNumber: { $regex: query, $options: 'i' } },
        { productName: { $regex: query, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: query, $options: 'i' } },
        { 'chemicalProperties.iupacName': { $regex: query, $options: 'i' } },
        { 'skuVariants.sku': { $regex: query, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Build projection if specific fields requested
    let projectFields = { __v: 0 };
    if (fields && Array.isArray(fields)) {
      projectFields = fields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
    }

    // Execute query with aggregation to combine pagination + count
    const result = await ProductTicket.aggregate([
      { $match: searchFilter },
      {
        $facet: {
          tickets: [
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: parseInt(limit) },
            { $project: projectFields }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    const tickets = result[0].tickets;
    const total = result[0].total[0]?.count || 0;

    // Transform tickets for API response
    const transformedTickets = tickets.map(transformTicketForAPI);

    res.json({
      success: true,
      data: transformedTickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      searchQuery: query,
      appliedFilters: filters
    });
  } catch (error) {
    console.error('Error searching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tickets',
      error: error.message
    });
  }
};

/**
 * Get ticket statistics
 */
exports.getTicketStatistics = async (req, res) => {
  try {
    const stats = await ProductTicket.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          bySBU: [
            { $group: { _id: '$sbu', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          total: [
            { $count: 'count' }
          ],
          recentActivity: [
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                ticketNumber: 1,
                productName: 1,
                status: 1,
                updatedAt: 1
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalTickets: stats[0].total[0]?.count || 0,
        byStatus: stats[0].byStatus,
        byPriority: stats[0].byPriority,
        bySBU: stats[0].bySBU,
        byProductLine: stats[0].byProductLine,
        recentActivity: stats[0].recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
};

/**
 * Get available templates
 */
exports.getAvailableTemplates = async (req, res) => {
  try {
    const templates = await TicketTemplate.find({ isActive: true })
      .populate('formConfiguration', 'name description version sections')
      .select('-__v')
      .sort({ isDefault: -1, name: 1 })
      .limit(50) // Safety limit to prevent unbounded queries
      .lean();

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

/**
 * Get ticket fields/schema information
 */
exports.getTicketSchema = async (req, res) => {
  try {
    // Get the schema from the ProductTicket model
    const schema = ProductTicket.schema.obj;

    // Create a simplified version of the schema for API consumers
    const simplifiedSchema = {
      ticketNumber: { type: 'string', description: 'Unique ticket identifier' },
      productName: { type: 'string', description: 'Name of the product', required: true },
      productionType: {
        type: 'string',
        description: 'Type of production',
        enum: ['Produced', 'Procured']
      },
      sbu: {
        type: 'string',
        description: 'Strategic Business Unit',
        enum: ['775', 'P90', '440', 'P87', 'P89', 'P85'],
        required: true
      },
      status: {
        type: 'string',
        description: 'Current ticket status',
        enum: ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED', 'CANCELED']
      },
      priority: {
        type: 'string',
        description: 'Ticket priority level',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      },
      chemicalProperties: {
        type: 'object',
        description: 'Chemical properties of the product',
        fields: {
          casNumber: { type: 'string', description: 'CAS Registry Number', pattern: '^\\d{1,7}-\\d{2}-\\d$' },
          molecularFormula: { type: 'string', description: 'Molecular formula' },
          molecularWeight: { type: 'number', description: 'Molecular weight' },
          iupacName: { type: 'string', description: 'IUPAC name' }
        }
      },
      skuVariants: {
        type: 'array',
        description: 'SKU variants for the product',
        items: {
          type: { type: 'string', enum: ['BULK', 'CONF', 'SPEC', 'VAR', 'PREPACK'] },
          sku: { type: 'string', description: 'Full SKU (e.g., 176036-100G)' },
          description: { type: 'string' },
          packageSize: {
            value: { type: 'number' },
            unit: { type: 'string', enum: ['mg', 'g', 'kg', 'mL', 'L', 'units', 'vials', 'plates', 'bulk'] }
          },
          pricing: {
            listPrice: { type: 'number', description: 'List price in USD' },
            standardCost: { type: 'number', description: 'Standard cost' },
            margin: { type: 'number', description: 'Margin percentage' },
            currency: { type: 'string', description: 'Currency code (default: USD)' }
          },
          forecastedSalesVolume: {
            type: 'object',
            description: 'Forecasted annual sales volume (PREPACK only)',
            fields: {
              year1: { type: 'number', description: 'Forecasted containers for year 1' },
              year2: { type: 'number', description: 'Forecasted containers for year 2' },
              year3: { type: 'number', description: 'Forecasted containers for year 3' }
            }
          }
        }
      },
      partNumber: {
        type: 'object',
        description: 'Base part number assigned by PM-OPS',
        fields: {
          baseNumber: { type: 'string', description: 'Base part number (e.g., 176036)' },
          assignedBy: { type: 'string', description: 'Email of PM-OPS who assigned the number' },
          assignedAt: { type: 'date', description: 'Timestamp of assignment' }
        }
      },
      createdBy: { type: 'string', description: 'Email of ticket creator' },
      assignedTo: { type: 'string', description: 'Email of assigned user' },
      createdAt: { type: 'date', description: 'Creation timestamp' },
      updatedAt: { type: 'date', description: 'Last update timestamp' }
    };

    res.json({
      success: true,
      data: {
        schema: simplifiedSchema,
        modelName: 'ProductTicket',
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Error fetching ticket schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket schema',
      error: error.message
    });
  }
};
