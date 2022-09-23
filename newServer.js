// .env configuration
const dotenv = require("dotenv");
dotenv.config();

// Database Connection
const mysql = require("mysql2");
const db = mysql.createConnection({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_DATABASE,
});

// Express Configuration
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer Configuration
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SENDER_GMAIL, 
      pass: process.env.SENDER_APP_PASSWORD, 
    }
});

// Middleware
function checkAuth(req, res, next) {
    next();
}

// Imports for Routes
const { v4: uuidv4 } = require("uuid");


// Routes

app.post("/quizapi/customer/enter-email", checkAuth, (req, res) => {
    const {email} = req.body;

    db.query('SELECT registrationStatus FROM customers WHERE companyEmailId = ?', [email],
    async (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error", errMsg: err.message});
        } else {
            var otp = Math.floor(100000 + Math.random() * 900000);
            var subject, text;
            var status, responseMessage;
            if(result.length > 0) {
                subject = "Survey Account Login security Code";
                text = `Survey Code\n\nPlease use the following security code for logging into the Survey Application.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = 200;
                responseMessage = "OTP for login sent to your email";
            } else {
                var mailParts = email.split("@");
                var hashedEmail = mailParts[0].substring(0,2) + new Array(mailParts[0].length-3).join("*") + mailParts[0].substring(mailParts[0].length-2)+"@"+mailParts[1];
                subject = "Survey Account Email verification security Code";
                text = `Survey Code\n\nPlease use the following security code for verifying the company email address ${hashedEmail}.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = 201;
                responseMessage = "OTP for registration sent to your email";
            }
            var error;
            db.query('INSERT INTO customer_otp (email, otp) VALUES (?, ?)', [email, otp],
            (err1) => {
                if(err1) {
                    console.log(err);
                    error = err1;
                } 
            });
            if(error) return res.status(299).json({message: "Database Error"});
            try {
                await transporter.sendMail({
                    from: "Survey Team <" + process.env.SENDER_GMAIL + ">",
                    to: email,
                    subject: subject,
                    text: text
                });
            }
            catch(err) {
                console.log(err);
                return res.status(212).json({message: "Error in sending email."});
            }
            return res.status(status).json({message: responseMessage});
        }
    });
});

app.post("/quizapi/customer/verify-otp", checkAuth, (req, res) => {
    const {email, otp} = req.body;

    db.query('SELECT * FROM customer_otp WHERE email = ? AND otp = ?', [email, otp],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length > 0) {
                db.query('DELETE FROM customer_otp WHERE email = ?', [email],
                (err1) => {
                    if(err1) {
                        console.log(err1);
                        return res.status(299).json({message: "Database Error", errMsg: err1.message});
                    } else {
                        return res.status(200).json({message: "OTP verified"});
                    }
                });
            } else {
                return res.status(201).json({message: "Invalid OTP"});
            }
        }
    });
});

app.post("/quizapi/customer/get-details", checkAuth, (req, res) => {
    const {email} = req.body;

    db.query('SELECT * FROM customers WHERE companyEmailId = ?', [email],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length > 0) {
                return res.status(200).json({message: "User details", data: result[0]});
            } else {
                return res.status(201).json({message: "User not registered"});
            }
        }
    });
});

app.post("/quizapi/customer/send-details", checkAuth, (req, res) => {
    var {customerName, companyName, mobileNo, companyEmailId, designation, country, companyUrl} = req.body;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;
    db.query('INSERT INTO customers (customerId, companyEmailId, companyName, customerName, mobileNo, designation, country, registrationStatus, companyUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [uuidv4(), companyEmailId, companyName, customerName, mobileNo, designation, country, 2, companyUrl],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(200).json({message: "Details registered"});
        }
    });
});

app.post("/quizapi/customer/update-details", checkAuth, (req, res) => {
    var {customerName, companyName, mobileNo, companyEmailId, designation, country, companyUrl} = req.body;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;
    db.query('UPDATE customers SET companyName = ?, customerName = ?, mobileNo = ?, designation = ?, country = ?, companyUrl = ?, updatedOn = CURRENT_TIMESTAMP() WHERE companyEmailId = ?', 
    [companyName, customerName, mobileNo, designation, country, companyUrl, companyEmailId],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(200).json({message: "Details updated"});
        }
    });
});



// Server Start
app.listen(port, () => console.log(`Server listening on http://localhost:${port}/`));

setInterval(() => {
    db.query("CALL delete_expired_OTPs()");
}, 1000);