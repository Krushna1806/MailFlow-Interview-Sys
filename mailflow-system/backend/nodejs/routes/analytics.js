const express = require('express');
const router = express.Router();

// Mock data for analytics
const generateMockData = (userEmail) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Generate daily data for the past 30 days
    const dailyData = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000));
        dailyData.push({
            date: date.toISOString().split('T')[0],
            emailsSent: Math.floor(Math.random() * 20) + 1,
            interviewsScheduled: Math.floor(Math.random() * 5) + 1,
            responses: Math.floor(Math.random() * 15) + 1,
            aiGenerated: Math.floor(Math.random() * 10) + 1
        });
    }

    return {
        daily: dailyData,
        totals: {
            emailsSent: dailyData.reduce((sum, day) => sum + day.emailsSent, 0),
            interviewsScheduled: dailyData.reduce((sum, day) => sum + day.interviewsScheduled, 0),
            responses: dailyData.reduce((sum, day) => sum + day.responses, 0),
            aiGenerated: dailyData.reduce((sum, day) => sum + day.aiGenerated, 0)
        }
    };
};

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', (req, res) => {
    try {
        const mockData = generateMockData(req.user.email);
        
        const dashboardStats = {
            overview: {
                emailsSent: mockData.totals.emailsSent,
                interviewsScheduled: mockData.totals.interviewsScheduled,
                responseRate: Math.round((mockData.totals.responses / mockData.totals.emailsSent) * 100),
                aiGenerated: mockData.totals.aiGenerated
            },
            trends: {
                emailsSent: {
                    current: mockData.totals.emailsSent,
                    previous: Math.floor(mockData.totals.emailsSent * 0.8),
                    change: 25
                },
                interviewsScheduled: {
                    current: mockData.totals.interviewsScheduled,
                    previous: Math.floor(mockData.totals.interviewsScheduled * 0.9),
                    change: 12
                },
                responseRate: {
                    current: Math.round((mockData.totals.responses / mockData.totals.emailsSent) * 100),
                    previous: 65,
                    change: 5
                }
            },
            recentActivity: [
                {
                    type: 'email_sent',
                    description: 'Interview invitation sent to John Doe',
                    timestamp: new Date(Date.now() - 10 * 60 * 1000),
                    metadata: { candidate: 'John Doe', position: 'Frontend Developer' }
                },
                {
                    type: 'interview_scheduled',
                    description: 'Interview scheduled with Jane Smith',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    metadata: { candidate: 'Jane Smith', position: 'Backend Developer', date: '2024-01-20' }
                },
                {
                    type: 'ai_generated',
                    description: 'AI generated follow-up email',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                    metadata: { template: 'follow-up', words: 150 }
                },
                {
                    type: 'template_created',
                    description: 'New email template created',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    metadata: { template: 'rejection', category: 'application' }
                }
            ]
        };

        res.status(200).json({
            success: true,
            data: dashboardStats
        });

    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard analytics'
        });
    }
});

