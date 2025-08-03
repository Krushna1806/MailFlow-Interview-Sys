const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
    index: true
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  fullName: {
    type: String,
    trim: true
  },
  
  // Contact Details
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return validator.isURL(v);
      },
      message: 'Please provide a valid website URL'
    }
  },
  
  // Geographic Information
  location: {
    country: String,
    state: String,
    city: String,
    zipCode: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Subscription Status
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'cleaned', 'pending', 'bounced'],
    default: 'subscribed'
  },
  subscriptionDate: {
    type: Date,
    default: Date.now
  },
  unsubscribedDate: Date,
  unsubscribeReason: String,
  
  // Email Preferences
  preferences: {
    emailFormat: {
      type: String,
      enum: ['html', 'text', 'both'],
      default: 'html'
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    },
    categories: [{
      name: String,
      subscribed: {
        type: Boolean,
        default: true
      }
    }],
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Engagement Tracking
  engagement: {
    totalEmailsReceived: {
      type: Number,
      default: 0
    },
    totalOpens: {
      type: Number,
      default: 0
    },
    uniqueOpens: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    lastOpenDate: Date,
    lastClickDate: Date,
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
      type: Number,
      default: 0
    },
    averageTimeToOpen: Number, // in minutes
    preferredSendTime: {
      hour: Number,
      dayOfWeek: Number
    }
  },
  
  // Source and Attribution
  source: {
    type: {
      type: String,
      enum: ['signup_form', 'import', 'api', 'manual', 'landing_page', 'social_media', 'referral', 'event'],
      default: 'manual'
    },
    details: String,
    campaign: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String
  },
  
  // Custom Fields (flexible schema)
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Tags for Segmentation
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // List Memberships
  lists: [{
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContactList'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }],
  
  // Bounce Information
  bounceInfo: {
    bounceCount: {
      type: Number,
      default: 0
    },
    lastBounceDate: Date,
    bounceType: {
      type: String,
      enum: ['hard', 'soft', 'block', 'suppress']
    },
    bounceReason: String,
    cleanedDate: Date
  },
  
  // Lead Scoring
  leadScore: {
    score: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'C'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    factors: [{
      factor: String,
      points: Number,
      date: Date
    }]
  },
  
  // Activity Timeline
  activities: [{
    type: {
      type: String,
      enum: ['email_sent', 'email_opened', 'email_clicked', 'unsubscribed', 'subscribed', 'bounced', 'complaint', 'profile_updated', 'purchase', 'page_visit']
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    emailId: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // E-commerce Data
  ecommerce: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastPurchaseDate: Date,
    lastPurchaseAmount: Number,
    favoriteCategories: [String],
    customerLifetimeValue: {
      type: Number,
      default: 0
    }
  },
  
  // GDPR and Compliance
  consent: {
    marketing: {
      granted: {
        type: Boolean,
        default: false
      },
      date: Date,
      method: String, // e.g., 'form_signup', 'double_opt_in', 'imported'
      ipAddress: String
    },
    dataProcessing: {
      granted: {
        type: Boolean,
        default: false
      },
      date: Date
    },
    cookies: {
      granted: {
        type: Boolean,
        default: false
      },
      date: Date
    }
  },
  
  // Notes and Comments
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    private: {
      type: Boolean,
      default: false
    }
  }],
  
  // Archive and Deletion
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedDate: Date,
  suppressionReason: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name if not provided
contactSchema.virtual('computedFullName').get(function() {
  if (this.fullName) return this.fullName;
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  if (this.firstName) return this.firstName;
  if (this.lastName) return this.lastName;
  return this.email;
});

// Virtual for engagement level
contactSchema.virtual('engagementLevel').get(function() {
  const score = this.engagement.engagementScore;
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 20) return 'low';
  return 'inactive';
});

// Virtual for days since last engagement
contactSchema.virtual('daysSinceLastEngagement').get(function() {
  const lastActivity = Math.max(
    this.engagement.lastOpenDate?.getTime() || 0,
    this.engagement.lastClickDate?.getTime() || 0
  );
  
  if (!lastActivity) return null;
  
  const now = new Date().getTime();
  return Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ userId: 1, status: 1 });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, 'engagement.engagementScore': -1 });
contactSchema.index({ userId: 1, 'leadScore.score': -1 });
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ 'lists.listId': 1 });
contactSchema.index({ 'customFields': 1 });

// Text search index
contactSchema.index({
  email: 'text',
  firstName: 'text',
  lastName: 'text',
  fullName: 'text',
  company: 'text'
});

// Pre-save middleware to update fullName and engagement calculations
contactSchema.pre('save', function(next) {
  // Update fullName if firstName or lastName changed
  if (this.isModified('firstName') || this.isModified('lastName')) {
    if (this.firstName && this.lastName) {
      this.fullName = `${this.firstName} ${this.lastName}`;
    } else if (this.firstName) {
      this.fullName = this.firstName;
    } else if (this.lastName) {
      this.fullName = this.lastName;
    }
  }
  
  // Calculate engagement rates
  if (this.engagement.totalEmailsReceived > 0) {
    this.engagement.openRate = (this.engagement.uniqueOpens / this.engagement.totalEmailsReceived) * 100;
    this.engagement.clickRate = (this.engagement.uniqueClicks / this.engagement.totalEmailsReceived) * 100;
  }
  
  next();
});

