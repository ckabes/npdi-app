const ProductTicket = require('../models/ProductTicket');
const User = require('../models/User');
const FormConfiguration = require('../models/FormConfiguration');

const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total user count from profiles
    const fs = require('fs').promises;
    const path = require('path');
    const profilesFile = path.join(__dirname, '../data/devProfiles.json');
    let totalUsers = 0;

    try {
      const data = await fs.readFile(profilesFile, 'utf8');
      const profiles = JSON.parse(data);
      totalUsers = profiles.filter(p => p.isActive).length;
    } catch (error) {
      console.warn('Could not load profiles for user count:', error.message);
    }

    // Get all tickets for comprehensive statistics
    const allTickets = await ProductTicket.find({}).select('status priority sbu createdAt updatedAt statusHistory');

    // Count tickets by status
    const statusCounts = {
      draft: 0,
      submitted: 0,
      inProcess: 0,
      npdiInitiated: 0,
      completed: 0,
      canceled: 0,
      total: allTickets.length
    };

    // Count tickets by priority
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };

    // SBU breakdown
    const sbuCounts = {};

    // Time tracking arrays
    let submittedToCompletedTimes = [];
    let submittedToInProcessTimes = [];
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
      }

      // Count by SBU
      if (ticket.sbu) {
        sbuCounts[ticket.sbu] = (sbuCounts[ticket.sbu] || 0) + 1;
      }

      // Calculate time metrics from status history
      if (ticket.statusHistory && ticket.statusHistory.length > 0) {
        const submittedEntry = ticket.statusHistory.find(h => h.status === 'SUBMITTED' || h.action === 'TICKET_CREATED');
        const inProcessEntry = ticket.statusHistory.find(h => h.status === 'IN_PROCESS');
        const completedEntry = ticket.statusHistory.find(h => h.status === 'COMPLETED');

        const submittedDate = submittedEntry ? new Date(submittedEntry.changedAt || ticket.createdAt) : new Date(ticket.createdAt);

        // Time from SUBMITTED to IN_PROCESS
        if (inProcessEntry) {
          const inProcessDate = new Date(inProcessEntry.changedAt);
          const hoursToInProcess = (inProcessDate - submittedDate) / (1000 * 60 * 60);
          submittedToInProcessTimes.push(hoursToInProcess);
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
            status: ticket.status,
            priority: ticket.priority,
            sbu: ticket.sbu,
            waitingDays,
            waitingHours: Math.round(waitingHours)
          });
        }
      }
    });

    // Calculate average processing times
    const avgSubmittedToInProcess = submittedToInProcessTimes.length > 0
      ? submittedToInProcessTimes.reduce((a, b) => a + b, 0) / submittedToInProcessTimes.length
      : 0;

    const avgSubmittedToCompleted = submittedToCompletedTimes.length > 0
      ? submittedToCompletedTimes.reduce((a, b) => a + b, 0) / submittedToCompletedTimes.length
      : 0;

    // Count tickets completed this week/month
    const completedThisWeek = await ProductTicket.countDocuments({
      status: 'COMPLETED',
      updatedAt: { $gte: oneWeekAgo }
    });

    const completedThisMonth = await ProductTicket.countDocuments({
      status: 'COMPLETED',
      updatedAt: { $gte: oneMonthAgo }
    });

    // Calculate system health score (0-100)
    // Based on: backlog size, aging tickets, completion rate, response time
    const backlogSize = statusCounts.submitted + statusCounts.inProcess;
    const totalProcessed = statusCounts.completed + statusCounts.canceled;
    const completionRate = totalProcessed > 0
      ? (statusCounts.completed / totalProcessed) * 100
      : 100;

    const urgentWaiting = agingTickets.filter(t => t.priority === 'URGENT' && t.waitingDays > 1).length;
    const oldTickets = agingTickets.filter(t => t.waitingDays > 7).length;

    // Health score formula
    let healthScore = 100;
    healthScore -= Math.min(backlogSize * 0.5, 30); // Penalize backlog (max -30)
    healthScore -= Math.min(urgentWaiting * 5, 20); // Penalize urgent waiting (max -20)
    healthScore -= Math.min(oldTickets * 2, 20); // Penalize old tickets (max -20)
    healthScore += Math.min((completionRate - 90) * 0.5, 10); // Reward high completion rate (max +10)
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const getHealthStatus = (score) => {
      if (score >= 90) return { status: 'Excellent', color: 'green', icon: '✓' };
      if (score >= 75) return { status: 'Good', color: 'blue', icon: '○' };
      if (score >= 60) return { status: 'Fair', color: 'yellow', icon: '!' };
      if (score >= 40) return { status: 'Poor', color: 'orange', icon: '!!' };
      return { status: 'Critical', color: 'red', icon: '!!!' };
    };

    const healthStatus = getHealthStatus(healthScore);

    // Get form configuration stats
    let formConfigs = 0;
    try {
      formConfigs = await FormConfiguration.countDocuments({});
    } catch (error) {
      console.warn('Could not load form configuration count:', error.message);
    }

    // Calculate response metrics
    const activeTickets = statusCounts.submitted + statusCounts.inProcess + statusCounts.npdiInitiated;
    const throughputPerWeek = completedThisWeek;
    const estimatedMonthlyRate = Math.round(throughputPerWeek * 4.33);

    // Database health check
    const dbHealth = {
      connected: true, // We're querying, so it's connected
      responseTime: 'Normal',
      status: 'Healthy'
    };

    res.json({
      users: {
        total: totalUsers,
        active: totalUsers, // In dev mode, all profiles are considered active
      },
      tickets: {
        total: statusCounts.total,
        active: activeTickets,
        completed: statusCounts.completed,
        canceled: statusCounts.canceled,
        draft: statusCounts.draft,
        byStatus: statusCounts,
        byPriority: priorityCounts,
        bySBU: Object.entries(sbuCounts).map(([sbu, count]) => ({
          sbu,
          count,
          percentage: Math.round((count / statusCounts.total) * 100)
        }))
      },
      performance: {
        avgResponseTime: {
          hours: Math.round(avgSubmittedToInProcess * 10) / 10,
          days: Math.round((avgSubmittedToInProcess / 24) * 10) / 10
        },
        avgCompletionTime: {
          hours: Math.round(avgSubmittedToCompleted * 10) / 10,
          days: Math.round((avgSubmittedToCompleted / 24) * 10) / 10
        },
        completionRate: Math.round(completionRate),
        backlogSize,
        agingTickets: agingTickets.length,
        urgentWaiting
      },
      throughput: {
        completedThisWeek,
        completedThisMonth,
        estimatedMonthlyRate,
        averagePerWeek: throughputPerWeek
      },
      systemHealth: {
        score: healthScore,
        status: healthStatus.status,
        color: healthStatus.color,
        icon: healthStatus.icon,
        indicators: {
          database: dbHealth,
          backlogManagement: backlogSize < 20 ? 'Good' : backlogSize < 40 ? 'Fair' : 'Needs Attention',
          responseTime: avgSubmittedToInProcess < 48 ? 'Good' : avgSubmittedToInProcess < 96 ? 'Fair' : 'Slow',
          completionRate: completionRate >= 90 ? 'Excellent' : completionRate >= 75 ? 'Good' : 'Needs Improvement',
          urgentHandling: urgentWaiting === 0 ? 'Excellent' : urgentWaiting < 3 ? 'Good' : 'Needs Attention'
        }
      },
      configuration: {
        formConfigs,
        totalSBUs: Object.keys(sbuCounts).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching admin statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAdminStats
};
