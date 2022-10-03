const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const getCurrentAnswers = async (req, res) => {
    const {customer_id} = req.body;

    db.query("CALL get_stored_answers(?)", [customer_id],
    (err, result) => {
        if(err) {
            console.log(err);
            return res.status(statusCodes.databaseError).json({message: "Database Error", errMsg: err.message});
        } else {
            var surveyAnswers = {}, currentQuestion, currentSection;
            if(result[0] && result[0][0]) {
                var surveyAnswers = JSON.parse(result[0][0].surveyAnswers);
                var currentQuestion = result[0][0].currentQuestion;
                var currentSection = result[0][0].currentSection;
            }
            if(result[0].length == 0) {
                currentQuestion = currentQuestion || 1;
                currentSection = currentSection || "basic details";
                result[1].forEach((answer) => {
                    surveyAnswers[answer.id] = "empty";
                });
            } else {
                answers = result[0][0];
            }
            return res.status(statusCodes.success).json({message: "Survey Answers", surveyAnswers, currentQuestion, currentSection});
        }
    });
}

module.exports = getCurrentAnswers;