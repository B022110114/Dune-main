const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

// Generate token function
async function generateToken(user) {
    try {
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            secretKey,
            { expiresIn: '1h' }
        );
        return token;
    } catch (error) {
        console.error("Error generating token:", error);
        throw new Error("Token generation failed.");
    }
}

// Middleware to ensure only admins can access
const ADMIN = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send('Access denied: No token provided');
        }

        const decoded = jwt.verify(token, secretKey);
        
        // Check if the user role is 'admin'
        if (decoded.role === 'admin') {
            req.user = decoded;  // Attach user info to the request object
            return next(); // Proceed to the next middleware/handler
        } else {
            return res.status(403).send('Access denied: Insufficient permissions');
        }
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).send('Invalid token');
    }
};

// Middleware for generic user access
const USER = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send('Access denied: No token provided');
        }

        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;  // Attach user info to the request object
        return next(); // Proceed to the next middleware/handler
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).send('Invalid token');
    }
};

module.exports = {
    generateToken,
    ADMIN,
    USER
};