const jwt = require("jsonwebtoken");


const secret = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyMDg4OTQ0MiwiaWF0IjoxNzIwODg5NDQyfQ.dArWtfCxb9x1SKeTu5-_FML7V4SDYVDa6lZLzFXRCcg";
const tokenGenerator = (user) => {
    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, secret,
        { expiresIn: "30d" });
    return token;
};
module.exports = tokenGenerator