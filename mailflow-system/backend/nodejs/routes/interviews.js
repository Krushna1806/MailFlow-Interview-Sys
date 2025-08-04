const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock database for development
let interviews = [
    {
        id: '1',
        candidateName: 'John Doe',
        candidateEmail: 'john.doe@email.com',
        position: 'Frontend Developer',
        date: '2024-01-15',
        time: '10:00',
        type: 'video',
        status: 'scheduled',
        interviewer: 'dev@mailflow.com',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        candidateName: 'Jane Smith',
        candidateEmail: 'jane.smith@email.com',
        position: 'Backend Developer',
        date: '2024-01-16',
        time: '14:00',
        type: 'phone',
        status: 'completed',
        interviewer: 'dev@mailflow.com',
        notes: 'Great technical skills, strong problem-solving abilities.',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private
router.post('/', [
    body('candidateName').notEmpty().withMessage('Candidate name is required'),
    body('candidateEmail').isEmail().withMessage('Valid candidate email is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM format)'),
    body('type').isIn(['video', 'phone', 'in-person']).withMessage('Interview type must be video, phone, or in-person')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            candidateName,
            candidateEmail,
            position,
            date,
            time,
            type,
            notes = ''
        } = req.body;

        const interview = {
            id: Date.now().toString(),
            candidateName,
            candidateEmail,
            position,
            date,
            time,
            type,
            status: 'scheduled',
            interviewer: req.user.email,
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        interviews.push(interview);

        // Emit real-time update
        req.io.emit('interview_created', {
            interview: interview,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Interview created successfully',
            data: interview
        });

    } catch (error) {
        console.error('Error creating interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create interview'
        });
    }
});

// @route   GET /api/interviews
// @desc    Get all interviews for user
// @access  Private
router.get('/', (req, res) => {
    try {
        const { page = 1, limit = 10, status, date, search } = req.query;
        
        let filteredInterviews = interviews.filter(interview => 
            interview.interviewer === req.user.email
        );

        // Filter by status
        if (status) {
            filteredInterviews = filteredInterviews.filter(interview => 
                interview.status === status
            );
        }

        // Filter by date
        if (date) {
            filteredInterviews = filteredInterviews.filter(interview => 
                interview.date === date
            );
        }

        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            filteredInterviews = filteredInterviews.filter(interview =>
                interview.candidateName.toLowerCase().includes(searchLower) ||
                interview.candidateEmail.toLowerCase().includes(searchLower) ||
                interview.position.toLowerCase().includes(searchLower)
            );
        }

        // Sort by date and time
        filteredInterviews.sort((a, b) => {
            const dateTimeA = new Date(`${a.date} ${a.time}`);
            const dateTimeB = new Date(`${b.date} ${b.time}`);
            return dateTimeA - dateTimeB;
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            data: paginatedInterviews,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(filteredInterviews.length / limit),
                total: filteredInterviews.length
            }
        });

    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch interviews'
        });
    }
});

// @route   GET /api/interviews/:id
// @desc    Get specific interview
// @access  Private
router.get('/:id', (req, res) => {
    try {
        const interview = interviews.find(i => 
            i.id === req.params.id && i.interviewer === req.user.email
        );

        if (!interview) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found'
            });
        }

        res.status(200).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch interview'
        });
    }
});

// @route   PUT /api/interviews/:id
// @desc    Update an interview
// @access  Private
router.put('/:id', [
    body('candidateName').optional().notEmpty().withMessage('Candidate name cannot be empty'),
    body('candidateEmail').optional().isEmail().withMessage('Valid candidate email is required'),
    body('position').optional().notEmpty().withMessage('Position cannot be empty'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM format)'),
    body('type').optional().isIn(['video', 'phone', 'in-person']).withMessage('Interview type must be video, phone, or in-person'),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const interviewIndex = interviews.findIndex(i => 
            i.id === req.params.id && i.interviewer === req.user.email
        );

        if (interviewIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found'
            });
        }

        // Update interview
        const updatedInterview = {
            ...interviews[interviewIndex],
            ...req.body,
            updatedAt: new Date()
        };

        interviews[interviewIndex] = updatedInterview;

        // Emit real-time update
        req.io.emit('interview_updated', {
            interview: updatedInterview,
            userId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: 'Interview updated successfully',
            data: updatedInterview
        });

    } catch (error) {
        console.error('Error updating interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update interview'
        });
    }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete an interview
// @access  Private
router.delete('/:id', (req, res) => {
    try {
        const interviewIndex = interviews.findIndex(i => 
            i.id === req.params.id && i.interviewer === req.user.email
        );

        if (interviewIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found'
            });
        }

        const deletedInterview = interviews[interviewIndex];
        interviews.splice(interviewIndex, 1);

        // Emit real-time update
        req.io.emit('interview_deleted', {
            interviewId: req.params.id,
            userId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: 'Interview deleted successfully',
            data: deletedInterview
        });

    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete interview'
        });
    }
});

