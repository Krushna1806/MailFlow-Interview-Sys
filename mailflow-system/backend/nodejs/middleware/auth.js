const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');

    // Check if no token
    if (!token) {
        // In development mode, allow requests without authentication
        if (process.env.NODE_ENV === 'development') {
            req.user = { 
                id: 'dev-user',
                email: 'dev@mailflow.com',
                name: 'Development User'
            };
            return next();
        }
        
        return res.status(401).json({ 
            error: 'No token, authorization denied',
            message: 'Access token is required'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mailflow-secret-key');
        req.user = decoded.user;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        
        // In development mode, allow with mock user
        if (process.env.NODE_ENV === 'development') {
            req.user = { 
                id: 'dev-user',
                email: 'dev@mailflow.com',
                name: 'Development User'
            };
            return next();
        }
        
        res.status(401).json({ 
            error: 'Token is not valid',
            message: 'Please login again'
        });
    }
};

module.exports = authMiddleware;