const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const getQuestionsBySectionAndSubsection = async (req, res) => {
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
}

module.exports = getQuestionsBySectionAndSubsection;