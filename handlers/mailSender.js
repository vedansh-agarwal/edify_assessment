const dotenv = require("dotenv");
dotenv.config();

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

const mailSender = async (email, subject, text) => {
    try {
        await transporter.sendMail({
            from: "Survey Team <" + process.env.SENDER_GMAIL + ">",
            to: email,
            subject: subject,
            text: text
        });
        return "No Error";
    }
    catch(err) {
        console.log(err);
        return "Error in sending email.";
    }
}

module.exports = mailSender;