// Instance method to calculate engagement score
contactSchema.methods.calculateEngagementScore = function() {
  const weights = {
    openRate: 0.3,
    clickRate: 0.4,
    recency: 0.2,
    frequency: 0.1
  };
  
  let score = 0;
  
  // Open rate component
  score += (this.engagement.openRate || 0) * weights.openRate;
  
  // Click rate component
  score += (this.engagement.clickRate || 0) * weights.clickRate;
  
  // Recency component (how recently they engaged)
  const daysSinceLastEngagement = this.daysSinceLastEngagement;
  let recencyScore = 0;
  if (daysSinceLastEngagement !== null) {
    if (daysSinceLastEngagement <= 7) recencyScore = 100;
    else if (daysSinceLastEngagement <= 30) recencyScore = 75;
    else if (daysSinceLastEngagement <= 90) recencyScore = 50;
    else if (daysSinceLastEngagement <= 180) recencyScore = 25;
    else recencyScore = 0;
  }
  score += recencyScore * weights.recency;
  
  // Frequency component (how often they engage)
  const totalEngagements = this.engagement.uniqueOpens + this.engagement.uniqueClicks;
  const frequencyScore = Math.min(100, totalEngagements * 10); // Max 100 points
  score += frequencyScore * weights.frequency;
  
  this.engagement.engagementScore = Math.round(Math.max(0, Math.min(100, score)));
  return this.engagement.engagementScore;
};

// Instance method to add activity
contactSchema.methods.addActivity = function(type, description, metadata = {}) {
  this.activities.unshift({
    type,
    description,
    metadata,
    timestamp: new Date(),
    ...metadata
  });
  
  // Keep only last 100 activities
  if (this.activities.length > 100) {
    this.activities = this.activities.slice(0, 100);
  }
  
  return this.save();
};

// Instance method to update engagement metrics
contactSchema.methods.recordEmailEvent = function(eventType, campaignId, emailId) {
  const now = new Date();
  
  switch (eventType) {
    case 'sent':
      this.engagement.totalEmailsReceived += 1;
      break;
    case 'opened':
      this.engagement.totalOpens += 1;
      if (!this.engagement.lastOpenDate || 
          this.engagement.lastOpenDate < now) {
        this.engagement.uniqueOpens += 1;
        this.engagement.lastOpenDate = now;
      }
      break;
    case 'clicked':
      this.engagement.totalClicks += 1;
      if (!this.engagement.lastClickDate || 
          this.engagement.lastClickDate < now) {
        this.engagement.uniqueClicks += 1;
        this.engagement.lastClickDate = now;
      }
      break;
    case 'bounced':
      this.bounceInfo.bounceCount += 1;
      this.bounceInfo.lastBounceDate = now;
      if (this.bounceInfo.bounceCount >= 3) {
        this.status = 'bounced';
      }
      break;
    case 'unsubscribed':
      this.status = 'unsubscribed';
      this.unsubscribedDate = now;
      break;
  }
  
  // Add to activity timeline
  this.addActivity(`email_${eventType}`, `Email ${eventType}`, {
    campaignId,
    emailId,
    timestamp: now
  });
  
  // Recalculate engagement score
  this.calculateEngagementScore();
  
  return this.save();
};

// Static method to get contacts by segment criteria
contactSchema.statics.getBySegment = async function(userId, criteria) {
  const query = { userId, status: 'subscribed' };
  
  if (criteria.tags && criteria.tags.length > 0) {
    query.tags = { $in: criteria.tags };
  }
  
  if (criteria.engagementLevel) {
    const scoreRanges = {
      high: { $gte: 80 },
      medium: { $gte: 50, $lt: 80 },
      low: { $gte: 20, $lt: 50 },
      inactive: { $lt: 20 }
    };
    query['engagement.engagementScore'] = scoreRanges[criteria.engagementLevel];
  }
  
  if (criteria.location) {
    if (criteria.location.country) {
      query['location.country'] = criteria.location.country;
    }
    if (criteria.location.state) {
      query['location.state'] = criteria.location.state;
    }
  }
  
  if (criteria.customFields) {
    Object.keys(criteria.customFields).forEach(key => {
      query[`customFields.${key}`] = criteria.customFields[key];
    });
  }
  
  return await this.find(query);
};

// Static method to get engagement statistics
contactSchema.statics.getEngagementStats = async function(userId, dateRange) {
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
        totalContacts: { $sum: 1 },
        subscribedContacts: {
          $sum: { $cond: [{ $eq: ['$status', 'subscribed'] }, 1, 0] }
        },
        avgEngagementScore: { $avg: '$engagement.engagementScore' },
        highEngagement: {
          $sum: { $cond: [{ $gte: ['$engagement.engagementScore', 80] }, 1, 0] }
        },
        mediumEngagement: {
          $sum: { $cond: [{ $and: [
            { $gte: ['$engagement.engagementScore', 50] },
            { $lt: ['$engagement.engagementScore', 80] }
          ]}, 1, 0] }
        },
        lowEngagement: {
          $sum: { $cond: [{ $and: [
            { $gte: ['$engagement.engagementScore', 20] },
            { $lt: ['$engagement.engagementScore', 50] }
          ]}, 1, 0] }
        },
        inactiveContacts: {
          $sum: { $cond: [{ $lt: ['$engagement.engagementScore', 20] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Contact', contactSchema);