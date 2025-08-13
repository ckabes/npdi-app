const { validationResult } = require('express-validator');
const ProductTicket = require('../models/ProductTicket');
const User = require('../models/User');
const { notifyNewTicket, notifyStatusChange, notifyCommentAdded } = require('../utils/notifications');
const pubchemService = require('../services/pubchemService');

// Temporary hardcoded user mapping for demonstration (until auth is implemented)
const getCurrentUser = (req) => {
  // In a real system, this would come from authentication middleware
  // For now, we'll use a simple role-based approach
  const userRole = req.headers['x-user-role'] || 'PRODUCT_MANAGER';
  const userMap = {
    'PRODUCT_MANAGER': { firstName: 'John', lastName: 'Doe', role: 'Product Manager' },
    'PM_OPS': { firstName: 'Sarah', lastName: 'Johnson', role: 'PMOps' },
    'ADMIN': { firstName: 'Admin', lastName: 'User', role: 'Administrator' }
  };
  return userMap[userRole] || userMap['PRODUCT_MANAGER'];
};

const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let ticketData = {
      ...req.body,
      createdBy: null, // Remove authentication requirement
      sbu: req.body.sbu || 'P90', // Default to P90 instead of Life Science
      // Ensure skuVariants exists with at least one default entry
      skuVariants: req.body.skuVariants && req.body.skuVariants.length > 0 
        ? req.body.skuVariants 
        : [{
            type: 'PREPACK',
            sku: '',
            packageSize: { value: 100, unit: 'g' },
            pricing: { listPrice: 0, currency: 'USD' }
          }]
    };

    // All submitted tickets should have SUBMITTED status initially
    // PMOps will manually move them to IN_PROCESS when they start working on them
    if (!ticketData.status || ticketData.status === '') {
      ticketData.status = 'SUBMITTED';
    }
    // Only keep the submitted status if explicitly provided, otherwise default to SUBMITTED

    // Transform corpbaseData fields if they are strings instead of arrays
    if (ticketData.corpbaseData) {
      if (typeof ticketData.corpbaseData.keyFeatures === 'string' && ticketData.corpbaseData.keyFeatures) {
        ticketData.corpbaseData.keyFeatures = ticketData.corpbaseData.keyFeatures
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0);
      }
      if (typeof ticketData.corpbaseData.applications === 'string' && ticketData.corpbaseData.applications) {
        ticketData.corpbaseData.applications = ticketData.corpbaseData.applications
          .split('\n')
          .map(a => a.trim())
          .filter(a => a.length > 0);
      }
    }

    // Clean up enum fields to handle empty string values
    if (ticketData.hazardClassification) {
      // Convert empty strings to undefined to avoid enum validation errors
      if (ticketData.hazardClassification.ghsClass === '') {
        delete ticketData.hazardClassification.ghsClass;
      }
      if (ticketData.hazardClassification.signalWord === '') {
        delete ticketData.hazardClassification.signalWord;
      }
      if (ticketData.hazardClassification.transportClass === '') {
        delete ticketData.hazardClassification.transportClass;
      }
      if (ticketData.hazardClassification.unNumber === '') {
        delete ticketData.hazardClassification.unNumber;
      }
    }

    // Clean up chemical properties enum fields
    if (ticketData.chemicalProperties) {
      if (ticketData.chemicalProperties.physicalState === '' || ticketData.chemicalProperties.physicalState === null) {
        delete ticketData.chemicalProperties.physicalState;
      }
    }

    // Clean up main ticket enum fields
    if (ticketData.sbu === '') {
      delete ticketData.sbu;
    }
    if (ticketData.status === '') {
      delete ticketData.status;
    }
    if (ticketData.priority === '') {
      delete ticketData.priority;
    }

    // Clean up SKU variants enum fields and provide defaults
    if (ticketData.skuVariants && Array.isArray(ticketData.skuVariants)) {
      ticketData.skuVariants = ticketData.skuVariants.map(sku => {
        // Provide default type if missing or empty
        if (!sku.type || sku.type === '') {
          sku.type = 'PREPACK';
        }
        // Ensure packageSize exists and has valid unit
        if (!sku.packageSize) {
          sku.packageSize = { value: 100, unit: 'g' };
        } else {
          if (!sku.packageSize.unit || sku.packageSize.unit === '') {
            sku.packageSize.unit = 'g';
          }
          if (!sku.packageSize.value) {
            sku.packageSize.value = 100;
          }
        }
        // Ensure pricing exists
        if (!sku.pricing) {
          sku.pricing = { listPrice: 0, currency: 'USD' };
        } else {
          if (!sku.pricing.currency) {
            sku.pricing.currency = 'USD';
          }
        }
        return sku;
      });
    }

    // Auto-populate from PubChem if CAS number provided
    if (ticketData.chemicalProperties?.casNumber && !ticketData.skipAutopopulate) {
      try {
        console.log('Auto-populating ticket data from PubChem...');
        const enrichedData = await pubchemService.enrichTicketData(ticketData.chemicalProperties.casNumber);
        
        // Merge PubChem data with provided data, giving priority to user input
        ticketData = {
          ...ticketData,
          productName: ticketData.productName || enrichedData.productName,
          chemicalProperties: {
            ...enrichedData.chemicalProperties,
            ...ticketData.chemicalProperties // User input takes priority
          },
          hazardClassification: {
            ...enrichedData.hazardClassification,
            ...ticketData.hazardClassification // User input takes priority
          },
          // No auto-generated SKUs for product managers - PMOps will assign
          // Add CorpBase data
          corpbaseData: enrichedData.corpbaseData || {}
        };
        
        console.log('Successfully enriched ticket with PubChem data');
      } catch (pubchemError) {
        console.warn('PubChem enrichment failed, proceeding with user data:', pubchemError.message);
        // Continue with user-provided data if PubChem fails
      }
    }

    console.log('Creating ticket with data:', JSON.stringify(ticketData, null, 2));
    const ticket = new ProductTicket(ticketData);
    
    // Add creation entry to status history with user info
    const currentUser = getCurrentUser(req);
    ticket.statusHistory = [{
      status: ticket.status,
      changedBy: null, // Object ID would go here in real system
      reason: `Ticket created with status: ${ticket.status} by ${currentUser.firstName} ${currentUser.lastName}`,
      action: 'TICKET_CREATED',
      changedAt: new Date(),
      userInfo: currentUser // Store user info temporarily
    }];
    
    await ticket.save();
    console.log('Ticket created successfully:', ticket._id);

    // Skip populate since createdBy is null
    // await ticket.populate('createdBy', 'firstName lastName email');

    // notifyNewTicket(ticket);

    res.status(201).json({
      message: 'Product ticket created successfully',
      ticket,
      autoPopulated: ticketData.chemicalProperties?.autoPopulated || false
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ 
      message: 'Server error during ticket creation',
      error: error.message,
      validationErrors: error.errors || null
    });
  }
};

