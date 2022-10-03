const db = require("../../db/dbConnect");
const jwt = require("jsonwebtoken");
const aes256 = require("aes256");
const {statusCodes} = require("../statusCodes.json");

const checkRefresh = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if(token == null) return res.status(statusCodes.accessDenied).json({message: "Access Denied"});

    try{
        jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        var refreshToken = token;

        db.query("SELECT companyEmailId, customerId FROM customers WHERE refreshToken = ?", [refreshToken],
        (err, result) => {
            if(err) {
                console.log(err);
                return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
            } else {
                if(result.length == 0) {
                    return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
                } else {
                    req.body.refreshToken = refreshToken;
                    req.body.email = result[0].companyEmailId;
                    req.body.customer_id = result[0].customerId;
                    next();
                }
            }
        });
    } catch(err) {
        return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
    }
}

module.exports = checkRefresh;