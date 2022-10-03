const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");
const mailSender = require("../mailSender");

const enterDetails = async (req, res) => {
    var {customerName, companyName, mobileNo, email, designation, country, companyUrl} = req.body;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;

    if(!customerName || !companyName || !mobileNo) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    db.query("CALL enter_customer_details(?, ?, ?, ?, ?, ?, ?)",
    [customerName, mobileNo, companyName, designation, email, country, companyUrl],
    async (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(!result || !result[0] || !result[0][0]) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No enteries recieved from database."});
            } else {
                if(result[0][0].completionStatus === -1) {
                    return res.status(statusCodes.alreadyExists).json({message: "User Already Exists"});
                } else {
                    const subject = "Survey Assessment Link";
                    const text = `Dear Mr. ${customerName}\n\nThank you for registering with us. You can now start the survey using following link.\n\n\n`+process.env.ROUTE_FOR_ASSESSMENT+"\n\nThanks,\nSurvey Team";
                    // if(mailSender(email, subject, text) === "Error in sending email.") {
                    //     return res.status(statusCodes.errorInSendingEmail).json({message: "Error in sending email."});
                    // } else {
                        return res.status(statusCodes.success).json({message: "Details Registered."/* Please check your email for the link to start the survey."*/});
                    // }
                }
            }
        }
    });
}

module.exports = enterDetails;