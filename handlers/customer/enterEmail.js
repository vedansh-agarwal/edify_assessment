const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");
const mailSender = require("../mailSender");


const enterEmail = async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    let otp = Math.floor(100000 + Math.random() * 900000);
    db.query("CALL insert_otp(?, ?)", [email, otp],
    async (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(!result || !result[0] || !result[0][0]) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No enteries recieved from database."});
            }
            var subject, text;
            var status, responseMessage;
            if(result[0][0].noOfLinkedAccounts === 0) {
                subject = "Survey Account Email Verification Security Code";
                text = `Survey Code\n\nPlease use the following security code for verifying the company email address ${email}.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = statusCodes.resourceCreated;
                responseMessage = "OTP for registration sent to your email";
            } else {
                subject = "Survey Account Login Security Code";
                text = `Survey Code\n\nPlease use the following security code for logging into the Survey Application.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = statusCodes.success;
                responseMessage = "OTP for login sent to your email";
            }
            if(mailSender(email, subject, text) === "Error in sending email.") {
                return res.status(statusCodes.errorInSendingEmail).json({message: "Error in sending email."});
            } else {
                return res.status(status).json({message: responseMessage});
            }
        }
    });
}

module.exports = enterEmail;