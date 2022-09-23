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
const bodyParser = require("body-parser");
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

// Imports for Routes
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");


// Routes
app.post("/quizapi/user/enter-email", (req, res) => {
    const {email} = req.body;

    db.query('SELECT registrationStatus FROM customers WHERE companyEmailId = ?', [email], 
    async (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error"});
        } else {
            var otp = Math.floor(100000 + Math.random() * 900000);
            if(result.length > 0 && result[0].registrationStatus === 1) return res.status(210).json({message: "Activate your accounr using the link sent to your email"});
            var error;
            db.query('INSERT INTO customer_otp (email, otp) VALUES (?, ?)', [email, otp],
            (err1) => {
                if(err1) {
                    console.log(err);
                    error = err1;
                } 
            });
            if(error) return res.status(299).json({message: "Database Error"});
            
            var subject, text;
            var status, responseMessage, token;
            if(result.length > 0) {
                subject = "Survey Account Login security Code";
                text = `Survey Code\n\nPlease use the following security code for logging into the Survey Application.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = 200;
                responseMessage = "OTP for login sent to your email";
                token = jwt.sign({email: email, type: "login"}, process.env.JWT_SECRET, {expiresIn: "24h"});
            } else {
                var mailParts = email.split("@");
                var hashedEmail = mailParts[0].substring(0,2) + new Array(mailParts[0].length-3).join("*") + mailParts[0].substring(mailParts[0].length-2)+"@"+mailParts[1];
                subject = "Survey Account Email verification security Code";
                text = `Survey Code\n\nPlease use the following security code for verifying the company email address ${hashedEmail}.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = 201;
                responseMessage = "OTP for registration sent to your email";
                token = jwt.sign({email: email, type: "registration"}, process.env.JWT_SECRET, {expiresIn: "16m"});
            }
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
            return res.status(status).json({message: responseMessage, token: token});
        } 
    });
});

app.post("/quizapi/user/verify-otp", (req, res) => {
    const {token, otp} = req.body;
    var email, type;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        type = decoded.type;
        email = decoded.email;
    } catch(err) {
        console.log(err);
        return res.status(280).json({message: "Invalid or expired token"});
    }

    db.query('SELECT otp, current_timestamp FROM customer_otp WHERE email = ? ORDER BY `current_timestamp` DESC LIMIT 1', [email],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error"});
        } else if(result.length > 0 && result[0].otp == otp) {
            const newToken = jwt.sign({email: email, otpVerified: true, loginVerified: type === "login"}, process.env.JWT_SECRET, {expiresIn: "24h"});
            return res.status(200).json({message: "OTP verified", token: newToken, type: type});
        } else {
            return res.status(209).json({message: "Incorrect OTP"})
        }
    });
});

app.post("/quizapi/user/enter-details", (req, res) => {
    var {name, company_name, mob_no, designation, country, token, company_url} = req.body;
    designation = designation || null;
    country = country || null;
    company_url = company_url || null;
    var email;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded.otpVerified) {
            return res.status(280).json({message: "Invalid token"});
        }
        email = jwt.verify(token, process.env.JWT_SECRET).email;
    } catch(err) {
        return res.status(280).json({message: "Invalid or expired token"});
    }

    db.query('INSERT INTO customers (customerId, companyEmailId, companyName, customerName, mobileNo, designation, country, registrationStatus, companyUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [uuidv4(), email, company_name, name, mob_no, designation, country, 1, company_url],
    async (err) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: err.message});
        } else {
            const token = jwt.sign({email: email, registrationInitiated: true}, process.env.JWT_SECRET);
            const link = process.env.ROUTE_FOR_ACTIVATION+`${token}`;
            console.log(token);
            try {
                await transporter.sendMail({
                    from: "Survey Team <" + process.env.SENDER_GMAIL + ">",
                    to: email,
                    subject: "Registration verification link",
                    text: `Dear Mr. ${name}\n\nThank you for registering with us. You can now start the survey using following link.\n\n\n`+link+"\n\nThanks,\nSurvey Team"
                });
            }
            catch(err) {
                console.log(err);
                return res.status(212).json({message: "Error in sending email."});
            }
            return res.status(200).json({message: "Account activation link sent to email"});
        }
    });
});

app.post("/quizapi/user/activate", (req, res) => {
    const {token} = req.body;
    var email;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.registrationInitiated) {
            email = decoded.email;
        }
    } catch(err) {
        return res.status(210).json({message: "Invalid Token"});
    }

    db.query('UPDATE customers SET registrationStatus = 2 WHERE companyEmailId = ?', [email],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(299).json({message: "Database Error"});
        } else {
            const newToken = jwt.sign({email: email, loginVerified: true}, process.env.JWT_SECRET, {expiresIn: "24h"});
            return res.status(200).json({message: "Account activated", token: newToken});
        }
    });
});

// Server Start
app.listen(port, () => console.log(`Server listening on http://localhost:${port}/`));

setInterval(() => {
    db.query("CALL delete_expired_OTPs()");
}, 1000);