// @route   GET /api/analytics/reports
// @desc    Get detailed analytics reports
// @access  Private
router.get('/reports', (req, res) => {
    try {
        const { period = '30d', type = 'all' } = req.query;
        const mockData = generateMockData(req.user.email);
        
        const reports = {
            emailPerformance: {
                totalSent: mockData.totals.emailsSent,
                totalResponses: mockData.totals.responses,
                responseRate: Math.round((mockData.totals.responses / mockData.totals.emailsSent) * 100),
                bounceRate: 3.2,
                openRate: 78.5,
                clickRate: 24.8,
                byTemplate: {
                    'interview-invitation': { sent: 85, responses: 68, rate: 80 },
                    'follow-up': { sent: 45, responses: 23, rate: 51 },
                    'offer': { sent: 12, responses: 11, rate: 92 },
                    'rejection': { sent: 28, responses: 8, rate: 29 }
                }
            },
            interviewMetrics: {
                totalScheduled: mockData.totals.interviewsScheduled,
                completed: Math.floor(mockData.totals.interviewsScheduled * 0.8),
                cancelled: Math.floor(mockData.totals.interviewsScheduled * 0.1),
                noShow: Math.floor(mockData.totals.interviewsScheduled * 0.1),
                successRate: 85,
                averageDuration: 45,
                byType: {
                    video: { count: 35, success: 88 },
                    phone: { count: 25, success: 82 },
                    'in-person': { count: 15, success: 90 }
                }
            },
            aiUsage: {
                totalGenerated: mockData.totals.aiGenerated,
                averageLength: 125,
                mostUsedTemplates: ['interview-invitation', 'follow-up'],
                timeSaved: 8.5, // hours
                byCategory: {
                    'interview': 45,
                    'application': 32,
                    'offer': 15,
                    'rejection': 18
                }
            },
            timeAnalysis: {
                dailyData: mockData.daily.slice(-7), // Last 7 days
                peakHours: [9, 10, 11, 14, 15],
                peakDays: ['Tuesday', 'Wednesday', 'Thursday'],
                busiest: {
                    hour: 10,
                    day: 'Wednesday'
                }
            }
        };

        res.status(200).json({
            success: true,
            data: reports,
            meta: {
                period,
                type,
                generatedAt: new Date(),
                totalDataPoints: mockData.daily.length
            }
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    }
});

// @route   GET /api/analytics/performance
// @desc    Get performance metrics
// @access  Private
router.get('/performance', (req, res) => {
    try {
        const { metric = 'all', granularity = 'daily' } = req.query;
        const mockData = generateMockData(req.user.email);
        
        const performance = {
            emailMetrics: {
                deliveryRate: 97.8,
                openRate: 78.5,
                clickRate: 24.8,
                responseRate: Math.round((mockData.totals.responses / mockData.totals.emailsSent) * 100),
                bounceRate: 2.2,
                unsubscribeRate: 0.5,
                spamRate: 0.1
            },
            systemMetrics: {
                averageProcessingTime: 1.2, // seconds
                apiResponseTime: 250, // milliseconds
                uptime: 99.9,
                errorRate: 0.1,
                throughput: 150 // emails per hour
            },
            userEngagement: {
                activeUsers: 45,
                avgSessionDuration: 18.5, // minutes
                featuresUsed: {
                    compose: 95,
                    templates: 78,
                    interviews: 65,
                    analytics: 45,
                    aiGenerate: 82
                },
                mostActiveHours: [9, 10, 11, 14, 15, 16]
            },
            trends: mockData.daily.map(day => ({
                date: day.date,
                emails: day.emailsSent,
                interviews: day.interviewsScheduled,
                aiUsage: day.aiGenerated,
                responseRate: Math.round((day.responses / day.emailsSent) * 100)
            }))
        };

        res.status(200).json({
            success: true,
            data: performance,
            meta: {
                metric,
                granularity,
                lastUpdated: new Date(),
                dataRange: {
                    start: mockData.daily[0].date,
                    end: mockData.daily[mockData.daily.length - 1].date
                }
            }
        });

    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance metrics'
        });
    }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private
router.get('/export', (req, res) => {
    try {
        const { format = 'json', period = '30d' } = req.query;
        const mockData = generateMockData(req.user.email);
        
        const exportData = {
            metadata: {
                exportedAt: new Date(),
                period,
                userEmail: req.user.email,
                recordCount: mockData.daily.length
            },
            summary: {
                totalEmailsSent: mockData.totals.emailsSent,
                totalInterviews: mockData.totals.interviewsScheduled,
                totalResponses: mockData.totals.responses,
                averageResponseRate: Math.round((mockData.totals.responses / mockData.totals.emailsSent) * 100)
            },
            dailyBreakdown: mockData.daily,
            insights: {
                bestPerformingDay: mockData.daily.reduce((best, current) => 
                    current.emailsSent > best.emailsSent ? current : best
                ),
                totalAiUsage: mockData.totals.aiGenerated,
                engagementTrend: 'increasing'
            }
        };

        if (format === 'csv') {
            // Convert to CSV format
            const csvHeader = 'Date,Emails Sent,Interviews Scheduled,Responses,AI Generated\n';
            const csvData = mockData.daily.map(day => 
                `${day.date},${day.emailsSent},${day.interviewsScheduled},${day.responses},${day.aiGenerated}`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="mailflow-analytics-${period}.csv"`);
            res.send(csvHeader + csvData);
        } else {
            res.status(200).json({
                success: true,
                data: exportData
            });
        }

    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export analytics data'
        });
    }
});

// @route   GET /api/analytics/realtime
// @desc    Get real-time analytics
// @access  Private
router.get('/realtime', (req, res) => {
    try {
        const realTimeData = {
            currentUsers: Math.floor(Math.random() * 15) + 5,
            emailsInQueue: Math.floor(Math.random() * 25),
            activeInterviews: Math.floor(Math.random() * 8),
            systemLoad: Math.random() * 60 + 20,
            recentEvents: [
                {
                    type: 'email_sent',
                    timestamp: new Date(Date.now() - 30000),
                    details: 'Interview invitation sent'
                },
                {
                    type: 'interview_scheduled',
                    timestamp: new Date(Date.now() - 120000),
                    details: 'New interview scheduled'
                },
                {
                    type: 'ai_content_generated',
                    timestamp: new Date(Date.now() - 180000),
                    details: 'AI content generated for follow-up'
                }
            ],
            hourlyStats: {
                emailsSent: Math.floor(Math.random() * 15) + 5,
                responsesReceived: Math.floor(Math.random() * 8) + 2,
                interviewsScheduled: Math.floor(Math.random() * 5) + 1,
                aiRequestsProcessed: Math.floor(Math.random() * 12) + 3
            }
        };

        res.status(200).json({
            success: true,
            data: realTimeData,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error fetching real-time analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch real-time analytics'
        });
    }
});

// @route   POST /api/analytics/track-event
// @desc    Track custom analytics event
// @access  Private
router.post('/track-event', (req, res) => {
    try {
        const { eventType, eventData, timestamp = new Date() } = req.body;
        
        // In a real application, you would store this in a database or analytics service
        console.log('Analytics event tracked:', {
            userEmail: req.user.email,
            eventType,
            eventData,
            timestamp
        });

        res.status(200).json({
            success: true,
            message: 'Event tracked successfully',
            data: {
                eventId: Date.now().toString(),
                processed: true
            }
        });

    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track event'
        });
    }
});

module.exports = router;