const saveDraft = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let ticketData = {
      ...req.body,
      status: 'DRAFT',
      createdBy: null,
      sbu: req.body.sbu || 'P90',
      // Ensure skuVariants exists with at least one default entry if not provided
      skuVariants: req.body.skuVariants && req.body.skuVariants.length > 0 
        ? req.body.skuVariants 
        : [{
            type: 'PREPACK',
            sku: '',
            packageSize: { value: 100, unit: 'g' },
            pricing: { listPrice: 0, currency: 'USD' }
          }]
    };

    // Clean up enum fields (same logic as createTicket but simplified for drafts)
    if (ticketData.corpbaseData) {
      if (typeof ticketData.corpbaseData.keyFeatures === 'string' && ticketData.corpbaseData.keyFeatures) {
        ticketData.corpbaseData.keyFeatures = ticketData.corpbaseData.keyFeatures
          .split('\n').map(f => f.trim()).filter(f => f.length > 0);
      }
      if (typeof ticketData.corpbaseData.applications === 'string' && ticketData.corpbaseData.applications) {
        ticketData.corpbaseData.applications = ticketData.corpbaseData.applications
          .split('\n').map(a => a.trim()).filter(a => a.length > 0);
      }
    }

    // Clean up enum fields for validation
    if (ticketData.hazardClassification) {
      if (ticketData.hazardClassification.ghsClass === '') delete ticketData.hazardClassification.ghsClass;
      if (ticketData.hazardClassification.signalWord === '') delete ticketData.hazardClassification.signalWord;
    }

    if (ticketData.chemicalProperties) {
      if (ticketData.chemicalProperties.physicalState === '' || ticketData.chemicalProperties.physicalState === null) {
        delete ticketData.chemicalProperties.physicalState;
      }
    }

    // Clean up main enum fields
    ['sbu', 'status', 'priority'].forEach(field => {
      if (ticketData[field] === '') delete ticketData[field];
    });

    // Clean up SKU variants
    if (ticketData.skuVariants && Array.isArray(ticketData.skuVariants)) {
      ticketData.skuVariants = ticketData.skuVariants.map(sku => {
        if (!sku.type || sku.type === '') sku.type = 'PREPACK';
        if (!sku.packageSize) sku.packageSize = { value: 100, unit: 'g' };
        else {
          if (!sku.packageSize.unit || sku.packageSize.unit === '') sku.packageSize.unit = 'g';
          if (!sku.packageSize.value) sku.packageSize.value = 100;
        }
        if (!sku.pricing) sku.pricing = { listPrice: 0, currency: 'USD' };
        else if (!sku.pricing.currency) sku.pricing.currency = 'USD';
        return sku;
      });
    }

    const ticket = new ProductTicket(ticketData);
    
    // Add creation entry to status history for draft
    const currentUser = getCurrentUser(req);
    ticket.statusHistory = [{
      status: 'DRAFT',
      changedBy: null, // Object ID would go here in real system
      reason: `Draft ticket created by ${currentUser.firstName} ${currentUser.lastName}`,
      action: 'TICKET_CREATED',
      changedAt: new Date(),
      userInfo: currentUser
    }];
    
    await ticket.save();

    res.status(201).json({
      message: 'Draft saved successfully',
      ticket,
      isDraft: true
    });
  } catch (error) {
    console.error('Save draft error:', error);
    return res.status(500).json({ 
      message: 'Server error while saving draft',
      error: error.message,
      validationErrors: error.errors || null
    });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, sbu, priority, page = 1, limit = 10, search } = req.query;
    
    let filter = {
      // By default, exclude archived tickets (completed/canceled)
      status: { $nin: ['COMPLETED', 'CANCELED'] }
    };

    if (status) filter.status = status;
    if (sbu) filter.sbu = sbu;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await ProductTicket.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductTicket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error while fetching tickets' });
  }
};

