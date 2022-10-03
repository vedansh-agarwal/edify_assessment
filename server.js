// .env configuration
const dotenv = require("dotenv");
dotenv.config();

// Database Connection
const db = require("./db/dbConnect");

// Express Configuration
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

// Middleware Imports
const checkAuth = require("./handlers/middlewares/checkAuth");
const checkRefresh = require("./handlers/middlewares/checkRefresh");

// Route Handlers
const generateAccessToken = require("./handlers/customer/generateAccessToken");
const enterEmail = require("./handlers/customer/enterEmail");
const verifyOtp = require("./handlers/customer/verifyOtp");
const getDetails = require("./handlers/customer/getDetails");
const enterDetails = require("./handlers/customer/enterDetails");
const updateDetails = require("./handlers/customer/updateDetails");
const addQuestion = require("./handlers/user/addQuestion");
const getQuestion = require("./handlers/user/getQuestion");
const updateQuestion = require("./handlers/user/updateQuestion");
const deleteQuestion = require("./handlers/user/deleteQuestion");
const getQuestionsBySectionName = require("./handlers/customer/getQuestionsBySectionName");
const getQuestionsBySectionAndSubsection = require("./handlers/customer/getQuestionsBySectionAndSubsection");
const getAllQuestions = require("./handlers/customer/getAllQuestions");
const getODMQuestions = require("./handlers/customer/getODMQuestions");
const getFMQuestions = require("./handlers/customer/getFMQuestions");
const submitSurveyAnswers = require("./handlers/customer/submitSurveyAnswers");
const getCurrentAnswers = require("./handlers/customer/getCurrentAnswers");

// Routes
app.get("/edify/customer/generate-access-token", checkRefresh, generateAccessToken);

app.post("/edify/customer/enter-email", enterEmail);

app.post("/edify/customer/verify-otp", verifyOtp);

app.get("/edify/customer/get-details", checkAuth, getDetails);

app.post("/edify/customer/enter-details", checkAuth, enterDetails);

app.patch("/edify/customer/update-details", checkAuth, updateDetails);

app.post("/edify/user/add-question", addQuestion);

app.get("/edify/user/get-question/:ques_id", getQuestion);

app.patch("/edify/user/update-question/:ques_id", updateQuestion);

app.delete("/edify/user/delete-question/:ques_id", deleteQuestion);

app.post("/edify/customer/get-questions-by-section-name", getQuestionsBySectionName);

app.post("/edify/customer/get-questions-by-section-and-subsection", getQuestionsBySectionAndSubsection);

app.get("/edify/customer/all-questions", getAllQuestions);

app.get("/edify/customer/get-odm-questions", getODMQuestions);

app.get("/edify/customer/get-fm-questions", getFMQuestions);

app.post("/edify/customer/submit-survey-answers", checkAuth, submitSurveyAnswers);

app.get("/edify/customer/get-current-answers", checkAuth, getCurrentAnswers);

// Server Start
app.listen(port, () => console.log(`Server listening on http://localhost:${port}/`));

setInterval(() => {
    db.query("CALL delete_expired_OTPs()");
}, 1000);