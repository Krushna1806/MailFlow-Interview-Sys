const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock database for development
let templates = [
    {
        id: '1',
        name: 'Interview Invitation',
        subject: 'Interview Invitation - {{position}} Role',
        body: `Dear {{candidateName}},

We are pleased to invite you for an interview for the {{position}} position at our company.

Based on your impressive background and qualifications, we believe you would be an excellent fit for our team.

Interview Details:
- Date: {{date}}
- Time: {{time}}
- Type: {{type}}

Please confirm your availability by replying to this email.

Best regards,
HR Team`,
        type: 'interview-invitation',
        category: 'interview',
        variables: ['candidateName', 'position', 'date', 'time', 'type'],
        isActive: true,
        createdBy: 'dev@mailflow.com',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        name: 'Follow-up Email',
        subject: 'Following up on your application - {{position}}',
        body: `Dear {{candidateName}},

Thank you for your interest in the {{position}} role at our company.

We have received your application and are currently reviewing all submissions. We were impressed with your background and wanted to reach out to you directly.

We will be in touch soon with next steps in our hiring process.

In the meantime, if you have any questions about the role or our company, please don't hesitate to reach out.

Thank you for your patience and continued interest.

Best regards,
HR Team`,
        type: 'follow-up',
        category: 'application',
        variables: ['candidateName', 'position'],
        isActive: true,
        createdBy: 'dev@mailflow.com',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '3',
        name: 'Job Offer',
        subject: 'Job Offer - {{position}} Position',
        body: `Dear {{candidateName}},

We are delighted to extend an offer for the {{position}} position at our company.

After careful consideration of your qualifications and interview performance, we believe you would be a valuable addition to our team.

Offer Details:
- Position: {{position}}
- Start Date: {{startDate}}
- Salary: {{salary}}
- Benefits: Comprehensive health, dental, and vision insurance, 401k matching, flexible PTO

Please review the attached formal offer letter for complete details.

We would like to have your response by {{responseDeadline}}. If you have any questions, please don't hesitate to contact me.

We look forward to welcoming you to the team!

Best regards,
HR Team`,
        type: 'offer',
        category: 'offer',
        variables: ['candidateName', 'position', 'startDate', 'salary', 'responseDeadline'],
        isActive: true,
        createdBy: 'dev@mailflow.com',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '4',
        name: 'Application Rejection',
        subject: 'Update on your application - {{position}}',
        body: `Dear {{candidateName}},

Thank you for your interest in the {{position}} position and for taking the time to apply to our company.

After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.

This decision was not easy, as we were impressed with your background and qualifications. We encourage you to apply for future opportunities that match your skills and experience.

We will keep your resume on file and may reach out if a suitable position becomes available.

Thank you again for your interest in our company.

Best regards,
HR Team`,
        type: 'rejection',
        category: 'rejection',
        variables: ['candidateName', 'position'],
        isActive: true,
        createdBy: 'dev@mailflow.com',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// @route   GET /api/templates
// @desc    Get all templates for user
// @access  Private
router.get('/', (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, type } = req.query;
        
        let filteredTemplates = templates.filter(template => 
            template.createdBy === req.user.email || template.isActive
        );

        // Filter by category
        if (category) {
            filteredTemplates = filteredTemplates.filter(template => 
                template.category === category
            );
        }

        // Filter by type
        if (type) {
            filteredTemplates = filteredTemplates.filter(template => 
                template.type === type
            );
        }

        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            filteredTemplates = filteredTemplates.filter(template =>
                template.name.toLowerCase().includes(searchLower) ||
                template.subject.toLowerCase().includes(searchLower) ||
                template.body.toLowerCase().includes(searchLower)
            );
        }

        // Sort by creation date (newest first)
        filteredTemplates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            data: paginatedTemplates,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(filteredTemplates.length / limit),
                total: filteredTemplates.length
            }
        });

    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates'
        });
    }
});

// @route   GET /api/templates/:id
// @desc    Get specific template
// @access  Private
router.get('/:id', (req, res) => {
    try {
        const template = templates.find(t => t.id === req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }

        // Check if user has access to this template
        if (template.createdBy !== req.user.email && !template.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to this template'
            });
        }

        res.status(200).json({
            success: true,
            data: template
        });

    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch template'
        });
    }
});

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post('/', [
    body('name').notEmpty().withMessage('Template name is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('body').notEmpty().withMessage('Template body is required'),
    body('type').notEmpty().withMessage('Template type is required'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty if provided')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, subject, body, type, category = 'general', variables = [] } = req.body;

        // Extract variables from template content
        const extractedVariables = [...new Set([
            ...subject.match(/\{\{(\w+)\}\}/g)?.map(match => match.replace(/[{}]/g, '')) || [],
            ...body.match(/\{\{(\w+)\}\}/g)?.map(match => match.replace(/[{}]/g, '')) || [],
            ...variables
        ])];

        const template = {
            id: Date.now().toString(),
            name,
            subject,
            body,
            type,
            category,
            variables: extractedVariables,
            isActive: true,
            createdBy: req.user.email,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        templates.push(template);

        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: template
        });

    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create template'
        });
    }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
