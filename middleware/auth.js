const jwt = require("jsonwebtoken");

const config = require('../config.js');
const User = require('../schemas/userSchema')

const verifyToken = (req, res, next) => {
    const token =
        req.body.token || req.query.token || req.headers["x-access-token"];
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, config.secret);
        req.user = decoded;

        // Add to req object
        req.user_id = decoded.user_id;

        return next();
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
};

module.exports = verifyToken;