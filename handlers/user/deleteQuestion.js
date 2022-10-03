const db = require("../../db/dbConnect");
const {statusCodes} = require("../statusCodes.json");

const deleteQuestion = async (req, res) => {
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
}

module.exports = deleteQuestion;