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

    // Use MongoDB aggregation pipeline for efficient statistics calculation
    // This replaces fetching all tickets into memory and processing with JavaScript
    const stats = await ProductTicket.aggregate([
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
          // Count tickets by SBU with percentages
          sbuCounts: [
            {
              $group: {
                _id: '$sbu',
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                sbu: '$_id',
                count: 1,
                _id: 0
              }
            }
          ],
          // Total ticket count
          totalCount: [
            {
              $count: 'count'
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
          ],
          // Calculate average processing times from status history
          processingTimes: [
            {
              $match: {
                statusHistory: { $exists: true, $ne: [] }
              }
            },
            {
              $project: {
                statusHistory: 1,
                createdAt: 1
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
                createdAt: 1
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
                completedDate: '$completedEntry.changedAt'
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
                }
              }
            },
            {
              $group: {
                _id: null,
                avgHoursToInProcess: {
                  $avg: '$hoursToInProcess'
                },
                avgHoursToCompleted: {
                  $avg: '$hoursToCompleted'
                }
              }
            }
          ],
          // Calculate aging tickets (non-completed/canceled)
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
                status: 1,
                priority: 1,
                sbu: 1,
                submittedDate: {
                  $ifNull: [
                    '$submittedEntry.changedAt',
                    '$createdAt'
                  ]
                }
              }
            },
            {
              $project: {
                ticketId: '$_id',
                status: 1,
                priority: 1,
                sbu: 1,
                waitingHours: {
                  $divide: [
                    { $subtract: [now, '$submittedDate'] },
                    3600000
                  ]
                }
              }
            },
            {
              $project: {
                ticketId: 1,
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
          ]
        }
      }
    ]);

    // Extract results from aggregation
    const result = stats[0];

    // Process status counts
    const statusCounts = {
      draft: 0,
      submitted: 0,
      inProcess: 0,
      npdiInitiated: 0,
      completed: 0,
      canceled: 0,
      total: result.totalCount[0]?.count || 0
    };

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

    // Process priority counts
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };

    result.priorityCounts.forEach(item => {
      if (item._id) {
        priorityCounts[item._id] = item.count;
      }
    });

    // Process SBU counts with percentages
    const sbuCounts = result.sbuCounts.map(item => ({
      sbu: item.sbu,
      count: item.count,
      percentage: statusCounts.total > 0
        ? Math.round((item.count / statusCounts.total) * 100)
        : 0
    }));

    // Extract completion counts
    const completedThisWeek = result.completedThisWeek[0]?.count || 0;
    const completedThisMonth = result.completedThisMonth[0]?.count || 0;

    // Extract average processing times
    const avgSubmittedToInProcess = result.processingTimes[0]?.avgHoursToInProcess || 0;
    const avgSubmittedToCompleted = result.processingTimes[0]?.avgHoursToCompleted || 0;

    // Get aging tickets
    const agingTickets = result.agingTickets || [];

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
        bySBU: sbuCounts  // Already an array of {sbu, count, percentage} from aggregation
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
