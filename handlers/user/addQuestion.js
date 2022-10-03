const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const addQuestion = async (req, res) => {
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
}

module.exports = addQuestion;