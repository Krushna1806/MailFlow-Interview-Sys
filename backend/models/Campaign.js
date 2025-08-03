const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  // Basic Campaign Information
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Campaign name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['regular', 'automation', 'ab_test', 'drip', 'broadcast'],
    default: 'regular'
  },
  
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Email Content
  subject: {
    type: String,
    required: [true, 'Subject line is required'],
    trim: true,
    maxlength: [200, 'Subject line cannot exceed 200 characters']
  },
  preheader: {
    type: String,
    trim: true,
    maxlength: [150, 'Preheader cannot exceed 150 characters']
  },
  content: {
    html: {
      type: String,
      required: [true, 'HTML content is required']
    },
    text: {
      type: String,
      required: [true, 'Text content is required']
    },
    template: {
      id: String,
      name: String,
      customizations: mongoose.Schema.Types.Mixed
    }
  },
  
  // AI Generated Content
  aiGenerated: {
    isAiGenerated: {
      type: Boolean,
      default: false
    },
    prompt: String,
    originalSubject: String,
    aiSuggestions: [{
      type: {
        type: String,
        enum: ['subject', 'content', 'personalization', 'send_time']
      },
      suggestion: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      applied: {
        type: Boolean,
        default: false
      }
    }],
    personalizationFields: [{
      field: String,
      aiPrompt: String,
      fallback: String
    }]
  },
  
  // A/B Testing
  abTest: {
    enabled: {
      type: Boolean,
      default: false
    },
    testType: {
      type: String,
      enum: ['subject', 'content', 'send_time', 'from_name'],
      default: 'subject'
    },
    variants: [{
      name: String,
      subject: String,
      content: {
        html: String,
        text: String
      },
      fromName: String,
      sendTime: Date,
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      recipientCount: {
        type: Number,
        default: 0
      }
    }],
    testDuration: {
      type: Number,
      default: 24 // hours
    },
    winnerCriteria: {
      type: String,
      enum: ['open_rate', 'click_rate', 'conversion_rate', 'revenue'],
      default: 'open_rate'
    },
    winnerSelected: {
      type: Boolean,
      default: false
    },
    winnerVariant: String,
    testStarted: Date,
    testEnded: Date
  },
  
  // Targeting and Recipients
  recipients: {
    type: {
      type: String,
      enum: ['all_contacts', 'segment', 'list', 'individual'],
      default: 'all_contacts'
    },
    contactLists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContactList'
    }],
    segments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Segment'
    }],
    individualContacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }],
    totalCount: {
      type: Number,
      default: 0
    },
    criteria: {
      tags: [String],
      customFields: mongoose.Schema.Types.Mixed,
      behavior: {
        opened: Boolean,
        clicked: Boolean,
        purchased: Boolean,
        signupDate: {
          from: Date,
          to: Date
        }
      }
    }
  },
  
  // Scheduling
  scheduling: {
    type: {
      type: String,
      enum: ['immediate', 'scheduled', 'timezone_optimized', 'ai_optimized'],
      default: 'immediate'
    },
    scheduledAt: Date,
    timezone: {
      type: String,
      default: 'UTC'
    },
    aiOptimization: {
      enabled: {
        type: Boolean,
        default: false
      },
      factors: [{
        type: String,
        enum: ['recipient_timezone', 'historical_engagement', 'industry_best_practice', 'day_of_week', 'time_of_day']
      }],
      confidence: Number
    },
    recurringSchedule: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom']
      },
      interval: Number,
      daysOfWeek: [Number], // 0-6 (Sunday to Saturday)
      endDate: Date,
      maxOccurrences: Number
    }
  },
  
  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'],
    default: 'draft'
  },
  
  // Sending Information
  sending: {
    startedAt: Date,
    completedAt: Date,
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    deliveredCount: {
      type: Number,
      default: 0
    },
    fromEmail: {
      type: String,
      required: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid from email address'
      ]
    },
    fromName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'From name cannot exceed 50 characters']
    },
    replyTo: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid reply-to email address'
      ]
    },
    errors: [{
      recipientEmail: String,
      error: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Analytics and Performance
  analytics: {
    opens: {
      unique: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    clicks: {
      unique: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      },
      linkPerformance: [{
        url: String,
        clicks: Number,
        uniqueClicks: Number
      }]
    },
    unsubscribes: {
      count: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    bounces: {
      hard: {
        type: Number,
        default: 0
      },
      soft: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    complaints: {
      count: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    conversions: {
      count: {
        type: Number,
        default: 0
      },
      revenue: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    deliverabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Campaign Settings
  settings: {
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    },
    enableUnsubscribe: {
      type: Boolean,
      default: true
    },
    googleAnalytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      campaign: String,
      source: String,
      medium: String
    },
    socialSharing: {
      enabled: {
        type: Boolean,
        default: false
      },
      platforms: [String]
    }
  },
  
  // Tags and Organization
  tags: [String],
  folder: String,
  
  // Automation Workflow (if part of automation)
  automation: {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow'
    },
    stepId: String,
    triggerType: String,
    conditions: mongoose.Schema.Types.Mixed
  },
  
  // Archive and History
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  
  // Compliance
  gdprCompliant: {
    type: Boolean,
    default: true
  },
  canSpamCompliant: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for delivery rate
campaignSchema.virtual('deliveryRate').get(function() {
  if (this.sending.sentCount === 0) return 0;
  return (this.sending.deliveredCount / this.sending.sentCount) * 100;
});

// Virtual for overall performance score
campaignSchema.virtual('performanceScore').get(function() {
  const openWeight = 0.3;
  const clickWeight = 0.4;
  const deliveryWeight = 0.2;
  const engagementWeight = 0.1;
  
  return (
    (this.analytics.opens.rate * openWeight) +
    (this.analytics.clicks.rate * clickWeight) +
    (this.deliveryRate * deliveryWeight) +
    (this.analytics.engagementScore * engagementWeight)
  );
});

// Virtual for campaign duration
campaignSchema.virtual('duration').get(function() {
  if (!this.sending.startedAt || !this.sending.completedAt) return null;
  return this.sending.completedAt - this.sending.startedAt;
});

// Indexes for better performance
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ 'scheduling.scheduledAt': 1, status: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ 'abTest.enabled': 1, 'abTest.testStarted': 1 });

// Pre-save middleware to calculate recipient count
campaignSchema.pre('save', async function(next) {
  if (this.isModified('recipients') && this.recipients.type !== 'individual') {
    // Calculate total recipient count based on lists and segments
    // This would be implemented based on your contact management logic
    // For now, we'll leave it as is
  }
  next();
});

// Instance method to calculate engagement score
campaignSchema.methods.calculateEngagementScore = function() {
  const openRate = this.analytics.opens.rate || 0;
  const clickRate = this.analytics.clicks.rate || 0;
  const unsubscribeRate = this.analytics.unsubscribes.rate || 0;
  const bounceRate = this.analytics.bounces.rate || 0;
  
  // Weighted calculation (you can adjust weights as needed)
  const score = (
    (openRate * 0.3) +
    (clickRate * 0.4) +
    ((100 - unsubscribeRate) * 0.2) +
    ((100 - bounceRate) * 0.1)
  );
  
  this.analytics.engagementScore = Math.round(Math.max(0, Math.min(100, score)));
  return this.analytics.engagementScore;
};

// Instance method to determine A/B test winner
campaignSchema.methods.determineABTestWinner = function() {
  if (!this.abTest.enabled || this.abTest.winnerSelected) return null;
  
  const variants = this.abTest.variants;
  if (variants.length < 2) return null;
  
  const criteria = this.abTest.winnerCriteria;
  let winner = variants[0];
  let bestScore = 0;
  
  variants.forEach(variant => {
    let score = 0;
    switch (criteria) {
      case 'open_rate':
        score = variant.analytics?.opens?.rate || 0;
        break;
      case 'click_rate':
        score = variant.analytics?.clicks?.rate || 0;
        break;
      case 'conversion_rate':
        score = variant.analytics?.conversions?.rate || 0;
        break;
      case 'revenue':
        score = variant.analytics?.conversions?.revenue || 0;
        break;
    }
    
    if (score > bestScore) {
      bestScore = score;
      winner = variant;
    }
  });
  
  this.abTest.winnerVariant = winner.name;
  this.abTest.winnerSelected = true;
  this.abTest.testEnded = new Date();
  
  return winner;
};

// Static method to get campaign performance summary
campaignSchema.statics.getPerformanceSummary = async function(userId, dateRange) {
  const match = { userId };
  
  if (dateRange) {
    match.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        totalSent: { $sum: '$sending.sentCount' },
        totalDelivered: { $sum: '$sending.deliveredCount' },
        totalOpens: { $sum: '$analytics.opens.unique' },
        totalClicks: { $sum: '$analytics.clicks.unique' },
        totalRevenue: { $sum: '$analytics.conversions.revenue' },
        avgOpenRate: { $avg: '$analytics.opens.rate' },
        avgClickRate: { $avg: '$analytics.clicks.rate' },
        avgEngagementScore: { $avg: '$analytics.engagementScore' }
      }
    }
  ]);
};

module.exports = mongoose.model('Campaign', campaignSchema);