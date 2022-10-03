const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const getDetails = async (req, res) => {
    const {email} = req.body;

    db.query("SELECT * FROM get_customer_details WHERE companyEmailId = ?", [email],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No such user found"});
            } else {
                var statusCode = statusCodes.success;
                if(/[a-zA-Z]/.test(result[0].mobileNo)) {
                    result[0].mobileNo = "";
                    statusCode = statusCodes.resourceCreated;
                }
                return res.status(statusCode).json({message: "User Details", userDetails: result[0]});
            }
        }
    });
}

module.exports = getDetails;