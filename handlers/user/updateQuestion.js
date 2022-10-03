const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const updateQuestion = async (req, res) => {
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
}

module.exports = updateQuestion;