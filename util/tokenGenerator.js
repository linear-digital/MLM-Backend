const jwt = require("jsonwebtoken");


const secret = process.env.JWT_SECRET
const tokenGenerator = (user) => {
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: "30d" });
    return token;
};
module.exports = tokenGenerator