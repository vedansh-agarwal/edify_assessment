const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const updateDetails = async (req, res) => {
    var {customerName, companyName, mobileNo, email, designation, country, companyUrl} = req.body;
    customerName = customerName || null;
    companyName = companyName || null;
    mobileNo = mobileNo || null;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;

    db.query("CALL update_customer_details(?, ?, ?, ?, ?, ?, ?)",
    [customerName, mobileNo, companyName, designation, email, country, companyUrl],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Details Updated"});
        }
    });
}

module.exports = updateDetails;