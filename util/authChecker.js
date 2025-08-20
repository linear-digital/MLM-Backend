const User = require("../Routes/User/user.model");
const jwt = require("jsonwebtoken");

const authChecker = async (req, res, next) => {
    try {
        console.log('Authorization header:', req.headers.authorization);
        
        if (!req.headers.authorization) {
            console.log('No authorization header found');
            return res.status(401).json({ message: "Unauthorized: No authorization header" });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader.startsWith('Bearer ')) {
            console.log('Invalid authorization format:', authHeader);
            return res.status(401).json({ message: "Unauthorized: Invalid authorization format" });
        }

        const token = authHeader.split(" ")[1];
        console.log('Extracted token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        // DEBUG: Log the secret to ensure it's set
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
       const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-change-in-production");
        console.log('Decoded token:', decoded);
        
        const user = await User.findOne({ _id: decoded.id }).select("-password");
        
        if (!user) {
            console.log('User not found for ID:', decoded.id);
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }
        req.user = user;
        next();
        
    } catch (error) {
        console.error("Auth Error Details:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Token that failed:", req.headers.authorization?.split(' ')[1]);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized: Token expired" });
        }

        res.status(401).json({ message: "Unauthorized: Authentication failed" });
    }
};

module.exports = authChecker;
