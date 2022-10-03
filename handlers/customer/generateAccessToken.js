const aes256 = require("aes256");
const jwt = require("jsonwebtoken");
const {statusCodes} = require("../statusCodes.json");

const generateAccessToken = async (req, res) => {
    const {refreshToken, email, customer_id} = req.body;
    const encryptedRefresh =  aes256.encrypt(process.env.REFRESH_ENCRYPTION_KEY, refreshToken); 
    const accessToken = jwt.sign({refreshToken: encryptedRefresh, customer_id: customer_id, email: email}, process.env.JWT_ACCESS_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE});
    return res.status(statusCodes.success).json({message: "Access Token Generation Successful", accessToken: accessToken});
}

module.exports = generateAccessToken;