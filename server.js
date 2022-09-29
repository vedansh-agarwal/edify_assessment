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
        console.log(err);
        return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
    }
}

function checkRefresh(req, res, next) {
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
        console.log(err);
        return res.status(statusCodes.accessDenied).json({message: "Access Denied"});
    }
}


// Imports for Routes
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const aes256 = require("aes256");
const {statusCodes} = require("./statusCodes");

// Routes
app.get("/edify/customer/generate-access-token", checkRefresh, (req, res) => {
    const {refreshToken, email, customer_id} = req.body;
    const encryptedRefresh =  aes256.encrypt(process.env.REFRESH_ENCRYPTION_KEY, refreshToken); 
    const accessToken = jwt.sign({refreshToken: encryptedRefresh, customer_id: customer_id, email: email}, process.env.JWT_ACCESS_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE});
    return res.status(statusCodes.success).json({message: "Access Token Generation Successful", accessToken: accessToken});
});

app.post("/edify/customer/enter-email", (req, res) => {
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
                var mailParts = email.split("@");
                var hashedEmail = mailParts[0].substring(0,2) + new Array(mailParts[0].length-3).join("*") + mailParts[0].substring(mailParts[0].length-2)+"@"+mailParts[1];
                subject = "Survey Account Email verification security Code";
                text = `Survey Code\n\nPlease use the following security code for verifying the company email address ${hashedEmail}.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = statusCodes.resourceCreated;
                responseMessage = "OTP for registration sent to your email";
            } else {
                subject = "Survey Account Login security Code";
                text = `Survey Code\n\nPlease use the following security code for logging into the Survey Application.\n\n\n\n\nSecurity Code : ${otp}\n\nIf you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.\n\nThanks,\nSurvey Team`;
                status = statusCodes.success;
                responseMessage = "OTP for login sent to your email";
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
                return res.status(statusCodes.errorInSendingEmail).json({message: "Error in sending email."});
            }
            return res.status(status).json({message: responseMessage});
        }
    });
});

app.post("/edify/customer/verify-otp", (req, res) => {
    const {email, otp} = req.body;

    if(!email || !otp) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    let customer_id = uuidv4();
    const refreshToken = jwt.sign({email: email}, process.env.JWT_REFRESH_SECRET, {expiresIn: process.env.REFRESH_TOKEN_LIFE});
    db.query("CALL check_otp(?, ?, ?, ?)", [email, otp, customer_id, refreshToken],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result && result[0] && result[0].length > 0) {
                customer_id = result[0][0].customer_id;
                const encryptedRefresh =  aes256.encrypt(process.env.REFRESH_ENCRYPTION_KEY, refreshToken); 
                const accessToken = jwt.sign({refreshToken: encryptedRefresh, customer_id: customer_id, email: email}, process.env.JWT_ACCESS_SECRET, {expiresIn: process.env.ACCESS_TOKEN_LIFE});
                return res.status(statusCodes.success).json({message: "OTP verified", accessToken: accessToken, refreshToken: refreshToken});
            } else {
                return res.status(statusCodes.invalidCredentials).json({message: "Invalid OTP"});
            }
        }
    });
});

app.get("/edify/customer/get-details", checkAuth, (req, res) => {
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
                return res.status(statusCodes.success).json({message: "User Details", userDetails: result[0]});
            }
        }
    });
});

app.post("/edify/customer/enter-details", checkAuth, (req, res) => {
    var {customerName, companyName, mobileNo, email, designation, country, companyUrl} = req.body;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;

    if(!customerName || !companyName || !mobileNo) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    db.query("CALL enter_customer_details(?, ?, ?, ?, ?, ?, ?)",
    [customerName, mobileNo, companyName, designation, email, country, companyUrl],
    (err, result) => {
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
                    return res.status(statusCodes.success).json({message: "Details Registered"});
                }
            }
        }
    });
});

app.patch("/edify/customer/update-details", checkAuth, (req, res) => {
    var {customerName, companyName, mobileNo, email, designation, country, companyUrl} = req.body;
    customerName = customerName || null;
    companyName = companyName || null;
    mobileNo = mobileNo || null;
    designation = designation || null;
    country = country || null;
    companyUrl = companyUrl || null;

    db.query("CALL update_customer_details(?, ?, ?, ?, ?, ?, ?)",
    [customerName, mobileNo, companyName, designation, email, country, companyUrl],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Details Updated"});
        }
    });
});

app.post("/edify/user/add-question", (req, res) => {
    var {sectionName, subSectionName, quesNo, questionDescription, choiceDetails, createdBy, questionHelp} = req.body;

    if(!sectionName || !quesNo || !questionDescription || !choiceDetails || !createdBy) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    try {
        questionDescription = JSON.stringify({quesNo: quesNo, questionDescription: questionDescription});
        choiceDetails = JSON.stringify(choiceDetails);
    } catch(err) {
        console.log(err);
        return res.status(statusCodes.invalidFormat).json({message: "Invalid JSON format"});
    }
    questionHelp = questionHelp || null;
    subSectionName = subSectionName || null;

    db.query("CALL add_question(?, ?, ?, ?, ?, ?)",
    [sectionName, subSectionName, questionDescription, choiceDetails, createdBy, questionHelp],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Question Added", questionID: result[0][0].id});
        }
    });
});

app.get("/edify/user/get-question/:ques_id", (req, res) => {
    const {ques_id} = req.params;

    db.query("SELECT sectionName, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions WHERE id = ?", [ques_id],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No such question found"});
            } else {
                var quesDesc = JSON.parse(result[0].questionDescription);
                var questionData = {
                    sectionName: result[0].sectionName,
                    subSectionName: result[0].subSectionName,
                    quesNo: quesDesc.quesNo,
                    questionDescription: quesDesc.quesDescription,
                    choiceDetails: JSON.parse(result[0].choiceDetails),
                    questionHelp: result[0].questionHelp
                }
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    });
});

app.patch("/edify/user/update-question/:ques_id", (req, res) => {
    const {ques_id} = req.params;
    var {sectionName, subSectionName, quesNo, questionDescription, choiceDetails, updatedBy, questionHelp} = req.body;

    if(!sectionName || !quesNo || !questionDescription || !choiceDetails || !updatedBy) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    try {
        questionDescription = JSON.stringify({quesNo: quesNo, questionDescription: questionDescription});
        choiceDetails = JSON.stringify(choiceDetails);
    } catch(err) {
        console.log(err);
        return res.status(statusCodes.invalidFormat).json({message: "Invalid JSON format"});
    }
    questionHelp = questionHelp || null;
    subSectionName = subSectionName || null;

    db.query("UPDATE questions SET sectionName = ?, subSectionName = ?, questionDescription = ?, choiceDetails = ?, updatedBy = ?, questionHelp = ? WHERE id = ?",
    [sectionName, subSectionName, questionDescription, choiceDetails, updatedBy, questionHelp, ques_id],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Question Updated"});
        }
    });
});

app.delete("/edify/user/delete-question/:ques_id", (req, res) => {
    const {ques_id} = req.params;

    db.query("DELETE FROM questions WHERE id = ?", [ques_id],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Question Deleted"});
        }
    });
});

app.post("/edify/user/get-questions-by-section-name", (req, res) => {
    const {sectionName} = req.body;

    if(!sectionName) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    db.query("SELECT id, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions WHERE sectionName = ?", [sectionName],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No questions found"});
            } else {
                var questionData = [];
                result.forEach((ques) => {
                    var quesDesc = JSON.parse(ques.questionDescription);
                    questionData.push({
                        quesID: ques.id,
                        sectionName: sectionName,
                        subSectionName: ques.subSectionName,
                        quesNo: quesDesc.quesNo,
                        questionDescription: quesDesc.quesDescription,
                        choiceDetails: JSON.parse(ques.choiceDetails),
                        questionHelp: ques.questionHelp
                    });
                });
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    });
});

app.post("/edify/user/get-questions-by-section-and-subsection", (req, res) => {
    const {sectionName, subSectionName} = req.body;

    if(!sectionName || !subSectionName) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    db.query("SELECT id, questionDescription, choiceDetails, questionHelp FROM questions WHERE sectionName = ? AND subSectionName = ?", [sectionName, subSectionName],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No questions found"});
            } else {
                var questionData = [];
                result.forEach((ques) => {
                    var quesDesc = JSON.parse(ques.questionDescription);
                    questionData.push({
                        quesID: ques.id,
                        sectionName: sectionName,
                        subSectionName: subSectionName,
                        quesNo: quesDesc.quesNo,
                        questionDescription: quesDesc.quesDescription,
                        choiceDetails: JSON.parse(ques.choiceDetails),
                        questionHelp: ques.questionHelp
                    });
                });
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    });
});

app.get("/edify/customer/all-questions", (req, res) => {
    db.query("SELECT id, sectionName, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions",
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No questions found"});
            } else {
                var questionData = [];
                result.forEach((ques) => {
                    var quesDesc = JSON.parse(ques.questionDescription);
                    questionData.push({
                        quesID: ques.id,
                        sectionName: ques.sectionName,
                        subSectionName: ques.subSectionName,
                        quesNo: quesDesc.quesNo,
                        questionDescription: quesDesc.quesDescription,
                        choiceDetails: JSON.parse(ques.choiceDetails),
                        questionHelp: ques.questionHelp
                    });
                });
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    });
});

app.get("/edify/customer/get-odm-questions", (req, res) => {
    db.query("SELECT id, sectionName, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions WHERE sectionName LIKE 'Section 3%'",
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No questions found"});
            } else {
                var questionData = [];
                result.forEach((ques) => {
                    var quesDesc = JSON.parse(ques.questionDescription);
                    questionData.push({
                        quesID: ques.id,
                        sectionName: ques.sectionName,
                        subSectionName: ques.subSectionName,
                        quesNo: quesDesc.quesNo,
                        questionDescription: quesDesc.quesDescription,
                        choiceDetails: JSON.parse(ques.choiceDetails),
                        questionHelp: ques.questionHelp
                    });
                });
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    })
});

app.get("/edify/customer/get-fm-questions", (req, res) => {
    db.query("SELECT id, sectionName, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions WHERE sectionName LIKE 'Section 4%'",
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            if(result.length == 0) {
                return res.status(statusCodes.noSuchResource).json({message: "Database Error", errMsg: "No questions found"});
            } else {
                var questionData = [];
                result.forEach((ques) => {
                    var quesDesc = JSON.parse(ques.questionDescription);
                    questionData.push({
                        quesID: ques.id,
                        sectionName: ques.sectionName,
                        subSectionName: ques.subSectionName,
                        quesNo: quesDesc.quesNo,
                        questionDescription: quesDesc.quesDescription,
                        choiceDetails: JSON.parse(ques.choiceDetails),
                        questionHelp: ques.questionHelp
                    });
                });
                return res.status(statusCodes.success).json({message: "Question Details", questionData});
            }
        }
    })
});

app.post("/edify/customer/submit-survey-answers", checkAuth, (req, res) => {
    var {customer_id, surveyAnswers, isComplete, currentQuesNumber} = req.body;

    if(!surveyAnswers || !isComplete || !currentQuesNumber) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    try {
        surveyAnswers = JSON.parse(surveyAnswers);
    } catch(err) {
        return res.status(statusCodes.invalidFormat).json({message: "Invalid JSON format"});
    }

    db.query("CALL add_survey_answers(?, ?, ?, ?)", [customer_id, surveyAnswers, currentQuesNumber, (isComplete? 1:0)],
    (err) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            return res.status(statusCodes.success).json({message: "Survey Answers Added"});
        }
    });
});

app.get("/edify/customer/get-current-answers", checkAuth, (req, res) => {
    const {customer_id} = req.body;

    db.query("CALL get_stored_answers(?)", [customer_id],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            var answers = {};
            if(result[0].length == 0) {
                result[1].forEach((answer) => {
                    answers[answer.id] = "empty";
                });
            } else {
                answers = result[0][0];
            }
            res.status(statusCodes.success).json({message: "Survey Answers", surveyAnswers: answers});
        }
    });
});

// Server Start
app.listen(port, () => console.log(`Server listening on http://localhost:${port}/`));

setInterval(() => {
    db.query("CALL delete_expired_OTPs()");
}, 1000);