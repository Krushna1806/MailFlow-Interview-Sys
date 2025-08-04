# MailFlow - GenAI Interview Mailer System

A comprehensive full-stack application for managing interview processes with AI-powered email generation and automation.

## 🌟 Features

### Frontend
- **Responsive Design**: Modern, mobile-first interface built with HTML5, CSS3, and vanilla JavaScript
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **Email Composer**: Intuitive email creation with template selection and AI assistance
- **Interview Management**: Schedule, track, and manage interviews with candidates
- **Template Library**: Customizable email templates for different scenarios
- **Real-time Updates**: Live notifications and status updates using WebSocket

### Backend (Node.js)
- **RESTful API**: Comprehensive API for all MailFlow operations
- **Authentication**: JWT-based user authentication and authorization
- **Email Service**: SMTP integration for sending emails with Nodemailer
- **Database Integration**: MongoDB support with Mongoose ODM
- **Real-time Communication**: Socket.IO for live updates
- **Security**: Rate limiting, CORS, input validation, and security headers

### AI Service (Python)
- **Email Generation**: AI-powered email content creation using OpenAI GPT
- **Content Analysis**: Sentiment analysis, readability scoring, and entity extraction
- **Template Processing**: Smart template filling with context-aware content
- **Multiple AI Providers**: Support for OpenAI and Anthropic Claude
- **Natural Language Processing**: Advanced text processing with spaCy and NLTK

## 🏗️ Architecture

```
mailflow-system/
├── frontend/               # Client-side application
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Responsive CSS styles
│   └── script.js          # JavaScript application logic
├── backend/
│   ├── nodejs/            # Express.js API server
│   │   ├── server.js      # Main server file
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── package.json   # Node.js dependencies
│   └── python/            # AI service
│       ├── app.py         # Flask application
│       └── requirements.txt # Python dependencies
└── database/              # Database configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- MongoDB
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mailflow-system
   ```

2. **Set up the Node.js backend**
   ```bash
   cd backend/nodejs
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Set up the Python AI service**
   ```bash
   cd backend/python
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your OpenAI API key
   python app.py
   ```

4. **Set up the frontend**
   ```bash
   cd frontend
   # Serve using a local web server
   python -m http.server 8080
   # or use any static file server
   ```

### Environment Configuration

#### Node.js Backend (.env)
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mailflow
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
FRONTEND_URL=http://localhost:8080
```

#### Python AI Service (.env)
```bash
FLASK_ENV=development
PORT=5000
OPENAI_API_KEY=your-openai-api-key
MONGODB_URI=mongodb://localhost:27017/mailflow_ai
```

## 📖 API Documentation

### Node.js API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

#### Email Management
- `POST /api/emails/send` - Send email
- `GET /api/emails` - Get user emails
- `GET /api/emails/:id` - Get specific email
- `POST /api/emails/draft` - Save draft
- `POST /api/emails/bulk-send` - Send bulk emails

#### Interview Management
- `POST /api/interviews` - Create interview
- `GET /api/interviews` - Get interviews
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `POST /api/interviews/schedule` - Schedule interview with invitation

#### Templates
- `GET /api/templates` - Get templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/reports` - Detailed reports
- `GET /api/analytics/performance` - Performance metrics

### Python AI API Endpoints

#### AI Operations
- `POST /ai/generate-email` - Generate AI email
- `POST /ai/analyze-email` - Analyze email content
- `POST /ai/improve-email` - Improve email with AI
- `GET /ai/templates` - Get AI template info

