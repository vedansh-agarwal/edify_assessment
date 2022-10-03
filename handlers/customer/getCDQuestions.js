const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const getODMQuestions = async (req, res) => {
    db.query("SELECT id, sectionName, subSectionName, questionDescription, choiceDetails, questionHelp FROM questions WHERE sectionName LIKE 'Section 2%'",
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
}

module.exports = getODMQuestions;