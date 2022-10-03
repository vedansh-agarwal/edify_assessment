const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const getQuestion = async (req, res) => {
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
}

module.exports = getQuestion;