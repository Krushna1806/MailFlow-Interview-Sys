// MailFlow JavaScript Application
class MailFlowApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.pythonApiUrl = 'http://localhost:5000/api';
        this.currentTab = 'dashboard';
        this.data = {
            emails: [],
            interviews: [],
            templates: [],
            stats: {
                emailsSent: 0,
                interviewsScheduled: 0,
                responseRate: 0,
                aiGenerated: 0
            }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.updateDashboard();
        this.renderTemplates();
        this.renderInterviews();
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Compose form
        const composeForm = document.getElementById('compose-form');
        if (composeForm) {
            composeForm.addEventListener('submit', (e) => this.handleComposeSubmit(e));
        }

        // AI Generate button
        const aiGenerateBtn = document.getElementById('ai-generate');
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', () => this.generateAIContent());
        }

        // Template selection
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => this.loadTemplate(e.target.value));
        }

        // Interview scheduling
        const scheduleBtn = document.getElementById('schedule-interview');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => this.openInterviewModal());
        }

        // Interview form
        const interviewForm = document.getElementById('interview-form');
        if (interviewForm) {
            interviewForm.addEventListener('submit', (e) => this.handleInterviewSubmit(e));
        }

        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Save draft
        const saveDraftBtn = document.getElementById('save-draft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Search and filters
        const searchInput = document.getElementById('search-interviews');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterInterviews(e.target.value));
        }

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.filterInterviewsByStatus(e.target.value));
        }

        // Create template
        const createTemplateBtn = document.getElementById('create-template');
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => this.createTemplate());
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to selected nav link
        const selectedLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedLink) {
            selectedLink.classList.add('active');
        }

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'interviews':
                this.renderInterviews();
                break;
            case 'templates':
                this.renderTemplates();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    async loadInitialData() {
        try {
            this.showLoading();
            
            // Simulate API calls
            await this.delay(1000);
            
            // Load sample data
            this.data.stats = {
                emailsSent: 147,
                interviewsScheduled: 23,
                responseRate: 68,
                aiGenerated: 89
            };

            this.data.interviews = [
                {
                    id: 1,
                    candidateName: 'John Doe',
                    candidateEmail: 'john.doe@email.com',
                    date: '2024-01-15',
                    time: '10:00',
                    type: 'video',
                    status: 'scheduled',
                    position: 'Frontend Developer'
                },
                {
                    id: 2,
                    candidateName: 'Jane Smith',
                    candidateEmail: 'jane.smith@email.com',
                    date: '2024-01-16',
                    time: '14:00',
                    type: 'phone',
                    status: 'completed',
                    position: 'Backend Developer'
                }
            ];

            this.data.templates = [
                {
                    id: 1,
                    name: 'Interview Invitation',
                    subject: 'Interview Invitation - {{position}} Role',
                    body: 'Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{position}} position...',
                    type: 'interview-invitation'
                },
                {
                    id: 2,
                    name: 'Follow-up Email',
                    subject: 'Follow-up on your application',
                    body: 'Dear {{candidateName}},\n\nThank you for your interest in the {{position}} role...',
                    type: 'follow-up'
                }
            ];

            this.hideLoading();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error loading data', 'error');
            this.hideLoading();
        }
    }

    updateDashboard() {
        // Update statistics
        document.getElementById('emails-sent').textContent = this.data.stats.emailsSent;
        document.getElementById('interviews-scheduled').textContent = this.data.stats.interviewsScheduled;
        document.getElementById('response-rate').textContent = `${this.data.stats.responseRate}%`;
        document.getElementById('ai-generated').textContent = this.data.stats.aiGenerated;

        // Update recent activity
        this.renderRecentActivity();
    }

    renderRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const activities = [
            { icon: 'fa-envelope', text: 'Email sent to John Doe', time: '2 minutes ago' },
            { icon: 'fa-calendar-check', text: 'Interview scheduled with Jane Smith', time: '1 hour ago' },
            { icon: 'fa-robot', text: 'AI generated follow-up email', time: '3 hours ago' },
            { icon: 'fa-user-plus', text: 'New candidate added', time: '5 hours ago' }
        ];

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <small>${activity.time}</small>
                </div>
            </div>
        `).join('');
    }

    async handleComposeSubmit(e) {
        e.preventDefault();
        
        try {
            this.showLoading();
            
            const formData = new FormData(e.target);
            const emailData = {
                recipient: formData.get('recipient'),
                subject: formData.get('subject'),
                body: formData.get('body'),
                template: formData.get('template')
            };

            // Simulate API call to send email
            await this.sendEmail(emailData);
            
            this.showToast('Email sent successfully!', 'success');
            e.target.reset();
            this.data.stats.emailsSent++;
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error sending email:', error);
            this.showToast('Error sending email', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateAIContent() {
        try {
            this.showLoading();
            
            const template = document.getElementById('template-select').value;
            const formalTone = document.getElementById('formal-tone').checked;
            const includeCompany = document.getElementById('include-company').checked;
            
            const prompt = {
                template,
                formalTone,
                includeCompany,
                context: 'Generate professional email content for interview process'
            };

            // Simulate AI generation
            const aiContent = await this.callAIService(prompt);
            
            document.getElementById('email-body').value = aiContent.body;
            if (aiContent.subject) {
                document.getElementById('subject').value = aiContent.subject;
            }
            
            this.showToast('AI content generated!', 'success');
            this.data.stats.aiGenerated++;
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error generating AI content:', error);
            this.showToast('Error generating AI content', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async callAIService(prompt) {
        // Simulate AI service call
        await this.delay(2000);
        
        const templates = {
            'interview-invitation': {
                subject: 'Interview Invitation - Software Developer Position',
                body: `Dear Candidate,

