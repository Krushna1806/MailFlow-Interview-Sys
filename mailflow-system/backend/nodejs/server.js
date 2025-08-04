const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const interviewRoutes = require('./routes/interviews');
const templateRoutes = require('./routes/templates');
const analyticsRoutes = require('./routes/analytics');

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Socket.IO middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', authMiddleware, emailRoutes);
app.use('/api/interviews', authMiddleware, interviewRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MailFlow GenAI Interview Mailer System API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        name: 'MailFlow API',
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                logout: 'POST /api/auth/logout',
                profile: 'GET /api/auth/profile'
            },
            emails: {
                send: 'POST /api/emails/send',
                list: 'GET /api/emails',
                get: 'GET /api/emails/:id',
                delete: 'DELETE /api/emails/:id',
                draft: 'POST /api/emails/draft'
            },
            interviews: {
                create: 'POST /api/interviews',
                list: 'GET /api/interviews',
                get: 'GET /api/interviews/:id',
                update: 'PUT /api/interviews/:id',
                delete: 'DELETE /api/interviews/:id',
                schedule: 'POST /api/interviews/schedule'
            },
            templates: {
                create: 'POST /api/templates',
                list: 'GET /api/templates',
                get: 'GET /api/templates/:id',
                update: 'PUT /api/templates/:id',
                delete: 'DELETE /api/templates/:id'
            },
            analytics: {
                dashboard: 'GET /api/analytics/dashboard',
                reports: 'GET /api/analytics/reports',
                performance: 'GET /api/analytics/performance'
            }
        }
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: '/api/docs'
    });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`MailFlow API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
});

module.exports = app;