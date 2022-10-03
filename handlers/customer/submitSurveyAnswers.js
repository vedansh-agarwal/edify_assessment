const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");
const generateResult = require("../../utils/generateResult");

const submitSurveyAnswers = async (req, res) => {
    var {customer_id, surveyAnswers, isComplete, currentQuesNumber, currentSection} = req.body;

    if(!surveyAnswers || isComplete === undefined || !currentQuesNumber || !currentSection) {
        return res.status(statusCodes.insufficientData).json({message: "Insufficient Data Provided"});
    }

    var dbSurveyAnswers;
    try {
        dbSurveyAnswers = JSON.stringify(surveyAnswers);
    } catch(err) {
        return res.status(statusCodes.invalidFormat).json({message: "Invalid JSON format"});
    }

    db.query("CALL add_survey_answer(?, ?, ?, ?, ?)", [customer_id, dbSurveyAnswers, currentQuesNumber, currentSection, (isComplete? 1:0)],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            var surveyResults = isComplete? generateResult(surveyAnswers, result[0], result[1]): undefined;
            return res.status(statusCodes.success).json({message: "Survey Answers Added", surveyResults});
        }
    });
}

module.exports = submitSurveyAnswers;