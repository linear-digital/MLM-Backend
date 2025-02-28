const jwt = require("jsonwebtoken");

const secret = "Veryverysecret1574349"; // Ensure a fallback secret

const tokenGenerator = (user) => {
    try {
        if (!secret) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        if (!user || !user._id || !user.role) {
            throw new Error("Invalid user object for token generation");
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            secret, 
            { expiresIn: "30d" }
        );

        return token;
    } catch (error) {
        console.error("Error generating JWT:", error.message);
        throw new Error("Token generation failed");
    }
};

module.exports = tokenGenerator;