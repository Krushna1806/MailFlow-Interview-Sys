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

## 🎨 Frontend Features

### Dashboard
- Real-time statistics display
- Recent activity feed
- Performance metrics visualization
- Quick action buttons

### Email Composer
- Template selection dropdown
- AI content generation
- Rich text editing
- Draft saving capability
- Send and schedule options

### Interview Management
- Interview scheduling modal
- Candidate search and filtering
- Status tracking
- Reminder system
- Interview type management (video/phone/in-person)

### Templates
- Pre-built template library
- Custom template creation
- Variable substitution
- Template preview functionality

### Analytics
- Email performance charts
- Interview success metrics
- AI usage statistics
- Exportable reports

## 🤖 AI Capabilities

### Email Generation
- Context-aware content creation
- Multiple template types:
  - Interview invitations
  - Follow-up emails
  - Job offers
  - Rejection letters
- Tone adjustment (formal, friendly, casual)
- Length optimization (short, medium, long)

### Content Analysis
- Sentiment analysis using TextBlob
- Readability scoring
- Named entity recognition with spaCy
- Professional tone assessment

### Template Processing
- Smart variable substitution
- Context-based content enhancement
- Tone-specific phrase variations
- AI-powered content improvement

## 🔧 Configuration

### Email Service Setup
The system supports various SMTP providers:

**Gmail**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

**Outlook/Hotmail**
```bash
SMTP_HOST=smtp.live.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Database Setup
The system uses MongoDB for data persistence:

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/mailflow

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailflow
```

### AI Service Configuration
Configure your preferred AI provider:

```bash
# OpenAI (recommended)
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## 🌐 Deployment

### Production Deployment

1. **Frontend**: Deploy to any static hosting service (Netlify, Vercel, GitHub Pages)
2. **Node.js Backend**: Deploy to cloud platforms (Heroku, Railway, DigitalOcean)
3. **Python AI Service**: Deploy using Docker or cloud functions
4. **Database**: Use managed MongoDB (Atlas) or deploy your own instance

### Docker Deployment (Coming Soon)
```bash
docker-compose up -d
```

## 🔒 Security Features

- JWT authentication with secure token management
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Helmet.js security headers
- MongoDB injection protection
- XSS protection

## 📱 Mobile Responsiveness

The frontend is fully responsive and works seamlessly across:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

Key responsive features:
- Adaptive navigation menu
- Flexible grid layouts
- Touch-friendly buttons
- Optimized modals and forms
- Readable typography scaling

## 🧪 Testing

### Running Tests (Node.js)
```bash
cd backend/nodejs
npm test
```

### Running Tests (Python)
```bash
cd backend/python
python -m pytest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [FAQ](#faq) section below
2. Search existing [GitHub Issues](issues)
3. Create a new issue with detailed information
4. Contact the development team

## ❓ FAQ

**Q: How do I get an OpenAI API key?**
A: Visit [OpenAI's website](https://openai.com/api/), create an account, and generate an API key in your dashboard.

**Q: Can I use this without AI features?**
A: Yes! The system works perfectly with template-based email generation even without AI integration.

**Q: How do I configure email sending?**
A: Set up your SMTP credentials in the `.env` file. For Gmail, you'll need to use an App Password instead of your regular password.

**Q: Is this suitable for production use?**
A: Yes, but make sure to properly configure security settings, use environment variables for secrets, and set up proper monitoring.

**Q: Can I customize the email templates?**
A: Absolutely! You can create custom templates through the UI or by modifying the template files directly.

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete frontend interface
- Node.js API backend
- Python AI service
- Authentication system
- Email management
- Interview scheduling
- Template system
- Analytics dashboard

## 🗺️ Roadmap

- [ ] Advanced AI features (multi-language support)
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Webhook support
- [ ] Advanced analytics and reporting
- [ ] Mobile app development
- [ ] Enterprise features (team management, permissions)
- [ ] Integration with ATS systems
- [ ] Video interview scheduling
- [ ] Candidate portal

---

**Built with ❤️ for efficient interview management and professional communication.**