// @access  Private
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Template name cannot be empty'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
    body('body').optional().notEmpty().withMessage('Template body cannot be empty'),
    body('type').optional().notEmpty().withMessage('Template type cannot be empty')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const templateIndex = templates.findIndex(t => 
            t.id === req.params.id && t.createdBy === req.user.email
        );

        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Template not found or access denied'
            });
        }

        // Extract variables if content was updated
        let extractedVariables = templates[templateIndex].variables;
        if (req.body.subject || req.body.body) {
            const subject = req.body.subject || templates[templateIndex].subject;
            const body = req.body.body || templates[templateIndex].body;
            
            extractedVariables = [...new Set([
                ...subject.match(/\{\{(\w+)\}\}/g)?.map(match => match.replace(/[{}]/g, '')) || [],
                ...body.match(/\{\{(\w+)\}\}/g)?.map(match => match.replace(/[{}]/g, '')) || [],
                ...(req.body.variables || [])
            ])];
        }

        // Update template
        const updatedTemplate = {
            ...templates[templateIndex],
            ...req.body,
            variables: extractedVariables,
            updatedAt: new Date()
        };

        templates[templateIndex] = updatedTemplate;

        res.status(200).json({
            success: true,
            message: 'Template updated successfully',
            data: updatedTemplate
        });

    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update template'
        });
    }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', (req, res) => {
    try {
        const templateIndex = templates.findIndex(t => 
            t.id === req.params.id && t.createdBy === req.user.email
        );

        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Template not found or access denied'
            });
        }

        const deletedTemplate = templates[templateIndex];
        templates.splice(templateIndex, 1);

        res.status(200).json({
            success: true,
            message: 'Template deleted successfully',
            data: deletedTemplate
        });

    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete template'
        });
    }
});

// @route   POST /api/templates/:id/preview
// @desc    Preview template with provided variables
// @access  Private
router.post('/:id/preview', [
    body('variables').optional().isObject().withMessage('Variables must be an object')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const template = templates.find(t => t.id === req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }

        const variables = req.body.variables || {};
        
        // Replace variables in subject and body
        let previewSubject = template.subject;
        let previewBody = template.body;

        template.variables.forEach(variable => {
            const placeholder = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
            const value = variables[variable] || `[${variable}]`;
            
            previewSubject = previewSubject.replace(placeholder, value);
            previewBody = previewBody.replace(placeholder, value);
        });

        res.status(200).json({
            success: true,
            data: {
                template: {
                    id: template.id,
                    name: template.name,
                    type: template.type
                },
                preview: {
                    subject: previewSubject,
                    body: previewBody
                },
                variables: template.variables,
                providedVariables: variables
            }
        });

    } catch (error) {
        console.error('Error previewing template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to preview template'
        });
    }
});

// @route   POST /api/templates/:id/duplicate
// @desc    Duplicate a template
// @access  Private
router.post('/:id/duplicate', (req, res) => {
    try {
        const template = templates.find(t => t.id === req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }

        // Check if user has access to this template
        if (template.createdBy !== req.user.email && !template.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to this template'
            });
        }

        const duplicatedTemplate = {
            ...template,
            id: Date.now().toString(),
            name: `${template.name} (Copy)`,
            createdBy: req.user.email,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        templates.push(duplicatedTemplate);

        res.status(201).json({
            success: true,
            message: 'Template duplicated successfully',
            data: duplicatedTemplate
        });

    } catch (error) {
        console.error('Error duplicating template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to duplicate template'
        });
    }
});

// @route   GET /api/templates/categories
// @desc    Get all template categories
// @access  Private
router.get('/categories', (req, res) => {
    try {
        const categories = [...new Set(templates.map(t => t.category))];
        
        const categoryStats = categories.map(category => ({
            name: category,
            count: templates.filter(t => t.category === category).length,
            templates: templates.filter(t => t.category === category).map(t => ({
                id: t.id,
                name: t.name,
                type: t.type
            }))
        }));

        res.status(200).json({
            success: true,
            data: categoryStats
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

// @route   GET /api/templates/stats
// @desc    Get template statistics
// @access  Private
router.get('/stats', (req, res) => {
    try {
        const userTemplates = templates.filter(template => 
            template.createdBy === req.user.email
        );

        const stats = {
            total: userTemplates.length,
            active: userTemplates.filter(t => t.isActive).length,
            byCategory: {},
            byType: {},
            recentlyCreated: userTemplates.filter(t => {
                const daysSinceCreated = (new Date() - new Date(t.createdAt)) / (1000 * 60 * 60 * 24);
                return daysSinceCreated <= 7;
            }).length
        };

        // Count by category
        userTemplates.forEach(template => {
            stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
        });

        // Count by type
        userTemplates.forEach(template => {
            stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching template stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch template statistics'
        });
    }
});

module.exports = router;