We are excited to invite you for an interview for the Software Developer position at our company. 

Based on your impressive background and qualifications, we believe you would be an excellent fit for our team.

Interview Details:
- Date: [To be scheduled]
- Duration: 60 minutes
- Format: Video conference

Please let us know your availability for the coming week, and we will coordinate the specific time.

We look forward to discussing your experience and how you can contribute to our innovative projects.

Best regards,
HR Team`
            },
            'follow-up': {
                subject: 'Following up on your application',
                body: `Dear Candidate,

Thank you for your interest in joining our team. We wanted to follow up on your recent application.

We have reviewed your qualifications and are impressed with your background. We are currently in the process of reviewing all applications and will be in touch soon with next steps.

In the meantime, if you have any questions about the role or our company, please don't hesitate to reach out.

Thank you for your patience and continued interest.

Best regards,
HR Team`
            }
        };
        
        return templates[prompt.template] || templates['interview-invitation'];
    }

    loadTemplate(templateType) {
        if (!templateType) return;
        
        const template = this.data.templates.find(t => t.type === templateType);
        if (template) {
            document.getElementById('subject').value = template.subject;
            document.getElementById('email-body').value = template.body;
        }
    }

    openInterviewModal() {
        const modal = document.getElementById('interview-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal() {
        const modal = document.getElementById('interview-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async handleInterviewSubmit(e) {
        e.preventDefault();
        
        try {
            this.showLoading();
            
            const formData = new FormData(e.target);
            const interviewData = {
                candidateName: formData.get('candidate-name') || document.getElementById('candidate-name').value,
                candidateEmail: formData.get('candidate-email') || document.getElementById('candidate-email').value,
                date: formData.get('interview-date') || document.getElementById('interview-date').value,
                time: formData.get('interview-time') || document.getElementById('interview-time').value,
                type: formData.get('interview-type') || document.getElementById('interview-type').value,
                status: 'scheduled',
                id: Date.now()
            };

            // Add to interviews list
            this.data.interviews.push(interviewData);
            
            // Send invitation email
            await this.sendInterviewInvitation(interviewData);
            
            this.showToast('Interview scheduled and invitation sent!', 'success');
            this.closeModal();
            e.target.reset();
            
            this.data.stats.interviewsScheduled++;
            this.updateDashboard();
            this.renderInterviews();
            
        } catch (error) {
            console.error('Error scheduling interview:', error);
            this.showToast('Error scheduling interview', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderInterviews() {
        const interviewList = document.getElementById('interview-list');
        if (!interviewList) return;

        if (this.data.interviews.length === 0) {
            interviewList.innerHTML = '<p>No interviews scheduled yet.</p>';
            return;
        }

        interviewList.innerHTML = this.data.interviews.map(interview => `
            <div class="interview-item">
                <div class="interview-header">
                    <h4>${interview.candidateName}</h4>
                    <span class="status ${interview.status}">${interview.status}</span>
                </div>
                <div class="interview-details">
                    <p><i class="fas fa-envelope"></i> ${interview.candidateEmail}</p>
                    <p><i class="fas fa-calendar"></i> ${interview.date} at ${interview.time}</p>
                    <p><i class="fas fa-${this.getTypeIcon(interview.type)}"></i> ${interview.type}</p>
                </div>
                <div class="interview-actions">
                    <button class="btn btn-secondary" onclick="app.editInterview(${interview.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary" onclick="app.sendReminder(${interview.id})">
                        <i class="fas fa-bell"></i> Send Reminder
                    </button>
                </div>
            </div>
        `).join('');
    }

    getTypeIcon(type) {
        const icons = {
            'video': 'video',
            'phone': 'phone',
            'in-person': 'users'
        };
        return icons[type] || 'calendar';
    }

    renderTemplates() {
        const templatesGrid = document.getElementById('templates-grid');
        if (!templatesGrid) return;

        templatesGrid.innerHTML = this.data.templates.map(template => `
            <div class="template-card" onclick="app.selectTemplate('${template.type}')">
                <h4>${template.name}</h4>
                <p>${template.subject}</p>
                <div class="template-preview">
                    ${template.body.substring(0, 100)}...
                </div>
                <div class="template-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); app.editTemplate(${template.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); app.useTemplate(${template.id})">
                        <i class="fas fa-arrow-right"></i> Use
                    </button>
                </div>
            </div>
        `).join('');
    }

    selectTemplate(templateType) {
        this.switchTab('compose');
        document.getElementById('template-select').value = templateType;
        this.loadTemplate(templateType);
    }

    useTemplate(templateId) {
        const template = this.data.templates.find(t => t.id === templateId);
        if (template) {
            this.selectTemplate(template.type);
        }
    }

    async saveDraft() {
        try {
            const draftData = {
                recipient: document.getElementById('recipient').value,
                subject: document.getElementById('subject').value,
                body: document.getElementById('email-body').value,
                template: document.getElementById('template-select').value,
                savedAt: new Date().toISOString()
            };

            // Save to localStorage as a simple draft system
            localStorage.setItem('mailflow_draft', JSON.stringify(draftData));
            this.showToast('Draft saved!', 'success');
            
        } catch (error) {
            console.error('Error saving draft:', error);
            this.showToast('Error saving draft', 'error');
        }
    }

    filterInterviews(searchTerm) {
        const interviews = document.querySelectorAll('.interview-item');
        interviews.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }

    filterInterviewsByStatus(status) {
        const interviews = document.querySelectorAll('.interview-item');
        interviews.forEach(item => {
            if (!status) {
                item.style.display = 'block';
                return;
            }
            
            const statusElement = item.querySelector('.status');
            const matches = statusElement && statusElement.textContent === status;
            item.style.display = matches ? 'block' : 'none';
        });
    }

    renderAnalytics() {
        // Simple analytics rendering
        this.createEmailChart();
        this.createSuccessChart();
    }

    createEmailChart() {
        const canvas = document.getElementById('email-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple bar chart simulation
        const data = [10, 25, 15, 30, 20, 35, 28];
        const maxValue = Math.max(...data);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#667eea';
        
        const barWidth = canvas.width / data.length;
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * (canvas.height - 20);
            ctx.fillRect(index * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
        });
    }

    createSuccessChart() {
        const canvas = document.getElementById('success-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple pie chart simulation
        const successRate = 0.68;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Success arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI * successRate);
        ctx.fillStyle = '#28a745';
        ctx.fill();
        
        // Remaining arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 2 * Math.PI * successRate, 2 * Math.PI);
        ctx.fillStyle = '#dc3545';
        ctx.fill();
    }

    // API Methods
    async sendEmail(emailData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/emails/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to send email');
            }
            
            return await response.json();
        } catch (error) {
            // Simulate success for demo
            console.log('Simulating email send:', emailData);
            await this.delay(1000);
            return { success: true, id: Date.now() };
        }
    }

    async sendInterviewInvitation(interviewData) {
        try {
            const emailData = {
                recipient: interviewData.candidateEmail,
                subject: `Interview Invitation - ${interviewData.candidateName}`,
                body: `Dear ${interviewData.candidateName},\n\nWe would like to schedule an interview with you on ${interviewData.date} at ${interviewData.time}.\n\nInterview Type: ${interviewData.type}\n\nPlease confirm your availability.\n\nBest regards,\nHR Team`
            };
            
            return await this.sendEmail(emailData);
        } catch (error) {
            console.error('Error sending interview invitation:', error);
            throw error;
        }
    }

    // Utility Methods
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('show');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Additional Methods for Interactive Features
    editInterview(interviewId) {
        const interview = this.data.interviews.find(i => i.id === interviewId);
        if (interview) {
            // Pre-fill modal with interview data
            document.getElementById('candidate-name').value = interview.candidateName;
            document.getElementById('candidate-email').value = interview.candidateEmail;
            document.getElementById('interview-date').value = interview.date;
            document.getElementById('interview-time').value = interview.time;
            document.getElementById('interview-type').value = interview.type;
            
            this.openInterviewModal();
        }
    }

    async sendReminder(interviewId) {
        try {
            this.showLoading();
            
            const interview = this.data.interviews.find(i => i.id === interviewId);
            if (interview) {
                const emailData = {
                    recipient: interview.candidateEmail,
                    subject: `Interview Reminder - ${interview.candidateName}`,
                    body: `Dear ${interview.candidateName},\n\nThis is a friendly reminder about your upcoming interview scheduled for ${interview.date} at ${interview.time}.\n\nInterview Type: ${interview.type}\n\nWe look forward to speaking with you.\n\nBest regards,\nHR Team`
                };
                
                await this.sendEmail(emailData);
                this.showToast('Reminder sent successfully!', 'success');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            this.showToast('Error sending reminder', 'error');
        } finally {
            this.hideLoading();
        }
    }

    createTemplate() {
        this.switchTab('compose');
        this.showToast('Create your template in the compose section', 'info');
    }

    editTemplate(templateId) {
        const template = this.data.templates.find(t => t.id === templateId);
        if (template) {
            this.switchTab('compose');
            document.getElementById('subject').value = template.subject;
            document.getElementById('email-body').value = template.body;
            this.showToast('Template loaded for editing', 'info');
        }
    }
}

// Global functions for onclick handlers
function closeModal() {
    if (window.app) {
        window.app.closeModal();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MailFlowApp();
});

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl+S to save draft
    if (e.ctrlKey && e.key === 's' && window.app && window.app.currentTab === 'compose') {
        e.preventDefault();
        window.app.saveDraft();
    }
});