const getArchivedTickets = async (req, res) => {
  try {
    const { sbu, priority, page = 1, limit = 10, search } = req.query;
    
    let filter = {
      // Only show archived tickets (completed/canceled)
      status: { $in: ['COMPLETED', 'CANCELED'] }
    };

    if (sbu) filter.sbu = sbu;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await ProductTicket.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ updatedAt: -1 }) // Sort by last updated for archived tickets
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductTicket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get archived tickets error:', error);
    res.status(500).json({ message: 'Server error while fetching archived tickets' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let filter = { _id: id, ...req.sbuFilter };
    
    const ticket = await ProductTicket.findOne(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName email')
      .populate('statusHistory.changedBy', 'firstName lastName email')
      .populate('documents.uploadedBy', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error while fetching ticket' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    let filter = { _id: id };

    const ticket = await ProductTicket.findOne(filter);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or access denied' });
    }

    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.ticketNumber;

    // Track status changes
    const oldStatus = ticket.status;
    const newStatus = updateData.status;
    
    // Track SKU base number assignment
    const oldPartNumber = ticket.partNumber?.baseNumber;
    const newPartNumber = updateData.partNumber?.baseNumber;

    // Track significant field changes for edit history
    const significantChanges = [];
    
    // Check for important field changes
    if (updateData.productName && updateData.productName !== ticket.productName) {
      significantChanges.push(`Product name changed from "${ticket.productName}" to "${updateData.productName}"`);
    }
    if (updateData.sbu && updateData.sbu !== ticket.sbu) {
      significantChanges.push(`SBU changed from "${ticket.sbu}" to "${updateData.sbu}"`);
    }
    if (updateData.priority && updateData.priority !== ticket.priority) {
      significantChanges.push(`Priority changed from "${ticket.priority}" to "${updateData.priority}"`);
    }
    if (updateData.chemicalProperties?.casNumber && updateData.chemicalProperties.casNumber !== ticket.chemicalProperties?.casNumber) {
      significantChanges.push(`CAS number changed from "${ticket.chemicalProperties?.casNumber}" to "${updateData.chemicalProperties.casNumber}"`);
    }

    // Apply updates
    Object.assign(ticket, updateData);

    const currentUser = getCurrentUser(req);

    // Add status history entries
    if (newStatus && newStatus !== oldStatus) {
      ticket.statusHistory.push({
        status: newStatus,
        changedBy: null, // Object ID would go here in real system
        reason: `Status changed from ${oldStatus} to ${newStatus} by ${currentUser.firstName} ${currentUser.lastName}`,
        action: 'STATUS_CHANGE',
        userInfo: currentUser
      });
    }

    // Track SKU base number assignment
    if (newPartNumber && newPartNumber !== oldPartNumber) {
      ticket.statusHistory.push({
        status: ticket.status,
        changedBy: null,
        reason: oldPartNumber 
          ? `SKU base number changed from "${oldPartNumber}" to "${newPartNumber}" by ${currentUser.firstName} ${currentUser.lastName}`
          : `SKU base number assigned: "${newPartNumber}" by ${currentUser.firstName} ${currentUser.lastName}`,
        action: 'SKU_ASSIGNMENT',
        userInfo: currentUser
      });
    }

    // Track significant edits
    if (significantChanges.length > 0) {
      ticket.statusHistory.push({
        status: ticket.status,
        changedBy: null,
        reason: `Ticket edited by ${currentUser.firstName} ${currentUser.lastName}: ${significantChanges.join(', ')}`,
        action: 'TICKET_EDIT',
        userInfo: currentUser
      });
    }

    await ticket.save();

    await ticket.populate('createdBy', 'firstName lastName email');
    await ticket.populate('assignedTo', 'firstName lastName email');

    res.json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Server error during ticket update' });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let filter = { _id: id, ...req.sbuFilter };

    const ticket = await ProductTicket.findOne(filter);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or access denied' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    
    // Enhanced status change tracking
    const statusChangeReason = reason || `Status manually changed from ${oldStatus} to ${status}`;
    
    const currentUser = getCurrentUser(req);
    ticket.statusHistory.push({
      status,
      changedBy: null, // Object ID would go here in real system
      reason: `${statusChangeReason} by ${currentUser.firstName} ${currentUser.lastName}`,
      action: 'STATUS_CHANGE',
      details: {
        previousStatus: oldStatus,
        newStatus: status,
        changeType: 'manual'
      },
      userInfo: currentUser
    });

    await ticket.save();

    // notifyStatusChange(ticket, oldStatus, status, null);

    res.json({
      message: 'Ticket status updated successfully',
      ticket: {
        _id: ticket._id,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error during status update' });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    let filter = { _id: id, ...req.sbuFilter };

    const ticket = await ProductTicket.findOne(filter);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or access denied' });
    }

    ticket.comments.push({
      user: null,
      content: content.trim()
    });

    // Track comment addition in status history
    const currentUser = getCurrentUser(req);
    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: null, // Object ID would go here in real system
      reason: `Comment added by ${currentUser.firstName} ${currentUser.lastName}: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
      action: 'COMMENT_ADDED',
      userInfo: currentUser
    });

    await ticket.save();
    await ticket.populate('comments.user', 'firstName lastName email');

    const newComment = ticket.comments[ticket.comments.length - 1];

    notifyCommentAdded(ticket, newComment);

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const filter = {};

    const stats = await Promise.all([
      // Overall stats
      ProductTicket.countDocuments({ ...filter, status: 'DRAFT' }),
      ProductTicket.countDocuments({ ...filter, status: 'SUBMITTED' }),
      ProductTicket.countDocuments({ ...filter, status: 'IN_PROCESS' }),
      ProductTicket.countDocuments({ ...filter, status: 'COMPLETED' }),
      ProductTicket.countDocuments({ ...filter, status: 'CANCELED' }),
      ProductTicket.countDocuments(filter),
      
      // Sarah's 775 tickets (separate tracking)
      ProductTicket.countDocuments({ sbu: '775', status: 'DRAFT' }),
      ProductTicket.countDocuments({ sbu: '775', status: 'SUBMITTED' }),
      ProductTicket.countDocuments({ sbu: '775', status: 'IN_PROCESS' }),
      ProductTicket.countDocuments({ sbu: '775', status: 'COMPLETED' }),
      ProductTicket.countDocuments({ sbu: '775', status: 'CANCELED' }),
      ProductTicket.countDocuments({ sbu: '775' }),
      
      // Aggregations
      ProductTicket.aggregate([
        { $match: filter },
        { $group: { _id: '$sbu', count: { $sum: 1 } } }
      ]),
      ProductTicket.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      // Active tickets (non-archived)
      ProductTicket.countDocuments({ ...filter, status: { $nin: ['COMPLETED', 'CANCELED'] } }),
      
      // Archived tickets (completed/canceled)
      ProductTicket.countDocuments({ ...filter, status: { $in: ['COMPLETED', 'CANCELED'] } })
    ]);

    res.json({
      statusCounts: {
        draft: stats[0],
        submitted: stats[1],
        inProcess: stats[2],
        completed: stats[3],
        canceled: stats[4],
        total: stats[5]
      },
      sarahTickets: {
        draft: stats[6],
        submitted: stats[7],
        inProcess: stats[8],
        completed: stats[9],
        canceled: stats[10],
        total: stats[11]
      },
      sbuBreakdown: stats[12],
      priorityBreakdown: stats[13],
      activeCounts: {
        active: stats[14],
        archived: stats[15]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
};

const lookupCAS = async (req, res) => {
  try {
    const { casNumber } = req.params;
    
    if (!casNumber || !/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      return res.status(400).json({ message: 'Invalid CAS number format' });
    }

    console.log(`CAS lookup request for: ${casNumber}`);
    const enrichedData = await pubchemService.enrichTicketData(casNumber);
    
    res.json({
      message: 'CAS lookup successful',
      data: enrichedData,
      casNumber
    });
  } catch (error) {
    console.error('CAS lookup error:', error);
    res.status(500).json({ 
      message: 'Failed to lookup CAS number',
      error: error.message,
      casNumber: req.params.casNumber
    });
  }
};

module.exports = {
  createTicket,
  saveDraft,
  getTickets,
  getArchivedTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  addComment,
  getDashboardStats,
  lookupCAS
};