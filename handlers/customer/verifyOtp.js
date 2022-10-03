const db = require("../../db/dbConnect");
const jwt = require("jsonwebtoken");
const aes256 = require("aes256");
const {v4: uuidv4} = require("uuid");
const {statusCodes} = require("../statusCodes.json");

const verifyOtp = async (req, res) => {
    const {email, otp} = req.body;

    if(!email || !otp) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    let customer_id = uuidv4();
    const refreshToken = jwt.sign({email: email}, process.env.JWT_REFRESH_SECRET, {expiresIn: process.env.REFRESH_TOKEN_LIFE});
    db.query("CALL check_otp(?, ?, ?, ?)", [email, otp, customer_id, refreshToken],
    async (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result && result[0] && result[0].length > 0) {
                // const subject = "Survey Assessment Link";
                // const text = `Dear Mr. ${result[0][0].customerName}\n\nYou can now resume the survey using following link.\n\n\n`+process.env.ROUTE_FOR_ASSESSMENT+"\n\nThanks,\nSurvey Team";
                // if(mailSender(email, subject, text) === "Error in sending email.") {
                //     return res.status(statusCodes.errorInSendingEmail).json({message: "Error in sending email."});
                // }
                customer_id = result[0][0].customer_id;
                const encryptedRefresh =  aes256.encrypt(process.env.REFRESH_ENCRYPTION_KEY, refreshToken); 
                const accessToken = jwt.sign({refreshToken: encryptedRefresh, customer_id: customer_id, email: email}, process.env.JWT_ACCESS_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE});
                return res.status(statusCodes.success).json({message: "OTP verified", accessToken: accessToken, refreshToken: refreshToken});
            } else {
                return res.status(statusCodes.invalidCredentials).json({message: "Invalid OTP"});
            }
        }
    });
}

module.exports = verifyOtp;