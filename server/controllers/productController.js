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

// Extract current user information from request headers
const getCurrentUser = (req) => {
  // Read user information from headers sent by the frontend
  const firstName = req.headers['x-user-firstname'] || 'Unknown';
  const lastName = req.headers['x-user-lastname'] || 'User';
  const email = req.headers['x-user-email'] || '';
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

    let ticketData = {
      ...req.body,
      createdBy: null // Remove authentication requirement
    };

    // All submitted tickets should have SUBMITTED status initially
    // PMOps will manually move them to IN_PROCESS when they start working on them
    if (!ticketData.status || ticketData.status === '') {
      ticketData.status = 'SUBMITTED';
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

    let ticketData = {
      ...req.body,
      status: 'DRAFT',
      createdBy: null
    };

    // Use utility functions to clean and ensure defaults
    ticketData = ensureDefaultSBU(ticketData, 'P90');
    ticketData = ensureDefaultSKU(ticketData);
    ticketData = cleanTicketData(ticketData);

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
    const { status, sbu, priority, page = 1, limit = 10, search, createdBy } = req.query;

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
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'chemicalProperties.casNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Note: createdBy and assignedTo are String fields (email addresses), not ObjectId references
    const tickets = await ProductTicket.find(filter)
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

    // Note: createdBy and assignedTo are String fields (email addresses), not ObjectId references
    const tickets = await ProductTicket.find(filter)
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
    
    // Note: createdBy, assignedTo, comments.user, and statusHistory.changedBy are String fields (email addresses), not ObjectId references
    const ticket = await ProductTicket.findOne(filter);

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

    let updateData = { ...req.body };
    delete updateData.createdBy;

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

    // Track NPDI initiation
    if (isNPDIInitiation) {
      const newTicketNumber = updateData.ticketNumber || npdiTracking.trackingNumber;
      ticket.statusHistory.push({
        status: 'NPDI_INITIATED',
        changedBy: null,
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
      user: null,
      content: content.trim(),
      userInfo: currentUser
    });

    // Track comment addition in status history
    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: null, // Object ID would go here in real system
      reason: `Comment added by ${currentUser.firstName} ${currentUser.lastName}: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
      action: 'COMMENT_ADDED',
      userInfo: currentUser
    });

    await ticket.save();
    // Note: comments.user is a String field (email address), not ObjectId reference

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

    // Get all active tickets with full details for time calculations
    const allTickets = await ProductTicket.find({
      status: { $nin: ['CANCELED'] }
    }).select('ticketNumber status priority sbu createdAt updatedAt statusHistory');

    // Status counts
    const statusCounts = {
      draft: 0,
      submitted: 0,
      inProcess: 0,
      npdiInitiated: 0,
      completed: 0,
      canceled: 0,
      urgent: 0
    };

    // Priority breakdown
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };

    // SBU breakdown
    const sbuCounts = {};

    // Time tracking
    let submittedToInProcessTimes = [];
    let submittedToNPDITimes = [];
    let submittedToCompletedTimes = [];
    let agingTickets = [];

    // Process each ticket
    allTickets.forEach(ticket => {
      // Count by status
      switch (ticket.status) {
        case 'DRAFT': statusCounts.draft++; break;
        case 'SUBMITTED': statusCounts.submitted++; break;
        case 'IN_PROCESS': statusCounts.inProcess++; break;
        case 'NPDI_INITIATED': statusCounts.npdiInitiated++; break;
        case 'COMPLETED': statusCounts.completed++; break;
        case 'CANCELED': statusCounts.canceled++; break;
      }

      // Count by priority
      if (ticket.priority) {
        priorityCounts[ticket.priority]++;
        if (ticket.priority === 'URGENT') {
          statusCounts.urgent++;
        }
      }

      // Count by SBU
      if (ticket.sbu) {
        sbuCounts[ticket.sbu] = (sbuCounts[ticket.sbu] || 0) + 1;
      }

      // Calculate time metrics from status history
      if (ticket.statusHistory && ticket.statusHistory.length > 0) {
        const submittedEntry = ticket.statusHistory.find(h => h.status === 'SUBMITTED' || h.action === 'TICKET_CREATED');
        const inProcessEntry = ticket.statusHistory.find(h => h.status === 'IN_PROCESS');
        const npdiEntry = ticket.statusHistory.find(h => h.status === 'NPDI_INITIATED');
        const completedEntry = ticket.statusHistory.find(h => h.status === 'COMPLETED');

        const submittedDate = submittedEntry ? new Date(submittedEntry.changedAt || ticket.createdAt) : new Date(ticket.createdAt);

        // Time from SUBMITTED to IN_PROCESS
        if (inProcessEntry) {
          const inProcessDate = new Date(inProcessEntry.changedAt);
          const hoursToInProcess = (inProcessDate - submittedDate) / (1000 * 60 * 60);
          submittedToInProcessTimes.push(hoursToInProcess);
        }

        // Time from SUBMITTED to NPDI_INITIATED
        if (npdiEntry) {
          const npdiDate = new Date(npdiEntry.changedAt);
          const hoursToNPDI = (npdiDate - submittedDate) / (1000 * 60 * 60);
          submittedToNPDITimes.push(hoursToNPDI);
        }

        // Time from SUBMITTED to COMPLETED
        if (completedEntry) {
          const completedDate = new Date(completedEntry.changedAt);
          const hoursToCompleted = (completedDate - submittedDate) / (1000 * 60 * 60);
          submittedToCompletedTimes.push(hoursToCompleted);
        }

        // Calculate aging for non-completed tickets
        if (ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELED') {
          const waitingHours = (now - submittedDate) / (1000 * 60 * 60);
          const waitingDays = Math.floor(waitingHours / 24);

          agingTickets.push({
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            priority: ticket.priority,
            sbu: ticket.sbu,
            submittedDate,
            waitingDays,
            waitingHours: Math.round(waitingHours)
          });
        }
      }
    });

    // Sort aging tickets by waiting time (longest first)
    agingTickets.sort((a, b) => b.waitingDays - a.waitingDays);

    // Calculate averages
    const avgSubmittedToInProcess = submittedToInProcessTimes.length > 0
      ? submittedToInProcessTimes.reduce((a, b) => a + b, 0) / submittedToInProcessTimes.length
      : 0;

    const avgSubmittedToNPDI = submittedToNPDITimes.length > 0
      ? submittedToNPDITimes.reduce((a, b) => a + b, 0) / submittedToNPDITimes.length
      : 0;

    const avgSubmittedToCompleted = submittedToCompletedTimes.length > 0
      ? submittedToCompletedTimes.reduce((a, b) => a + b, 0) / submittedToCompletedTimes.length
      : 0;

    // Count tickets completed this week and month based on actual completion date from statusHistory
    const completedTickets = await ProductTicket.find({
      status: 'COMPLETED',
      'statusHistory.status': 'COMPLETED'
    }).select('statusHistory');

    let completedThisWeek = 0;
    let completedThisMonth = 0;

    completedTickets.forEach(ticket => {
      const completedEntry = ticket.statusHistory.find(h => h.status === 'COMPLETED');
      if (completedEntry && completedEntry.changedAt) {
        const completedDate = new Date(completedEntry.changedAt);
        if (completedDate >= oneWeekAgo && completedDate <= now) {
          completedThisWeek++;
        }
        if (completedDate >= oneMonthAgo && completedDate <= now) {
          completedThisMonth++;
        }
      }
    });

    // Get tickets needing immediate attention (URGENT priority + waiting)
    const urgentWaiting = agingTickets.filter(t =>
      t.priority === 'URGENT' && (t.status === 'SUBMITTED' || t.status === 'IN_PROCESS')
    );

    // Calculate throughput (tickets per week)
    const throughputPerWeek = completedThisWeek;
    const estimatedThroughputPerMonth = throughputPerWeek * 4.33;

    res.json({
      statusCounts,
      priorityCounts,
      sbuBreakdown: Object.entries(sbuCounts).map(([sbu, count]) => ({
        _id: sbu,
        count
      })),
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
    res.status(500).json({
      message: 'Failed to lookup CAS number',
      error: error.message,
      casNumber: req.params.casNumber
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

    // Fetch the ticket with all related data
    const ticket = await ProductTicket.findById(id);

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
    const { partNumber } = req.params;

    if (!partNumber || partNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Part number is required'
      });
    }

    console.log(`[SAP Search] Request for part number: ${partNumber}`);

    // Check if Palantir is enabled
    const isEnabled = await palantirService.isEnabled();
    if (!isEnabled) {
      return res.status(503).json({
        success: false,
        message: 'SAP integration is not configured. Please contact your administrator.'
      });
    }

    // Query Palantir Foundry for MARA data
    // The part number should already have -BULK appended by the frontend
    const config = await palantirService.getConfig();
    const query = `SELECT * FROM \`${config.datasetRID}\` WHERE MATNR = '${partNumber}' LIMIT 1`;

    console.log(`[SAP Search] Executing query: ${query}`);

    const result = await palantirService.executeQuery(query);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No SAP data found for part number: ${partNumber}`
      });
    }

    const maraData = result.rows[0];
    console.log(`[SAP Search] Found MARA data:`, Object.keys(maraData));

    // Map MARA fields to ProductTicket fields (only full mappings from documentation)
    const mappedFields = {};
    const metadata = {}; // Store non-editable descriptive data

    // Section 1: Core Product Identification
    if (maraData.TEXT_SHORT) {
      mappedFields.productName = maraData.TEXT_SHORT;
    }
    if (maraData.TEXT_LONG) {
      mappedFields['corpbaseData.productDescription'] = maraData.TEXT_LONG;
    }

    // Section 2: Material Classification & Hierarchy
    // Map YYD_YSBU to SBU
    if (maraData.YYD_YSBU) {
      mappedFields.sbu = maraData.YYD_YSBU;
    } else if (maraData.SPART) {
      mappedFields.sbu = maraData.SPART;
    }

    // Map YYD_MEMBF_TEXT to business line
    if (maraData.YYD_MEMBF_TEXT) {
      mappedFields['businessLine.line'] = maraData.YYD_MEMBF_TEXT;
    }

    // Map YYD_GPHPL to Main Group GPH field, but exclude specific values
    if (maraData.YYD_GPHPL && maraData.YYD_GPHPL !== '1120999') {
      mappedFields['businessLine.mainGroupGPH'] = maraData.YYD_GPHPL;
    }

    // Map YYD_YLOGO_TEXT to brand - pick closest match from available brands
    if (maraData.YYD_YLOGO_TEXT) {
      const logoText = maraData.YYD_YLOGO_TEXT.toUpperCase();

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

      // Default to original text if no match found
      mappedFields.brand = brand || maraData.YYD_YLOGO_TEXT;
    }

    // Section 3: Units of Measure
    if (maraData.MEINS) {
      const baseUnit = maraData.MEINS.toLowerCase();

      // Map to pricing base unit only
      mappedFields['pricingData.baseUnit'] = baseUnit;
    }

    // Section 4: Chemical Properties & Identification
    if (maraData.YYD_CASNR) {
      mappedFields['chemicalProperties.casNumber'] = maraData.YYD_CASNR;
    }

    // Section 5: Storage & Handling
    if (maraData.TEMPB || maraData.TEMPB_TEXT) {
      // Comprehensive temperature mapping function
      // Uses TEMPB_TEXT (text description) if available, falls back to TEMPB code
      const mapTemperature = (tempCode, tempText) => {
        // If text description is available, use intelligent matching
        if (tempText) {
          const text = tempText.toLowerCase().trim();

          // Room temperature / Ambient
          if (text.includes('room temp') || text.includes('ambient') ||
              text.includes('rt') || text.match(/15.*25/) || text.match(/20.*25/)) {
            return 'Ambient';
          }

          // Refrigerated / Cold storage (2-8°C)
          if (text.includes('refrigerat') || text.includes('cold') ||
              text.includes('cool') || text.match(/2.*8/) || text.includes('2-8')) {
            return 'CL (2-8 deg)';
          }

          // Frozen
          if (text.includes('frozen') || text.includes('freez') ||
              text.includes('-20') || text.includes('-80')) {
            return 'Frozen';
          }

          // Controlled room temperature
          if (text.includes('controlled room')) {
            return 'RT (15-25 deg)';
          }

          // If text doesn't match patterns, return the text as-is
          return tempText;
        }

        // Fall back to code-based mapping if no text available
        if (tempCode) {
          const codeMap = {
            // Common SAP standard codes
            '01': 'Frozen (-20 deg)',
            '02': 'CL (2-8 deg)',
            '03': 'RT (15-25 deg)',
            '04': 'Ambient',
            '28': 'Ambient', // Customer code observed: 28 = room temperature
            // Legacy/custom codes
            'W1': 'Ambient',
            'W2': 'RT (15-25 deg)',
            'W3': 'CL (2-8 deg)',
            'W4': 'Frozen (-20 deg)'
          };

          return codeMap[tempCode] || tempCode;
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
    if (maraData.YYD_SOSUB) {
      // Map source/substitution to production type
      // F = Procured (Fremdbeschaffung - External procurement)
      // E = Produced (Eigenfertigung - In-house production)
      if (maraData.YYD_SOSUB === 'F') {
        mappedFields.productionType = 'Procured';
      } else if (maraData.YYD_SOSUB === 'E') {
        mappedFields.productionType = 'Produced';
      }
    }

    // Map ORG_PPL to primary plant (manufacturing plant)
    if (maraData.ORG_PPL) {
      mappedFields.primaryPlant = maraData.ORG_PPL;

      // Store ORG_PPL_TEXT as metadata for display
      if (maraData.ORG_PPL_TEXT) {
        metadata.primaryPlantDescription = maraData.ORG_PPL_TEXT;
      }
    }

    // Map HERKL to country of origin (proper SAP field)
    if (maraData.HERKL) {
      mappedFields.countryOfOrigin = maraData.HERKL;
    }

    // Section 11: Vendor Information (for procured products)
    if (maraData.YYD_MFRNR) {
      mappedFields['vendorInformation.vendorSAPNumber'] = maraData.YYD_MFRNR;
    }
    if (maraData.MFRPN) {
      mappedFields['vendorInformation.vendorProductNumber'] = maraData.MFRPN;
    }

    console.log(`[SAP Search] Mapped ${Object.keys(mappedFields).length} fields`);

    res.json({
      success: true,
      message: `Found SAP data for ${partNumber}`,
      data: maraData,
      mappedFields: mappedFields,
      metadata: metadata, // Include metadata for descriptive fields
      fieldCount: Object.keys(mappedFields).length
    });

  } catch (error) {
    console.error('[SAP Search] Error:', error);

    let errorMessage = 'Failed to search SAP data';
    let statusCode = 500;

    if (error.message.includes('not enabled') || error.message.includes('not configured')) {
      errorMessage = 'SAP integration is not configured';
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
    const { maxResults = 3, maxSearchTime = 20000 } = req.query;

    console.log(`[Similar Products] Starting search for CAS: ${casNumber}`);
    console.log(`[Similar Products] Max results: ${maxResults}, Max time: ${maxSearchTime}ms`);

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
    const config = await palantirService.getConfig();

    if (!config.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Palantir integration is not enabled'
      });
    }

    // Build SQL query to find products with the same CAS
    // Select only MATNR (material number) and TEXT_SHORT (product name)
    // Filter by CAS number and exclude products without material numbers
    const query = `
      SELECT DISTINCT MATNR, TEXT_SHORT
      FROM \`${config.datasetRID}\`
      WHERE YYD_CASNR = '${casNumber}'
        AND MATNR IS NOT NULL
        AND MATNR != ''
      ORDER BY MATNR
      LIMIT ${parseInt(maxResults) * 10}
    `;

    const startTime = Date.now();
    const foundProducts = [];
    const seenMATNRs = new Set();

    try {
      console.log(`[Similar Products] Executing query for CAS: ${casNumber}`);

      const result = await palantirService.executeQuery(query, {
        timeout: parseInt(maxSearchTime)
      });

      if (result && result.rows && result.rows.length > 0) {
        console.log(`[Similar Products] Query returned ${result.rows.length} raw results`);

        // Process results and deduplicate by MATNR
        for (const row of result.rows) {
          if (row.MATNR && !seenMATNRs.has(row.MATNR)) {
            seenMATNRs.add(row.MATNR);
            foundProducts.push({
              MATNR: row.MATNR,
              TEXT_SHORT: row.TEXT_SHORT || 'No name available'
            });

            // Stop if we have enough results
            if (foundProducts.length >= parseInt(maxResults)) {
              console.log(`[Similar Products] Reached target of ${maxResults} unique products`);
              break;
            }
          }
        }

        console.log(`[Similar Products] Found ${foundProducts.length} unique products`);
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