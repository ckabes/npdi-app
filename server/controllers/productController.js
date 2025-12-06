const { validationResult } = require('express-validator');
const ProductTicket = require('../models/ProductTicket');
const User = require('../models/User');
const pubchemService = require('../services/pubchemService');
const teamsNotificationService = require('../services/teamsNotificationService');
const aiContentService = require('../services/aiContentService');
const palantirService = require('../services/palantirService');
const { cleanTicketData, ensureDefaultSKU, ensureDefaultSBU } = require('../utils/enumCleaner');
const { generatePDPChecklist } = require('../services/pdpChecklistExportService');
const { generatePIF } = require('../services/pifExportService');
const { validateSubmissionRequirements } = require('../utils/submissionValidator');

// Extract current user information from request headers
const getCurrentUser = (req) => {
  // Read user information from headers sent by the frontend
  const firstName = req.headers['x-user-firstname'] || 'Unknown';
  const lastName = req.headers['x-user-lastname'] || 'User';
  const email = req.headers['x-user-email'] || '';
  const employeeId = req.headers['x-user-employee-id'] || '';
  const userRole = req.headers['x-user-role'] || 'PRODUCT_MANAGER';

  // Map role to friendly display name
  const roleDisplayMap = {
    'PRODUCT_MANAGER': 'Product Manager',
    'PM_OPS': 'PMOps',
    'ADMIN': 'Administrator'
  };

  return {
    firstName,
    lastName,
    email,
    employeeId,
    role: roleDisplayMap[userRole] || userRole
  };
};

const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors into user-friendly messages
      const errorMessages = errors.array().map(err => {
        if (err.path) {
          return `${err.msg} (Field: ${err.path})`;
        }
        return err.msg;
      });

      return res.status(400).json({
        message: 'Validation failed: ' + errorMessages.join(', '),
        errors: errors.array(),
        validationErrors: errorMessages
      });
    }

    // Get current user information from request headers
    const currentUser = getCurrentUser(req);

    // Look up the user in the database to get the ObjectId and their assigned template
    // Support both employeeId (preferred) and email (fallback) for lookups
    const userQuery = currentUser.employeeId
      ? { employeeId: currentUser.employeeId }
      : { email: currentUser.email };
    const userRecord = await User.findOne(userQuery).populate('ticketTemplate');

    let ticketData = {
      ...req.body,
      createdBy: currentUser.email, // Set to current user's email (legacy)
      createdByEmployeeId: currentUser.employeeId, // Set to current user's employee ID
      createdByUser: userRecord?._id, // Set the user reference if found
      template: userRecord?.ticketTemplate?._id || null // Store the template used to create this ticket
    };

    // All submitted tickets should have SUBMITTED status initially
    // PMOps will manually move them to IN_PROCESS when they start working on them
    if (!ticketData.status || ticketData.status === '') {
      ticketData.status = 'SUBMITTED';
    }

    // Validate submission requirements if status is SUBMITTED
    if (ticketData.status === 'SUBMITTED') {
      const userIdentifier = currentUser.employeeId || currentUser.email;
      const validation = await validateSubmissionRequirements(ticketData, userIdentifier, !!currentUser.employeeId);

      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Cannot submit ticket: required fields are missing',
          error: 'Submission Requirements Not Met',
          missingFields: validation.missingFields,
          requiredFieldKeys: validation.requiredFieldKeys
        });
      }

      // Store the template that was used for validation
      if (validation.template && !ticketData.template) {
        ticketData.template = validation.template._id;
      }
    }

    // Use utility functions to clean and ensure defaults
    ticketData = ensureDefaultSBU(ticketData, 'P90');
    ticketData = ensureDefaultSKU(ticketData);
    ticketData = cleanTicketData(ticketData);

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
          // No auto-generated SKUs for product managers - PMOps will assign
          // Preserve user-entered CorpBase data, use enriched as fallback
          corpbaseData: {
            ...enrichedData.corpbaseData,
            ...ticketData.corpbaseData // User input takes priority
          }
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
    ticket.statusHistory = [{
      status: ticket.status,
      changedBy: currentUser.email, // Email (legacy)
      changedByEmployeeId: currentUser.employeeId, // Employee ID
      reason: `Ticket created with status: ${ticket.status} by ${currentUser.firstName} ${currentUser.lastName}`,
      action: 'TICKET_CREATED',
      changedAt: new Date(),
      userInfo: currentUser // Store user info temporarily
    }];
    
    await ticket.save();
    console.log('Ticket created successfully:', ticket._id);

    // Skip populate since createdBy is null
    // await ticket.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Product ticket created successfully',
      ticket,
      autoPopulated: ticketData.chemicalProperties?.autoPopulated || false
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle different types of errors with specific messages
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));

      return res.status(400).json({
        message: 'Validation failed: ' + validationErrors.join(', '),
        error: 'Validation Error',
        validationErrors: validationErrors
      });
    } else if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `A ticket with this ${field} already exists`,
        error: 'Duplicate Entry',
        field: field
      });
    } else if (error.name === 'CastError') {
      // Invalid data type error
      return res.status(400).json({
        message: `Invalid value for ${error.path}: ${error.value}`,
        error: 'Invalid Data Type'
      });
    } else {
      // Generic server error
      res.status(500).json({
        message: 'Server error during ticket creation. Please try again or contact support if the problem persists.',
        error: error.message,
        validationErrors: error.errors || null
      });
    }
  }
};