// @route   POST /api/interviews/schedule
// @desc    Schedule interview and send invitation
// @access  Private
router.post('/schedule', [
    body('candidateName').notEmpty().withMessage('Candidate name is required'),
    body('candidateEmail').isEmail().withMessage('Valid candidate email is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM format)'),
    body('type').isIn(['video', 'phone', 'in-person']).withMessage('Interview type must be video, phone, or in-person')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            candidateName,
            candidateEmail,
            position,
            date,
            time,
            type,
            notes = ''
        } = req.body;

        // Create interview
        const interview = {
            id: Date.now().toString(),
            candidateName,
            candidateEmail,
            position,
            date,
            time,
            type,
            status: 'scheduled',
            interviewer: req.user.email,
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        interviews.push(interview);

        // Prepare invitation email
        const invitationSubject = `Interview Invitation - ${position} Position`;
        const invitationBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Interview Invitation</h2>
                
                <p>Dear ${candidateName},</p>
                
                <p>We are pleased to invite you for an interview for the <strong>${position}</strong> position.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Interview Details</h3>
                    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} Interview</p>
                    ${type === 'video' ? '<p><strong>Meeting Link:</strong> Will be provided 24 hours before the interview</p>' : ''}
                    ${type === 'phone' ? '<p><strong>Phone:</strong> We will call you at your provided number</p>' : ''}
                    ${type === 'in-person' ? '<p><strong>Location:</strong> Company office address will be shared separately</p>' : ''}
                </div>
                
                <p>Please confirm your availability by replying to this email.</p>
                
                <p>If you have any questions or need to reschedule, please don't hesitate to contact us.</p>
                
                <p>We look forward to meeting you!</p>
                
                <p>Best regards,<br>
                HR Team<br>
                MailFlow System</p>
            </div>
        `;

        // Simulate sending invitation email
        console.log(`Sending interview invitation to ${candidateEmail}`);

        // Emit real-time updates
        req.io.emit('interview_scheduled', {
            interview: interview,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Interview scheduled and invitation sent successfully',
            data: {
                interview,
                invitationSent: true
            }
        });

    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule interview'
        });
    }
});

// @route   POST /api/interviews/:id/reminder
// @desc    Send interview reminder
// @access  Private
router.post('/:id/reminder', async (req, res) => {
    try {
        const interview = interviews.find(i => 
            i.id === req.params.id && i.interviewer === req.user.email
        );

        if (!interview) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found'
            });
        }

        // Prepare reminder email
        const reminderSubject = `Interview Reminder - ${interview.position}`;
        const reminderBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Interview Reminder</h2>
                
                <p>Dear ${interview.candidateName},</p>
                
                <p>This is a friendly reminder about your upcoming interview.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Interview Details</h3>
                    <p><strong>Position:</strong> ${interview.position}</p>
                    <p><strong>Date:</strong> ${new Date(interview.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${interview.time}</p>
                    <p><strong>Type:</strong> ${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview</p>
                </div>
                
                <p>We look forward to speaking with you!</p>
                
                <p>Best regards,<br>
                HR Team<br>
                MailFlow System</p>
            </div>
        `;

        // Simulate sending reminder
        console.log(`Sending interview reminder to ${interview.candidateEmail}`);

        res.status(200).json({
            success: true,
            message: 'Interview reminder sent successfully',
            data: {
                interviewId: interview.id,
                reminderSent: true
            }
        });

    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reminder'
        });
    }
});

// @route   GET /api/interviews/stats
// @desc    Get interview statistics
// @access  Private
router.get('/stats', (req, res) => {
    try {
        const userInterviews = interviews.filter(interview => 
            interview.interviewer === req.user.email
        );

        const stats = {
            total: userInterviews.length,
            scheduled: userInterviews.filter(i => i.status === 'scheduled').length,
            completed: userInterviews.filter(i => i.status === 'completed').length,
            cancelled: userInterviews.filter(i => i.status === 'cancelled').length,
            byType: {
                video: userInterviews.filter(i => i.type === 'video').length,
                phone: userInterviews.filter(i => i.type === 'phone').length,
                inPerson: userInterviews.filter(i => i.type === 'in-person').length
            },
            upcoming: userInterviews.filter(i => {
                const interviewDate = new Date(`${i.date} ${i.time}`);
                return interviewDate > new Date() && i.status === 'scheduled';
            }).length
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching interview stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch interview statistics'
        });
    }
});

module.exports = router;