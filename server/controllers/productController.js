const { validationResult } = require('express-validator');
const ProductTicket = require('../models/ProductTicket');
const User = require('../models/User');
const pubchemService = require('../services/pubchemService');
const teamsNotificationService = require('../services/teamsNotificationService');
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
      return res.status(400).json({ errors: errors.array() });
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
      .populate('statusHistory.changedBy', 'firstName lastName email');

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
    delete updateData.ticketNumber;

    // Clean enum fields before applying updates
    updateData = cleanTicketData(updateData);

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
    await ticket.populate('comments.user', 'firstName lastName email');

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

    // Count tickets completed this week and month
    const completedThisWeek = await ProductTicket.countDocuments({
      status: 'COMPLETED',
      updatedAt: { $gte: oneWeekAgo }
    });

    const completedThisMonth = await ProductTicket.countDocuments({
      status: 'COMPLETED',
      updatedAt: { $gte: oneMonthAgo }
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
    const { limit = 10 } = req.query;

    // Get all active tickets with status history and comments
    const tickets = await ProductTicket.find({
      status: { $nin: ['CANCELED'] }
    }).select('ticketNumber productName status priority chemicalProperties statusHistory comments updatedAt')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit) * 3); // Get more tickets to ensure we have enough activities

    const activities = [];

    // Extract activities from each ticket
    tickets.forEach(ticket => {
      // Add status history entries
      if (ticket.statusHistory && ticket.statusHistory.length > 0) {
        ticket.statusHistory.forEach(history => {
          if (history.action && history.changedAt) {
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

      // Add comment entries
      if (ticket.comments && ticket.comments.length > 0) {
        ticket.comments.forEach(comment => {
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
        });
      }
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return only the requested limit
    const recentActivities = activities.slice(0, parseInt(limit));

    res.json({
      activities: recentActivities,
      total: activities.length
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
  getRecentActivity,
  exportPDPChecklist,
  exportPIF
};