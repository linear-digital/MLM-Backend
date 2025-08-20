const jwt = require("jsonwebtoken");

// Use a proper random string as secret, not a JWT token!
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

const tokenGenerator = (user) => {
    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, JWT_SECRET, // Use the proper secret here
        { expiresIn: "30d" });
    return token;
};

module.exports = tokenGenerator;
