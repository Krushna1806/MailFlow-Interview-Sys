const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const router = express.Router();

// Mock database for development
let emails = [];
let drafts = [];

// Email transporter configuration
const createTransporter = () => {
    // Use environment variables or demo credentials
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'demo@mailflow.com',
            pass: process.env.SMTP_PASS || 'demo-password'
        }
    });
};

// @route   POST /api/emails/send
// @desc    Send an email
// @access  Private
router.post('/send', [
    body('recipient').isEmail().withMessage('Valid recipient email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('body').notEmpty().withMessage('Email body is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { recipient, subject, body, template, cc, bcc } = req.body;

        // In development mode, simulate email sending
        if (process.env.NODE_ENV === 'development') {
            const email = {
                id: Date.now().toString(),
                recipient,
                subject,
                body,
                template,
                cc,
                bcc,
                sender: req.user.email,
                sentAt: new Date(),
                status: 'sent',
                messageId: `msg-${Date.now()}`
            };

            emails.push(email);

            // Emit real-time update
            req.io.emit('email_sent', {
                email: email,
                userId: req.user.id
            });

            return res.status(200).json({
                success: true,
                message: 'Email sent successfully (simulated)',
                data: email
            });
        }

        // Production email sending
        const transporter = createTransporter();

        const mailOptions = {
            from: `"MailFlow System" <${process.env.SMTP_USER}>`,
            to: recipient,
            cc: cc,
            bcc: bcc,
            subject: subject,
            html: body,
            text: body.replace(/<[^>]*>/g, '') // Strip HTML for text version
        };

        const info = await transporter.sendMail(mailOptions);

        const email = {
            id: info.messageId,
            recipient,
            subject,
            body,
            template,
            cc,
            bcc,
            sender: req.user.email,
            sentAt: new Date(),
            status: 'sent',
            messageId: info.messageId
        };

        emails.push(email);

        // Emit real-time update
        req.io.emit('email_sent', {
            email: email,
            userId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            data: email
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email',
            details: error.message
        });
    }
});

// @route   GET /api/emails
// @desc    Get all emails for user
// @access  Private
router.get('/', (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        
        let filteredEmails = emails.filter(email => 
            email.sender === req.user.email
        );

        // Filter by status
        if (status) {
            filteredEmails = filteredEmails.filter(email => 
                email.status === status
            );
        }

        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            filteredEmails = filteredEmails.filter(email =>
                email.recipient.toLowerCase().includes(searchLower) ||
                email.subject.toLowerCase().includes(searchLower) ||
                email.body.toLowerCase().includes(searchLower)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            data: paginatedEmails,
            pagination: {
                current: page,
                pages: Math.ceil(filteredEmails.length / limit),
                total: filteredEmails.length
            }
        });

    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch emails'
        });
    }
});

// @route   GET /api/emails/:id
// @desc    Get specific email
// @access  Private
router.get('/:id', (req, res) => {
    try {
        const email = emails.find(e => 
            e.id === req.params.id && e.sender === req.user.email
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        res.status(200).json({
            success: true,
            data: email
        });

    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch email'
        });
    }
});

// @route   DELETE /api/emails/:id
// @desc    Delete an email
// @access  Private
router.delete('/:id', (req, res) => {
    try {
        const emailIndex = emails.findIndex(e => 
            e.id === req.params.id && e.sender === req.user.email
        );

        if (emailIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        emails.splice(emailIndex, 1);

        res.status(200).json({
            success: true,
            message: 'Email deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete email'
        });
    }
});

// @route   POST /api/emails/draft
// @desc    Save email draft
// @access  Private
router.post('/draft', [
    body('recipient').optional().isEmail().withMessage('Valid recipient email is required'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty if provided'),
    body('body').optional().notEmpty().withMessage('Body cannot be empty if provided')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { recipient, subject, body, template } = req.body;

        const draft = {
            id: Date.now().toString(),
            recipient,
            subject,
            body,
            template,
            sender: req.user.email,
            savedAt: new Date(),
            status: 'draft'
        };

        drafts.push(draft);

        res.status(201).json({
            success: true,
            message: 'Draft saved successfully',
            data: draft
        });

    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save draft'
        });
    }
});

// @route   GET /api/emails/drafts
// @desc    Get all drafts for user
// @access  Private
router.get('/drafts', (req, res) => {
    try {
        const userDrafts = drafts.filter(draft => 
            draft.sender === req.user.email
        );

        res.status(200).json({
            success: true,
            data: userDrafts
        });

    } catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drafts'
        });
    }
});

// @route   POST /api/emails/bulk-send
// @desc    Send bulk emails
// @access  Private
router.post('/bulk-send', [
    body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
    body('recipients.*').isEmail().withMessage('All recipients must be valid emails'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('body').notEmpty().withMessage('Email body is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { recipients, subject, body, template } = req.body;
        const results = [];

        for (const recipient of recipients) {
            try {
                const email = {
                    id: `${Date.now()}-${Math.random()}`,
                    recipient,
                    subject,
                    body,
                    template,
                    sender: req.user.email,
                    sentAt: new Date(),
                    status: 'sent',
                    messageId: `bulk-msg-${Date.now()}`
                };

                emails.push(email);
                results.push({ recipient, status: 'sent', email });

                // Simulate delay for bulk sending
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                results.push({ 
                    recipient, 
                    status: 'failed', 
                    error: error.message 
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Bulk email sending completed',
            data: {
                total: recipients.length,
                sent: results.filter(r => r.status === 'sent').length,
                failed: results.filter(r => r.status === 'failed').length,
                results
            }
        });

    } catch (error) {
        console.error('Error sending bulk emails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send bulk emails'
        });
    }
});

module.exports = router;