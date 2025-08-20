const User = require("../Routes/User/user.model");
const jwt = require("jsonwebtoken");

const authChecker = async (req, res, next) => {
    try {
        // Check if authorization header exists
        if (!req.headers.authorization) {
            return res.status(401).json({
                message: "Unauthorized: No authorization header"
            });
        }

        // Extract token from "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: "Unauthorized: Invalid authorization format"
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized: No token provided"
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        const user = await User.findOne({ _id: decoded.id })
            .populate("reffer")
            .select("-password");
            
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized: User not found"
            });
        }

        req.user = user;
        next();
        
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        
        // Different error messages for different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Unauthorized: Invalid token"
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Unauthorized: Token expired"
            });
        }

        res.status(401).json({
            message: "Unauthorized: Authentication failed"
        });
    }
};

module.exports = authChecker;
