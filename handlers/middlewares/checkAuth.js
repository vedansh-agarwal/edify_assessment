const db = require("../../db/dbConnect");
const jwt = require("jsonwebtoken");
const aes256 = require("aes256");
const {statusCodes} = require("../statusCodes.json");

const checkAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if(token == null) return res.status(statusCodes.accessDenied).json({message: "Access Denied"});

    try{
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        var refreshToken = aes256.decrypt(process.env.REFRESH_ENCRYPTION_KEY, decoded.refreshToken);

        db.query("SELECT COUNT(*) AS tokenExists FROM customers WHERE refreshToken = ?", [refreshToken],
        (err, result) => {
            if(err) {
                console.log(err);
                return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
            } else {
                if(result.length == 0) {
                    return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
                } else {
                    req.body.email = decoded.email;
                    req.body.customer_id = decoded.customer_id;
                    next();
                }
            }
        });
    } catch(err) {
        return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
    }
}

module.exports = checkAuth;