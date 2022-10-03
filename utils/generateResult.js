const generateResult = (surveyAnswers, odmQuestions, fmQuestions) => {
    var odmScore = 0, fmScore = 0;
    for(var i = 0; i < odmQuestions.length; i++) {
        var choice = JSON.parse(odmQuestions[i].choiceDetails);
        var choiceObj = {};
        for(var j = 0; j < choice.length; j++) {
            choiceObj[choice[j].key] = choice[j].rank;
        }
        var selectedChoice = surveyAnswers[odmQuestions[i].id];
        if(selectedChoice) {
            var additive = choiceObj[selectedChoice] || "0";
            odmScore += parseInt(additive);
        }
    }

    for(var i = 0; i < fmQuestions.length; i++) {
        var choice = JSON.parse(fmQuestions[i].choiceDetails);
        var choiceObj = {};
        for(var j = 0; j < choice.length; j++) {
            choiceObj[choice[j].key] = choice[j].rank;
        }
        var selectedChoice = surveyAnswers[fmQuestions[i].id];
        if(selectedChoice) {
            var additive = choiceObj[selectedChoice] || "0";
            fmScore += parseInt(additive);
        }
    }
    return {odmScore: odmScore, fmScore: fmScore};
}

module.exports = generateResult;