const saveDraft = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get current user information from request headers
    const currentUser = getCurrentUser(req);

    // Look up the user in the database to get the ObjectId
    // Support both employeeId (preferred) and email (fallback) for lookups
    const userQuery = currentUser.employeeId
      ? { employeeId: currentUser.employeeId }
      : { email: currentUser.email };
    const userRecord = await User.findOne(userQuery);

    let ticketData = {
      ...req.body,
      status: 'DRAFT',
      createdBy: currentUser.email, // Set to current user's email (legacy)
      createdByEmployeeId: currentUser.employeeId, // Set to current user's employee ID
      createdByUser: userRecord?._id // Set the user reference if found
    };

    // Use utility functions to clean and ensure defaults
    ticketData = ensureDefaultSBU(ticketData, 'P90');
    ticketData = ensureDefaultSKU(ticketData);
    ticketData = cleanTicketData(ticketData);

    const ticket = new ProductTicket(ticketData);

    // Add creation entry to status history for draft
    ticket.statusHistory = [{
      status: 'DRAFT',
      changedBy: currentUser.email, // Email (legacy)
      changedByEmployeeId: currentUser.employeeId, // Employee ID
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
    const { status, sbu, priority, page = 1, limit = 10, search, createdBy, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    let filter = {
      // By default, exclude archived tickets (completed/canceled)
      status: { $nin: ['COMPLETED', 'CANCELED'] }
    };

    // Handle comma-separated status values
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.status = { $in: statusArray };
    }
    if (sbu) filter.sbu = sbu;
    if (priority) filter.priority = priority;
    // Support both email and employeeId for createdBy filter
    if (createdBy) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { createdBy: createdBy },
        { createdByEmployeeId: createdBy }
      );
    }
    if (search) {
      // If we already have $or for createdBy, we need to use $and
      const searchConditions = [
        { productName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: search, $options: 'i' } }
      ];

      if (filter.$or) {
        // Combine both conditions using $and
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic sort object based on query parameters
    const sortField = sortBy || 'updatedAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObject = { [sortField]: sortDirection };

    // Use aggregation pipeline for efficient pagination and field selection
    // This combines the ticket query and count into a single database operation
    const result = await ProductTicket.aggregate([
      { $match: filter },
      {
        $facet: {
          tickets: [
            { $sort: sortObject },
            { $skip: skip },
            { $limit: parseInt(limit) },
            // Lookup user information
            {
              $lookup: {
                from: 'users',
                localField: 'createdByUser',
                foreignField: '_id',
                as: 'createdByUser',
                pipeline: [
                  { $project: { firstName: 1, lastName: 1, email: 1 } }
                ]
              }
            },
            { $unwind: { path: '$createdByUser', preserveNullAndEmptyArrays: true } },
            // Select only needed fields for list view
            {
              $project: {
                ticketNumber: 1,
                productName: 1,
                status: 1,
                priority: 1,
                sbu: 1,
                createdAt: 1,
                updatedAt: 1,
                createdBy: 1,
                createdByUser: 1,
                assignedTo: 1
              }
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const tickets = result[0].tickets;
    const total = result[0].total[0]?.count || 0;

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

    // Use aggregation pipeline for efficient pagination and field selection
    const result = await ProductTicket.aggregate([
      { $match: filter },
      {
        $facet: {
          tickets: [
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            // Lookup user information
            {
              $lookup: {
                from: 'users',
                localField: 'createdByUser',
                foreignField: '_id',
                as: 'createdByUser',
                pipeline: [
                  { $project: { firstName: 1, lastName: 1, email: 1 } }
                ]
              }
            },
            { $unwind: { path: '$createdByUser', preserveNullAndEmptyArrays: true } },
            // Select only needed fields for archived list view
            {
              $project: {
                ticketNumber: 1,
                productName: 1,
                status: 1,
                priority: 1,
                sbu: 1,
                createdAt: 1,
                updatedAt: 1,
                createdBy: 1,
                createdByUser: 1,
                assignedTo: 1
              }
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const tickets = result[0].tickets;
    const total = result[0].total[0]?.count || 0;

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

    // Note: createdBy, assignedTo, comments.user, and statusHistory.changedBy are String fields (email addresses), not ObjectId references
    const ticket = await ProductTicket.findOne(filter)
      .populate('createdByUser', 'firstName lastName email')  // Populate user info for display
      .populate({
        path: 'template',
        populate: {
          path: 'formConfiguration'
        }
      });  // Populate template and its form configuration

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

    // Prevent editing completed or canceled tickets unless status is being changed to an editable status
    const isLockedStatus = ticket.status === 'COMPLETED' || ticket.status === 'CANCELED';
    const isChangingToEditableStatus = req.body.status &&
      req.body.status !== 'COMPLETED' &&
      req.body.status !== 'CANCELED';

    if (isLockedStatus && !isChangingToEditableStatus) {
      return res.status(403).json({
        message: `Cannot edit ${ticket.status.toLowerCase()} tickets. Change the ticket status first to make edits.`,
        error: 'Ticket is locked',
        ticketStatus: ticket.status
      });
    }

    let updateData = { ...req.body };
    delete updateData.createdBy;

    // Debug logging for intellectual property
    if (updateData.intellectualProperty) {
      console.log('[UpdateTicket] Intellectual Property BEFORE cleaning:', JSON.stringify(updateData.intellectualProperty));
    }

    // Allow ticketNumber update ONLY when NPDI is being initiated
    // This changes the ticket number from the original system-generated number (e.g., NPDI-2025-0055)
    // to the new NPDI tracking number from the external NPDI system (e.g., NPDI-2025-0054)
    const oldTicketNumber = ticket.ticketNumber;
    const allowTicketNumberChange = updateData.status === 'NPDI_INITIATED' && updateData.npdiTracking?.trackingNumber;

    if (allowTicketNumberChange && updateData.ticketNumber) {
      // Check if the new ticket number is already in use by another ticket
      const newTicketNumber = updateData.ticketNumber;
      const existingTicket = await ProductTicket.findOne({
        ticketNumber: newTicketNumber,
        _id: { $ne: id } // Exclude current ticket
      });

      if (existingTicket) {
        return res.status(400).json({
          message: `Ticket number "${newTicketNumber}" is already in use by another ticket (${existingTicket._id}). Please use a unique NPDI tracking number.`
        });
      }
    }

    if (!allowTicketNumberChange) {
      delete updateData.ticketNumber; // Protect ticket number from accidental changes
    }

    // Clean enum fields before applying updates
    updateData = cleanTicketData(updateData);

    // Track status changes
    const oldStatus = ticket.status;
    const newStatus = updateData.status;

    // Track SKU base number assignment
    const oldPartNumber = ticket.partNumber?.baseNumber;
    const newPartNumber = updateData.partNumber?.baseNumber;

    // Track NPDI initiation
    const npdiTracking = updateData.npdiTracking;
    const isNPDIInitiation = npdiTracking && !ticket.npdiTracking?.trackingNumber;

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

    // Validate SKU variants - ensure only one BULK SKU exists
    if (updateData.skuVariants && Array.isArray(updateData.skuVariants)) {
      const bulkSKUs = updateData.skuVariants.filter(sku => sku.type === 'BULK');
      if (bulkSKUs.length > 1) {
        return res.status(400).json({
          message: 'Only one BULK SKU is allowed per product.',
          validationErrors: ['Only one BULK SKU is allowed per product. Please remove extra BULK SKUs.']
        });
      }
    }

    // Apply updates
    Object.assign(ticket, updateData);

    const currentUser = getCurrentUser(req);

    // Add status history entries
    if (newStatus && newStatus !== oldStatus) {
      ticket.statusHistory.push({
        status: newStatus,
        changedBy: currentUser.email, // Email (legacy)
        changedByEmployeeId: currentUser.employeeId, // Employee ID
        reason: `Status changed from ${oldStatus} to ${newStatus} by ${currentUser.firstName} ${currentUser.lastName}`,
        action: 'STATUS_CHANGE',
        userInfo: currentUser
      });
    }

    // Track SKU base number assignment
    if (newPartNumber && newPartNumber !== oldPartNumber) {
      ticket.statusHistory.push({
        status: ticket.status,
        changedBy: currentUser.email, // Email (legacy)
        changedByEmployeeId: currentUser.employeeId, // Employee ID
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
        changedBy: currentUser.email, // Email (legacy)
        changedByEmployeeId: currentUser.employeeId, // Employee ID
        reason: `Ticket edited by ${currentUser.firstName} ${currentUser.lastName}: ${significantChanges.join(', ')}`,
        action: 'TICKET_EDIT',
        userInfo: currentUser
      });
    }

    // Track NPDI initiation
    if (isNPDIInitiation) {
      const newTicketNumber = updateData.ticketNumber || npdiTracking.trackingNumber;
      ticket.statusHistory.push({
        status: 'NPDI_INITIATED',
        changedBy: currentUser.email, // Email (legacy)
        changedByEmployeeId: currentUser.employeeId, // Employee ID
        reason: `NPDI initiated by ${currentUser.firstName} ${currentUser.lastName}. Ticket number changed from "${oldTicketNumber}" to "${newTicketNumber}". NPDI Tracking: ${npdiTracking.trackingNumber}`,
        action: 'NPDI_INITIATED',
        userInfo: currentUser,
        details: {
          previousTicketNumber: oldTicketNumber,
          newTicketNumber: newTicketNumber,
          npdiTrackingNumber: npdiTracking.trackingNumber,
          initiatedAt: npdiTracking.initiatedAt
        }
      });
    }

    await ticket.save();

    // Send Teams notification if status changed
    if (newStatus && newStatus !== oldStatus) {
      try {
        await teamsNotificationService.notifyStatusChange(
          ticket,
          oldStatus,
          newStatus,
          currentUser
        );
      } catch (notificationError) {
        // Log error but don't fail the request
        console.error('Failed to send Teams notification:', notificationError.message);
      }
    }

    // Note: createdBy and assignedTo are String fields (email addresses), not ObjectId references
    // So we don't need to populate them

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

    if (!['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED', 'CANCELED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let filter = { _id: id, ...req.sbuFilter };

    const ticket = await ProductTicket.findOne(filter);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found or access denied' });
    }

    const oldStatus = ticket.status;

    // Validate submission requirements if changing status to SUBMITTED
    if (status === 'SUBMITTED' && oldStatus !== 'SUBMITTED') {
      const currentUser = getCurrentUser(req);
      const userIdentifier = currentUser.employeeId || currentUser.email;
      const validation = await validateSubmissionRequirements(ticket.toObject(), userIdentifier, !!currentUser.employeeId);

      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Cannot submit ticket: required fields are missing',
          error: 'Submission Requirements Not Met',
          missingFields: validation.missingFields,
          requiredFieldKeys: validation.requiredFieldKeys
        });
      }
    }

    ticket.status = status;

    // Enhanced status change tracking
    const statusChangeReason = reason || `Status manually changed from ${oldStatus} to ${status}`;

    const currentUser = getCurrentUser(req);
    ticket.statusHistory.push({
      status,
      changedBy: currentUser.email, // Email (legacy)
      changedByEmployeeId: currentUser.employeeId, // Employee ID
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

    // Send Teams notification to ticket originator
    if (oldStatus !== status) {
      try {
        await teamsNotificationService.notifyStatusChange(
          ticket,
          oldStatus,
          status,
          currentUser
        );
      } catch (notificationError) {
        // Log error but don't fail the request
        console.error('Failed to send Teams notification:', notificationError.message);
      }
    }

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

    // Get current user info
    const currentUser = getCurrentUser(req);

    ticket.comments.push({
      user: currentUser.email, // Email (legacy)
      userEmployeeId: currentUser.employeeId, // Employee ID
      content: content.trim(),
      userInfo: currentUser
    });

    // Track comment addition in status history
    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: currentUser.email, // Email (legacy)
      changedByEmployeeId: currentUser.employeeId, // Employee ID
      reason: `Comment added by ${currentUser.firstName} ${currentUser.lastName}: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
      action: 'COMMENT_ADDED',
      userInfo: currentUser
    });

    await ticket.save();

    const newComment = ticket.comments[ticket.comments.length - 1];

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
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Use MongoDB aggregation pipeline for efficient statistics calculation
    // This replaces fetching all tickets into memory and processing with JavaScript
    const stats = await ProductTicket.aggregate([
      {
        $match: {
          status: { $nin: ['CANCELED'] }
        }
      },
      {
        $facet: {
          // Count tickets by status
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          // Count tickets by priority
          priorityCounts: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          // Count tickets by SBU (top 5)
          sbuCounts: [
            {
              $group: {
                _id: '$sbu',
                count: { $sum: 1 }
              }
            },
            {
              $sort: { count: -1 }
            },
            {
              $limit: 5
            }
          ],
          // Total count
          totalCount: [
            {
              $count: 'count'
            }
          ],
          // Calculate average processing times
          processingTimes: [
            {
              $match: {
                statusHistory: { $exists: true, $ne: [] }
              }
            },
            {
              $project: {
                statusHistory: 1,
                createdAt: 1,
                status: 1
              }
            },
            {
              $project: {
                submittedEntry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        as: 'h',
                        cond: {
                          $or: [
                            { $eq: ['$$h.status', 'SUBMITTED'] },
                            { $eq: ['$$h.action', 'TICKET_CREATED'] }
                          ]
                        }
                      }
                    },
                    0
                  ]
                },
                inProcessEntry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        as: 'h',
                        cond: { $eq: ['$$h.status', 'IN_PROCESS'] }
                      }
                    },
                    0
                  ]
                },
                npdiEntry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        as: 'h',
                        cond: { $eq: ['$$h.status', 'NPDI_INITIATED'] }
                      }
                    },
                    0
                  ]
                },
                completedEntry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        as: 'h',
                        cond: { $eq: ['$$h.status', 'COMPLETED'] }
                      }
                    },
                    0
                  ]
                },
                createdAt: 1,
                status: 1
              }
            },
            {
              $project: {
                submittedDate: {
                  $ifNull: [
                    '$submittedEntry.changedAt',
                    '$createdAt'
                  ]
                },
                inProcessDate: '$inProcessEntry.changedAt',
                npdiDate: '$npdiEntry.changedAt',
                completedDate: '$completedEntry.changedAt',
                status: 1
              }
            },
            {
              $project: {
                hoursToInProcess: {
                  $cond: [
                    { $ne: ['$inProcessDate', null] },
                    {
                      $divide: [
                        { $subtract: ['$inProcessDate', '$submittedDate'] },
                        3600000
                      ]
                    },
                    null
                  ]
                },
                hoursToNPDI: {
                  $cond: [
                    { $ne: ['$npdiDate', null] },
                    {
                      $divide: [
                        { $subtract: ['$npdiDate', '$submittedDate'] },
                        3600000
                      ]
                    },
                    null
                  ]
                },
                hoursToCompleted: {
                  $cond: [
                    { $ne: ['$completedDate', null] },
                    {
                      $divide: [
                        { $subtract: ['$completedDate', '$submittedDate'] },
                        3600000
                      ]
                    },
                    null
                  ]
                },
                status: 1
              }
            },
            {
              $group: {
                _id: null,
                avgHoursToInProcess: { $avg: '$hoursToInProcess' },
                avgHoursToNPDI: { $avg: '$hoursToNPDI' },
                avgHoursToCompleted: { $avg: '$hoursToCompleted' }
              }
            }
          ],
          // Calculate aging tickets
          agingTickets: [
            {
              $match: {
                status: { $nin: ['COMPLETED', 'CANCELED'] },
                statusHistory: { $exists: true, $ne: [] }
              }
            },
            {
              $project: {
                status: 1,
                priority: 1,
                ticketNumber: 1,
                sbu: 1,
                createdAt: 1,
                submittedEntry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusHistory',
                        as: 'h',
                        cond: {
                          $or: [
                            { $eq: ['$$h.status', 'SUBMITTED'] },
                            { $eq: ['$$h.action', 'TICKET_CREATED'] }
                          ]
                        }
                      }
                    },
                    0
                  ]
                }
              }
            },
            {
              $project: {
                ticketNumber: 1,
                status: 1,
                priority: 1,
                sbu: 1,
                waitingHours: {
                  $divide: [
                    {
                      $subtract: [
                        now,
                        {
                          $ifNull: [
                            '$submittedEntry.changedAt',
                            '$createdAt'
                          ]
                        }
                      ]
                    },
                    3600000
                  ]
                }
              }
            },
            {
              $project: {
                ticketNumber: 1,
                status: 1,
                priority: 1,
                sbu: 1,
                waitingHours: { $round: ['$waitingHours', 0] },
                waitingDays: {
                  $floor: {
                    $divide: ['$waitingHours', 24]
                  }
                }
              }
            }
          ],
          // Completed tickets this week
          completedThisWeek: [
            {
              $match: {
                status: 'COMPLETED',
                updatedAt: { $gte: oneWeekAgo }
              }
            },
            { $count: 'count' }
          ],
          // Completed tickets this month
          completedThisMonth: [
            {
              $match: {
                status: 'COMPLETED',
                updatedAt: { $gte: oneMonthAgo }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Extract results from aggregation
    const result = stats[0];

    // Process status counts from aggregation
    const statusCounts = {
      draft: 0,
      submitted: 0,
      inProcess: 0,
      npdiInitiated: 0,
      completed: 0,
      canceled: 0,
      urgent: 0
    };

    let totalCount = result.totalCount[0]?.count || 0;

    result.statusCounts.forEach(item => {
      switch (item._id) {
        case 'DRAFT': statusCounts.draft = item.count; break;
        case 'SUBMITTED': statusCounts.submitted = item.count; break;
        case 'IN_PROCESS': statusCounts.inProcess = item.count; break;
        case 'NPDI_INITIATED': statusCounts.npdiInitiated = item.count; break;
        case 'COMPLETED': statusCounts.completed = item.count; break;
        case 'CANCELED': statusCounts.canceled = item.count; break;
      }
    });

    // Priority breakdown from aggregation
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };

    result.priorityCounts.forEach(item => {
      if (item._id) {
        priorityCounts[item._id] = item.count;
        if (item._id === 'URGENT') {
          statusCounts.urgent = item.count;
        }
      }
    });

    // SBU breakdown from aggregation (top 5, already sorted and limited)
    const sbuBreakdown = result.sbuCounts;

    // Extract time metrics from aggregation
    const avgSubmittedToInProcess = result.processingTimes[0]?.avgHoursToInProcess || 0;
    const avgSubmittedToNPDI = result.processingTimes[0]?.avgHoursToNPDI || 0;
    const avgSubmittedToCompleted = result.processingTimes[0]?.avgHoursToCompleted || 0;

    // Extract aging tickets from aggregation
    const agingTickets = result.agingTickets || [];

    // Extract completion counts from aggregation
    const completedThisWeek = result.completedThisWeek[0]?.count || 0;
    const completedThisMonth = result.completedThisMonth[0]?.count || 0;

    // Calculate derived metrics
    const urgentWaiting = agingTickets.filter(t =>
      t.priority === 'URGENT' && (t.status === 'SUBMITTED' || t.status === 'IN_PROCESS')
    );

    const throughputPerWeek = completedThisWeek;
    const estimatedThroughputPerMonth = Math.round(throughputPerWeek * 4.33);

    res.json({
      statusCounts,
      priorityCounts,
      sbuBreakdown,
      averageTimes: {
        submittedToInProcess: {
          hours: Math.round(avgSubmittedToInProcess * 10) / 10,
          days: Math.round((avgSubmittedToInProcess / 24) * 10) / 10
        },
        submittedToNPDI: {
          hours: Math.round(avgSubmittedToNPDI * 10) / 10,
          days: Math.round((avgSubmittedToNPDI / 24) * 10) / 10
        },
        submittedToCompleted: {
          hours: Math.round(avgSubmittedToCompleted * 10) / 10,
          days: Math.round((avgSubmittedToCompleted / 24) * 10) / 10
        }
      },
      agingAnalysis: {
        totalAging: agingTickets.length,
        longestWaiting: agingTickets.slice(0, 10),
        urgentWaiting: urgentWaiting.slice(0, 5)
      },
      throughput: {
        completedThisWeek,
        completedThisMonth,
        estimatedMonthlyRate: Math.round(estimatedThroughputPerMonth)
      },
      performance: {
        backlogSize: statusCounts.submitted + statusCounts.inProcess,
        activeTickets: statusCounts.submitted + statusCounts.inProcess + statusCounts.npdiInitiated,
        completionRate: statusCounts.completed > 0
          ? Math.round((statusCounts.completed / (statusCounts.completed + statusCounts.canceled)) * 100)
          : 0
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

    // Debug: Log additional properties
    console.log('Additional properties returned:', JSON.stringify(enrichedData.chemicalProperties?.additionalProperties, null, 2));

    res.json({
      message: 'CAS lookup successful',
      data: enrichedData,
      casNumber
    });
  } catch (error) {
    console.error('CAS lookup error:', error);

    // Determine appropriate HTTP status code based on error type
    let statusCode = 500;
    let message = 'Failed to lookup CAS number';

    // Check if this is a "not found" error (CAS number doesn't exist in PubChem)
    if (error.message && (
      error.message.includes('not found') ||
      error.message.includes('Not Found') ||
      error.message.includes('PUGREST.NotFound')
    )) {
      statusCode = 404;
      message = error.message; // Use the detailed error message from PubChem service
    }
    // Check if this is an API connectivity error
    else if (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('network')
    )) {
      statusCode = 503;
      message = 'PubChem API is currently unavailable. Please try again later.';
    }
    // Other errors (validation, parsing, etc.)
    else if (error.message) {
      message = error.message;
    }

    res.status(statusCode).json({
      message,
      error: error.message,
      casNumber: req.params.casNumber,
      errorType: statusCode === 404 ? 'NOT_FOUND' : statusCode === 503 ? 'API_UNAVAILABLE' : 'SERVER_ERROR'
    });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;

    // Calculate the cutoff date for recent activities (default: 7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Get tickets that have been updated within the timeframe
    const tickets = await ProductTicket.find({
      status: { $nin: ['CANCELED'] },
      updatedAt: { $gte: cutoffDate }
    }).select('ticketNumber productName status priority chemicalProperties statusHistory comments updatedAt')
      .sort({ updatedAt: -1 })
      .limit(100); // Get up to 100 tickets to ensure we have enough activities

    const activities = [];

    // Extract activities from each ticket
    tickets.forEach(ticket => {
      // Add status history entries (only recent ones)
      if (ticket.statusHistory && ticket.statusHistory.length > 0) {
        ticket.statusHistory.forEach(history => {
          // Only include activities that happened after the cutoff date
          if (history.action && history.changedAt && new Date(history.changedAt) >= cutoffDate) {
            activities.push({
              type: history.action,
              ticketId: ticket._id,
              ticketNumber: ticket.ticketNumber,
              productName: ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled',
              status: ticket.status,
              priority: ticket.priority,
              timestamp: history.changedAt,
              description: history.reason,
              user: history.userInfo ? `${history.userInfo.firstName} ${history.userInfo.lastName}` : 'Unknown User',
              userInfo: history.userInfo,
              details: {
                action: history.action,
                previousStatus: history.details?.previousStatus,
                newStatus: history.details?.newStatus || history.status
              }
            });
          }
        });
      }

      // Add comment entries (only recent ones)
      if (ticket.comments && ticket.comments.length > 0) {
        ticket.comments.forEach(comment => {
          // Only include comments that happened after the cutoff date
          if (comment.timestamp && new Date(comment.timestamp) >= cutoffDate) {
            activities.push({
              type: 'COMMENT_ADDED',
              ticketId: ticket._id,
              ticketNumber: ticket.ticketNumber,
              productName: ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled',
              status: ticket.status,
              priority: ticket.priority,
              timestamp: comment.timestamp,
              description: `Comment: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
              user: comment.userInfo ? `${comment.userInfo.firstName} ${comment.userInfo.lastName}` : 'Unknown User',
              userInfo: comment.userInfo,
              details: {
                action: 'COMMENT_ADDED',
                commentContent: comment.content
              }
            });
          }
        });
      }
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return only the requested limit
    const recentActivities = activities.slice(0, parseInt(limit));

    res.json({
      activities: recentActivities,
      total: activities.length,
      cutoffDate: cutoffDate
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error while fetching recent activity' });
  }
};

// Export ticket as PDP Checklist
const exportPDPChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the ticket with all related data
    const ticket = await ProductTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Generate the PDP Checklist workbook
    const workbook = await generatePDPChecklist(ticket);

    // Set response headers for file download
    const filename = `PDP_Checklist_${ticket.ticketNumber || id}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export PDP Checklist error:', error);
    res.status(500).json({ message: 'Server error while exporting PDP Checklist: ' + error.message });
  }
};

// Export ticket as PIF
const exportPIF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the ticket with all related data
    const ticket = await ProductTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Get current user info (PMOps person exporting)
    const currentUser = getCurrentUser(req);

    // Generate the PIF workbook
    const workbook = await generatePIF(ticket, currentUser);

    // Set response headers for file download
    const filename = `PIF_${ticket.ticketNumber || id}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export PIF error:', error);
    res.status(500).json({ message: 'Server error while exporting PIF: ' + error.message });
  }
};

// Export ticket data as Excel
const exportDataExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the ticket with all related data including createdByUser
    const ticket = await ProductTicket.findById(id)
      .populate('createdByUser', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Generate the data export workbook
    const { generateDataExport } = require('../services/dataExportService');
    const workbook = await generateDataExport(ticket);

    // Set response headers for file download
    const filename = `Data_Export_${ticket.ticketNumber || id}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Data Excel error:', error);
    res.status(500).json({ message: 'Server error while exporting data: ' + error.message });
  }
};

// Generate CorpBase content using AI
const generateCorpBaseContent = async (req, res) => {
  try {
    const { productData, fields, forceTemplate } = req.body;

    // Validate required product data
    if (!productData || !productData.productName) {
      console.error('[CorpBase API] Missing required product name');
      return res.status(400).json({
        success: false,
        message: 'Product name is required for content generation'
      });
    }

    console.log('='.repeat(80));
    console.log('[CorpBase API] Content generation request received');
    console.log('[CorpBase API] Product:', productData.productName);
    console.log('[CorpBase API] Force template mode:', forceTemplate || false);
    console.log('[CorpBase API] Specific fields requested:', fields ? fields.join(', ') : 'all');
    console.log('='.repeat(80));

    // Prepare product data for AI service
    const enrichedData = {
      productName: productData.productName,
      casNumber: productData.casNumber || '',
      molecularFormula: productData.molecularFormula || '',
      molecularWeight: productData.molecularWeight || '',
      iupacName: productData.iupacName || '',
      sbu: productData.sbu || 'Life Science'
    };

    // If forceTemplate is true, skip AI and use template-based generation
    if (forceTemplate) {
      console.log('[CorpBase API] Force template mode enabled - skipping AI');
      const fallbackResult = aiContentService.generateTemplateBasedContent(enrichedData);
      console.log('[CorpBase API] Template-based content generated successfully');
      return res.json(fallbackResult);
    }

    // Generate content using AI service
    const result = await aiContentService.generateCorpBaseContent(enrichedData, fields);

    if (result.success) {
      console.log('[CorpBase API] AI content generation successful');
      console.log('[CorpBase API] Generated fields:', Object.keys(result.content).filter(k => result.content[k]).join(', '));
      res.json(result);
    } else {
      console.warn('[CorpBase API] AI generation failed - using template fallback');
      console.warn('[CorpBase API] Failure reason:', result.message || result.error);
      // Try fallback if primary generation failed
      const fallbackResult = aiContentService.generateTemplateBasedContent(enrichedData);
      fallbackResult.fallbackReason = result.message || result.error;
      console.log('[CorpBase API] Template-based fallback content generated');
      res.json(fallbackResult);
    }

  } catch (error) {
    console.error('[CorpBase API] Exception during content generation:', error.message);
    console.error('[CorpBase API] Stack trace:', error.stack);

    // Provide detailed error information
    const errorResponse = {
      success: false,
      message: 'Failed to generate content: ' + error.message,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    // Add specific guidance based on error type
    if (error.message.includes('API key')) {
      errorResponse.hint = 'Configure the Azure OpenAI API key in Admin Dashboard > System Settings > Integrations > Langdock';
    } else if (error.message.includes('not enabled')) {
      errorResponse.hint = 'Enable AI content generation in Admin Dashboard > System Settings > Integrations > Langdock';
    } else if (error.message.includes('VPN') || error.message.includes('ENOTFOUND')) {
      errorResponse.hint = 'Ensure you are connected to the Merck VPN to access internal Azure OpenAI services';
    }

    res.status(500).json(errorResponse);
  }
};

/**
 * Search for SAP MARA data using Palantir Foundry SQL API
 * Maps MARA fields to ProductTicket schema based on full mapping documentation
 */
const searchMARA = async (req, res) => {
  try {
    const { type, value, limit, offset } = req.query;

    // Validate search parameters
    if (!type || !value || value.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search type and value are required. Use query params: ?type=partNumber|productName|casNumber&value=searchTerm'
      });
    }

    const validTypes = ['partNumber', 'productName', 'casNumber'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid search type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Parse pagination parameters
    const searchLimit = parseInt(limit) || 10;
    const searchOffset = parseInt(offset) || 0;

    console.log(`[SAP Search] Request - Type: ${type}, Value: ${value}, Limit: ${searchLimit}, Offset: ${searchOffset}`);

    // Check if Palantir is enabled
    const isEnabled = await palantirService.isEnabled();
    if (!isEnabled) {
      return res.status(503).json({
        success: false,
        message: 'Palantir integration for SAP data is not configured. Please contact your administrator.'
      });
    }

    // Build query based on search type
    const config = await palantirService.getConfig();
    let query;
    let searchValue = value.trim();

    switch (type) {
      case 'partNumber':
        // Auto-append -BULK if not present
        if (!searchValue.endsWith('-BULK')) {
          searchValue = `${searchValue}-BULK`;
        }
        query = `SELECT * FROM \`${config.datasetRID}\` WHERE MATNR = '${searchValue}' LIMIT 1`;
        break;

      case 'productName':
        // Search in both TEXT_SHORT and TEXT_LONG using case-insensitive prefix matching
        // Matches from the beginning: "Ethanol" matches "Ethanol", "Ethanol, Reagent grade", "Ethanolamine"
        // Use ROW_NUMBER() for pagination since Palantir SQL doesn't support OFFSET
        // Filter for only base -BULK SKUs (not -VAR, -SPEC, -160KG-BULK, etc.)
        const upperSearchValue = searchValue.toUpperCase();
        if (searchOffset === 0) {
          // First page - simple LIMIT query
          query = `SELECT * FROM \`${config.datasetRID}\` WHERE (UPPER(TEXT_SHORT) LIKE '${upperSearchValue}%' OR UPPER(TEXT_LONG) LIKE '${upperSearchValue}%') AND MATNR RLIKE '^[A-Z0-9]+-BULK$' LIMIT ${searchLimit}`;
        } else {
          // Subsequent pages - use ROW_NUMBER() window function
          query = `
            SELECT * FROM (
              SELECT *, ROW_NUMBER() OVER (ORDER BY MATNR) as row_num
              FROM \`${config.datasetRID}\`
              WHERE (UPPER(TEXT_SHORT) LIKE '${upperSearchValue}%' OR UPPER(TEXT_LONG) LIKE '${upperSearchValue}%') AND MATNR RLIKE '^[A-Z0-9]+-BULK$'
            )
            WHERE row_num > ${searchOffset} AND row_num <= ${searchOffset + searchLimit}
          `.trim();
        }
        break;

      case 'casNumber':
        // Search by CAS number (YYD_CASNR field)
        // Use ROW_NUMBER() for pagination since Palantir SQL doesn't support OFFSET
        // Filter for only base -BULK SKUs (not -VAR, -SPEC, -160KG-BULK, etc.)
        if (searchOffset === 0) {
          // First page - simple LIMIT query
          query = `SELECT * FROM \`${config.datasetRID}\` WHERE YYD_CASNR = '${searchValue}' AND MATNR RLIKE '^[A-Z0-9]+-BULK$' LIMIT ${searchLimit}`;
        } else {
          // Subsequent pages - use ROW_NUMBER() window function
          query = `
            SELECT * FROM (
              SELECT *, ROW_NUMBER() OVER (ORDER BY MATNR) as row_num
              FROM \`${config.datasetRID}\`
              WHERE YYD_CASNR = '${searchValue}' AND MATNR RLIKE '^[A-Z0-9]+-BULK$'
            )
            WHERE row_num > ${searchOffset} AND row_num <= ${searchOffset + searchLimit}
          `.trim();
        }
        break;
    }

    console.log(`[SAP Search] Executing query: ${query}`);

    const result = await palantirService.executeQuery(query);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No SAP data found for ${type}: ${searchValue}`
      });
    }

    // For multiple results (product name or CAS search), return list for user selection
    if (type === 'productName' || type === 'casNumber') {
      console.log(`[SAP Search] Found ${result.rows.length} results (offset: ${searchOffset}, limit: ${searchLimit})`);

      const results = result.rows.map(row => ({
        partNumber: row.MATNR || 'N/A',
        productName: row.TEXT_SHORT || row.TEXT_LONG || 'N/A',
        casNumber: row.YYD_CASNR || null, // null for missing CAS to show special UI
        brand: row.YYD_YLOGO_TEXT || 'N/A',
        sbu: row.YYD_YSBU || row.SPART || 'N/A' // Use YYD_YSBU (primary) or SPART (fallback)
      }));

      // Determine if there might be more results
      const hasMore = result.rows.length === searchLimit;

      return res.json({
        success: true,
        message: `Found ${result.rows.length} results for ${type}: ${searchValue}`,
        multipleResults: true,
        results: results,
        count: result.rows.length,
        offset: searchOffset,
        limit: searchLimit,
        hasMore: hasMore
      });
    }

    // Single result - process full field mapping
    const maraData = result.rows[0];
    console.log(`[SAP Search] Found MARA data:`, Object.keys(maraData));
    console.log(`[SAP Search] YYD_CASNR in data?`, 'YYD_CASNR' in maraData, '- value:', maraData.YYD_CASNR);

    // Map MARA fields to ProductTicket fields (only full mappings from documentation)
    const mappedFields = {};
    const metadata = {}; // Store non-editable descriptive data

    // Section 1: Core Product Identification
    // Prefer TEXT_LONG (full product name) over TEXT_SHORT
    // CorpBase data should be generated by AI, not imported from SAP
    if (maraData.TEXT_LONG) {
      mappedFields.productName = maraData.TEXT_LONG;
    } else if (maraData.TEXT_SHORT) {
      mappedFields.productName = maraData.TEXT_SHORT;
    }

    // Section 2: Material Classification & Hierarchy
    // Map YYD_YSBU to SBU
    if (maraData.YYD_YSBU) {
      const sbu = String(maraData.YYD_YSBU).trim();
      mappedFields.sbu = sbu;
      console.log(`[SAP Search] SBU (YYD_YSBU): "${sbu}" → sbu ✓`);
    } else if (maraData.SPART) {
      const sbu = String(maraData.SPART).trim();
      mappedFields.sbu = sbu;
      console.log(`[SAP Search] SBU (SPART fallback): "${sbu}" → sbu ✓`);
    } else {
      console.log(`[SAP Search] SBU: NOT PRESENT (neither YYD_YSBU nor SPART available)`);
    }

    // Map YYD_MEMBF_TEXT to business line
    if (maraData.YYD_MEMBF_TEXT) {
      const businessLine = String(maraData.YYD_MEMBF_TEXT).trim();
      mappedFields['businessLine.line'] = businessLine;
      console.log(`[SAP Search] Business Line (YYD_MEMBF_TEXT): "${businessLine}" → businessLine.line ✓`);
    } else {
      console.log(`[SAP Search] Business Line (YYD_MEMBF_TEXT): NOT PRESENT`);
    }

    // Map PRODH_12 to Material Group field (Main Group GPH)
    if (maraData.PRODH_12) {
      const prodh12 = String(maraData.PRODH_12).trim();
      mappedFields['materialGroup'] = prodh12;
      console.log(`[SAP Search] Product Hierarchy Level 12 (PRODH_12): "${prodh12}" → materialGroup ✓`);
    } else {
      console.log(`[SAP Search] Product Hierarchy Level 12 (PRODH_12): NOT PRESENT`);
    }

    // Map YYD_YLOGO_TEXT to brand - pick closest match from available brands
    if (maraData.YYD_YLOGO_TEXT) {
      const logoText = String(maraData.YYD_YLOGO_TEXT).trim().toUpperCase();

      // Map common brand identifiers to full brand names
      const brandMap = {
        'SIGMA': 'Sigma-Aldrich',
        'SIGMA-ALDRICH': 'Sigma-Aldrich',
        'ALDRICH': 'Sigma-Aldrich',
        'SUPELCO': 'Supelco',
        'MERCK': 'Merck Millipore',
        'MILLIPORE': 'Merck Millipore',
        'MERK': 'Merck Millipore',
        'SAFC': 'SAFC',
        'FLUKA': 'Fluka'
      };

      // Try exact match first
      let brand = brandMap[logoText];

      // If no exact match, try partial match
      if (!brand) {
        for (const [key, value] of Object.entries(brandMap)) {
          if (logoText.includes(key) || key.includes(logoText)) {
            brand = value;
            break;
          }
        }
      }

      // Default to original text if no match found (but warn if not in enum)
      const finalBrand = brand || maraData.YYD_YLOGO_TEXT;
      const validBrands = ['Sigma-Aldrich', 'SAFC', 'Supelco', 'Milli-Q', 'Millipore', 'BioReliance', 'Calbiochem', 'Merck'];

      if (!validBrands.includes(finalBrand)) {
        console.warn(`[SAP Search] Brand (YYD_YLOGO_TEXT): "${maraData.YYD_YLOGO_TEXT}" → "${finalBrand}" - NOT IN ENUM, may be rejected`);
      } else {
        console.log(`[SAP Search] Brand (YYD_YLOGO_TEXT): "${maraData.YYD_YLOGO_TEXT}" → "${finalBrand}" ✓`);
      }

      mappedFields.brand = finalBrand;
    } else {
      console.log(`[SAP Search] Brand (YYD_YLOGO_TEXT): NOT PRESENT`);
    }

    // Section 3: Units of Measure
    if (maraData.MEINS) {
      const baseUnit = String(maraData.MEINS).trim().toLowerCase();
      const validUnits = ['mg', 'g', 'kg', 'ml', 'l', 'ea', 'units', 'vials', 'plates', 'bulk'];

      if (validUnits.includes(baseUnit)) {
        mappedFields['pricingData.baseUnit'] = baseUnit;
        console.log(`[SAP Search] Base Unit (MEINS): "${maraData.MEINS}" → "${baseUnit}" ✓`);
      } else {
        console.warn(`[SAP Search] Base Unit (MEINS): "${maraData.MEINS}" → "${baseUnit}" - NOT IN ENUM (${validUnits.join(', ')}), may be rejected`);
        // Still set it, let schema validation handle it
        mappedFields['pricingData.baseUnit'] = baseUnit;
      }
    } else {
      console.log(`[SAP Search] Base Unit (MEINS): NOT PRESENT`);
    }

    // Section 4: Chemical Properties & Identification
    if (maraData.YYD_CASNR) {
      let casNumber = String(maraData.YYD_CASNR).trim();
      console.log(`[SAP Search] CAS Number (YYD_CASNR) RAW VALUE: "${casNumber}" (type: ${typeof maraData.YYD_CASNR})`);

      // Try to normalize CAS number format
      // Remove any whitespace
      casNumber = casNumber.replace(/\s+/g, '');

      // If it's all digits with no hyphens, try to format it as CAS (assume format: NNNNNNN-NN-N or similar)
      if (/^\d+$/.test(casNumber) && casNumber.length >= 5) {
        // Reformat as standard CAS: take last digit, then 2 before that, then rest
        const lastDigit = casNumber.slice(-1);
        const middleTwo = casNumber.slice(-3, -1);
        const firstPart = casNumber.slice(0, -3);
        casNumber = `${firstPart}-${middleTwo}-${lastDigit}`;
        console.log(`[SAP Search] CAS Number reformatted from digits to: "${casNumber}"`);
      }

      // Validate CAS number format: nnnnnnn-nn-n (1-7 digits, 2 digits, 1 digit)
      // Be more lenient - accept variations like longer first part
      if (/^\d+-\d{2}-\d$/.test(casNumber)) {
        mappedFields['chemicalProperties.casNumber'] = casNumber;
        console.log(`[SAP Search] CAS Number (YYD_CASNR): "${casNumber}" → chemicalProperties.casNumber ✓`);
      } else {
        console.warn(`[SAP Search] CAS Number (YYD_CASNR): "${casNumber}" - INVALID FORMAT (expected xxx-xx-x pattern), STILL IMPORTING TO ALLOW MANUAL CORRECTION`);
        // Import it anyway to allow manual correction
        mappedFields['chemicalProperties.casNumber'] = casNumber;
      }
    } else {
      console.log(`[SAP Search] CAS Number (YYD_CASNR): NOT PRESENT in MARA data - skipping`);
    }

    // Section 5: Storage & Handling
    if (maraData.TEMPB || maraData.TEMPB_TEXT) {
      // Comprehensive temperature mapping function
      // Uses TEMPB_TEXT (text description) if available, falls back to TEMPB code
      const mapTemperature = (tempCode, tempText) => {
        // Schema enum values: 'CL (2-8 deg)', 'F0 (-20 C)', 'F7 (-70 C)', 'RT (RT Controlled)', 'RT (Ambient)', 'F0 (-196 C)'

        // If text description is available, use intelligent matching
        if (tempText) {
          const text = tempText.toLowerCase().trim();

          // Room temperature / Ambient
          if (text.includes('room temp') || text.includes('ambient') ||
              text.includes('rt') || text.match(/15.*25/) || text.match(/20.*25/)) {
            return 'RT (Ambient)';
          }

          // Refrigerated / Cold storage (2-8°C)
          if (text.includes('refrigerat') || text.includes('cold') ||
              text.includes('cool') || text.match(/2.*8/) || text.includes('2-8')) {
            return 'CL (2-8 deg)';
          }

          // Frozen -70 to -80°C
          if (text.includes('-70') || text.includes('-80') || text.includes('-78')) {
            return 'F7 (-70 C)';
          }

          // Frozen -20°C
          if (text.includes('frozen') || text.includes('freez') || text.includes('-20')) {
            return 'F0 (-20 C)';
          }

          // Liquid nitrogen
          if (text.includes('liquid nitrogen') || text.includes('-196')) {
            return 'F0 (-196 C)';
          }

          // Controlled room temperature
          if (text.includes('controlled room') || text.includes('controlled rt')) {
            return 'RT (RT Controlled)';
          }

          // If text doesn't match patterns, default to RT (Ambient)
          console.log(`[SAP Search] Temperature text "${tempText}" doesn't match patterns, defaulting to RT (Ambient)`);
          return 'RT (Ambient)';
        }

        // Fall back to code-based mapping if no text available
        if (tempCode) {
          const codeMap = {
            // Common SAP standard codes mapped to schema enum values
            '01': 'F0 (-20 C)',      // Frozen -20
            '02': 'CL (2-8 deg)',    // Cold/Refrigerated
            '03': 'RT (RT Controlled)', // Controlled RT
            '04': 'RT (Ambient)',    // Ambient
            '28': 'RT (Ambient)',    // Customer code observed: 28 = room temperature
            // Legacy/custom codes
            'W1': 'RT (Ambient)',
            'W2': 'RT (RT Controlled)',
            'W3': 'CL (2-8 deg)',
            'W4': 'F0 (-20 C)'
          };

          return codeMap[tempCode] || 'RT (Ambient)'; // Default to ambient if unknown code
        }

        return null;
      };

      const mappedTemp = mapTemperature(maraData.TEMPB, maraData.TEMPB_TEXT);
      if (mappedTemp) {
        mappedFields['chemicalProperties.storageTemperature'] = mappedTemp;
        console.log(`[SAP Search] Temperature mapping: TEMPB="${maraData.TEMPB}", TEMPB_TEXT="${maraData.TEMPB_TEXT}" → "${mappedTemp}"`);
      }
    }

    // Section 6: Quality & Compliance
    if (maraData.YYD_QASEG) {
      // Map quality segment codes to MQ levels
      const qualityMap = {
        '100': 'MQ100',
        '200': 'MQ200',
        '300': 'MQ300',
        '400': 'MQ400',
        '500': 'MQ500',
        '600': 'MQ600'
      };
      mappedFields['quality.mqQualityLevel'] = qualityMap[maraData.YYD_QASEG] || 'N/A';
    }

    // Section 10: Production Information
    // Note: YYD_SOSUB does not accurately map to production type - removed

    // Map ORG_PPL to primary plant (manufacturing plant)
    if (maraData.ORG_PPL) {
      const plant = String(maraData.ORG_PPL).trim();
      mappedFields.primaryPlant = plant;
      console.log(`[SAP Search] Primary Plant (ORG_PPL): "${plant}" → primaryPlant ✓`);

      // Store ORG_PPL_TEXT as metadata for display
      if (maraData.ORG_PPL_TEXT) {
        metadata.primaryPlantDescription = String(maraData.ORG_PPL_TEXT).trim();
        console.log(`[SAP Search] Primary Plant Description (ORG_PPL_TEXT): "${metadata.primaryPlantDescription}" → metadata ✓`);
      }
    } else {
      console.log(`[SAP Search] Primary Plant (ORG_PPL): NOT PRESENT`);
    }

    // Map HERKL to country of origin (proper SAP field)
    if (maraData.HERKL) {
      const country = String(maraData.HERKL).trim();
      mappedFields.countryOfOrigin = country;
      console.log(`[SAP Search] Country of Origin (HERKL): "${country}" → countryOfOrigin ✓`);
    } else {
      console.log(`[SAP Search] Country of Origin (HERKL): NOT PRESENT`);
    }

    // Section 11: Vendor Information (for procured products)
    if (maraData.YYD_MFRNR) {
      const vendorSAP = String(maraData.YYD_MFRNR).trim();
      mappedFields['vendorInformation.vendorSAPNumber'] = vendorSAP;
      console.log(`[SAP Search] Vendor SAP Number (YYD_MFRNR): "${vendorSAP}" → vendorInformation.vendorSAPNumber ✓`);
    } else {
      console.log(`[SAP Search] Vendor SAP Number (YYD_MFRNR): NOT PRESENT`);
    }

    if (maraData.MFRPN) {
      const vendorPN = String(maraData.MFRPN).trim();
      mappedFields['vendorInformation.vendorProductNumber'] = vendorPN;
      console.log(`[SAP Search] Vendor Product Number (MFRPN): "${vendorPN}" → vendorInformation.vendorProductNumber ✓`);
    } else {
      console.log(`[SAP Search] Vendor Product Number (MFRPN): NOT PRESENT`);
    }

    console.log(`[SAP Search] Mapped ${Object.keys(mappedFields).length} fields`);
    console.log(`[SAP Search] Mapped field paths:`, Object.keys(mappedFields).join(', '));

    // Debug: Log each mapped field with its value
    for (const [key, value] of Object.entries(mappedFields)) {
      console.log(`[SAP Search]   ${key} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }

    res.json({
      success: true,
      message: `Found SAP data for ${type}: ${searchValue}`,
      data: maraData,
      mappedFields: mappedFields,
      metadata: metadata, // Include metadata for descriptive fields
      fieldCount: Object.keys(mappedFields).length,
      multipleResults: false
    });

  } catch (error) {
    console.error('[SAP Search] Error:', error);

    let errorMessage = 'Failed to search SAP data';
    let statusCode = 500;

    if (error.message.includes('not enabled') || error.message.includes('not configured')) {
      errorMessage = 'Palantir integration for SAP data is not configured';
      statusCode = 503;
    } else if (error.message.includes('Authentication') || error.message.includes('token')) {
      errorMessage = 'SAP authentication failed';
      statusCode = 401;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'SAP request timed out';
      statusCode = 504;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Search for similar products with the same CAS number
 * Maximum 20 second search, stops at 3 results
 */
const searchSimilarProducts = async (req, res) => {
  try {
    const { casNumber } = req.params;
    const { maxResults = 3, maxSearchTime = 20000, filterSixDigit = 'true' } = req.query;

    // Convert filterSixDigit to boolean (query params are strings)
    const shouldFilterSixDigit = filterSixDigit === 'true' || filterSixDigit === true;

    console.log(`[Similar Products] Starting search for CAS: ${casNumber}`);
    console.log(`[Similar Products] Max results: ${maxResults}, Max time: ${maxSearchTime}ms`);
    console.log(`[Similar Products] Filter to 6-digit parts: ${shouldFilterSixDigit}`);

    if (!casNumber) {
      return res.status(400).json({
        success: false,
        message: 'CAS number is required'
      });
    }

    // Validate CAS number format
    if (!/^\d{1,7}-\d{2}-\d$/.test(casNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CAS number format'
      });
    }

    const palantirService = require('../services/palantirService');

    // Check if Palantir is enabled
    const isEnabled = await palantirService.isEnabled();
    if (!isEnabled) {
      return res.status(503).json({
        success: false,
        message: 'Palantir integration is not enabled'
      });
    }

    const config = await palantirService.getConfig();

    // Build SQL query to find products with the same CAS
    // Select only MATNR (material number) and TEXT_SHORT (product name)
    // Filter by CAS number and exclude products without material numbers
    // Optionally filter to only 6-digit part numbers (filters out 5-digit legacy parts)
    const sixDigitFilter = shouldFilterSixDigit
      ? "AND REGEXP_LIKE(MATNR, '^[0-9]{6}')"
      : "";

    const query = `
      SELECT DISTINCT MATNR, TEXT_SHORT
      FROM \`${config.datasetRID}\`
      WHERE YYD_CASNR = '${casNumber}'
        AND MATNR IS NOT NULL
        AND MATNR != ''
        ${sixDigitFilter}
      ORDER BY MATNR
      LIMIT ${parseInt(maxResults) * 50}
    `;

    const startTime = Date.now();
    const foundProducts = [];
    const seenPrefixes = new Set(); // Track first 6 digits to identify unique products

    try {
      console.log(`[Similar Products] Executing query for CAS: ${casNumber}`);

      const result = await palantirService.executeQuery(query, {
        timeout: parseInt(maxSearchTime)
      });

      if (result && result.rows && result.rows.length > 0) {
        console.log(`[Similar Products] Query returned ${result.rows.length} raw results`);

        // Process results and deduplicate by first 6 digits of MATNR
        // Products with the same first 6 digits are variants (different sizes, etc.)
        for (const row of result.rows) {
          if (row.MATNR) {
            // Extract first 6 characters from MATNR (e.g., "176036" from "176036-BULK")
            const prefix = row.MATNR.substring(0, 6);

            // Only include products with at least 6 digits in the prefix if filter is enabled
            // Skip entries like "02483-" which have only 5 digits
            if (shouldFilterSixDigit) {
              const digitCount = (prefix.match(/\d/g) || []).length;
              if (digitCount < 6) {
                console.log(`[Similar Products] Skipping ${row.MATNR}: prefix "${prefix}" has only ${digitCount} digits (need 6+)`);
                continue;
              }
            }

            // Only include this product if we haven't seen this prefix before
            if (!seenPrefixes.has(prefix)) {
              seenPrefixes.add(prefix);
              foundProducts.push({
                MATNR: prefix, // Only show first 6 digits, not the full SKU
                TEXT_SHORT: row.TEXT_SHORT || 'No name available'
              });

              console.log(`[Similar Products] Added unique product: ${prefix} (from ${row.MATNR})`);

              // Stop if we have enough results
              if (foundProducts.length >= parseInt(maxResults)) {
                console.log(`[Similar Products] Reached target of ${maxResults} unique products`);
                break;
              }
            } else {
              console.log(`[Similar Products] Skipping variant: ${row.MATNR} (prefix ${prefix} already seen)`);
            }
          }
        }

        console.log(`[Similar Products] Found ${foundProducts.length} unique products (by first 6 digits)`);
      } else {
        console.log(`[Similar Products] No products found with CAS: ${casNumber}`);
      }

      const elapsed = Date.now() - startTime;

      res.json({
        success: true,
        message: foundProducts.length > 0
          ? `Found ${foundProducts.length} similar product${foundProducts.length === 1 ? '' : 's'}`
          : `No similar products found`,
        products: foundProducts,
        searchTime: Math.round(elapsed / 1000),
        casNumber: casNumber
      });

    } catch (queryError) {
      console.error('[Similar Products] Query execution error:', queryError);

      const elapsed = Date.now() - startTime;

      // Check if it's a timeout
      if (queryError.message.includes('timeout') || queryError.message.includes('timed out')) {
        return res.json({
          success: true,
          message: `Search timed out after ${Math.round(elapsed / 1000)} seconds`,
          products: foundProducts, // Return any products found before timeout
          searchTime: Math.round(elapsed / 1000),
          casNumber: casNumber,
          timedOut: true
        });
      }

      throw queryError; // Re-throw other errors
    }

  } catch (error) {
    console.error('[Similar Products] Error:', error);

    let errorMessage = 'Failed to search similar products';
    let statusCode = 500;

    if (error.message.includes('not enabled') || error.message.includes('not configured')) {
      errorMessage = 'Palantir integration is not configured';
      statusCode = 503;
    } else if (error.message.includes('Authentication') || error.message.includes('token')) {
      errorMessage = 'Palantir authentication failed';
      statusCode = 401;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Search request timed out';
      statusCode = 504;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
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
  lookupCAS,
  searchMARA,
  searchSimilarProducts,
  getRecentActivity,
  exportPDPChecklist,
  exportPIF,
  exportDataExcel,
  generateCorpBaseContent
};