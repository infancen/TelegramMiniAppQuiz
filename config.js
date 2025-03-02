const testConfig = {
    hiragana: {
        modes: ["closed", "open"],
        questionFields: ["jp", "ru"],
        answerFields: ["ru", "jp"],
        allOption: "Все звуки",
        fieldLabels: {
            jp: "хирагана",
            ru: "кириллица"
        }
    },
    katakana: {
        modes: ["closed", "open"],
        questionFields: ["jp", "ru"],
        answerFields: ["ru", "jp"],
        allOption: "Все звуки",
        fieldLabels: {
            jp: "катакана",
            ru: "кириллица"
        }
    },
    numbers: {
        modes: ["closed", "open"],
        questionFields: ["arabic", "kanji", "jp_reading", "ru_reading"],
        answerFields: ["arabic", "kanji", "jp_reading", "ru_reading"],
        allOption: "Все цифры",
        fieldLabels: {
            arabic: "арабские цифры",
            kanji: "кандзи",
            jp_reading: "хирагана",
            ru_reading: "кириллица"
        }
    }
};

function getQuestion(entry, questionField) {
    return entry[questionField];
}

function getAnswer(entry, answerField) {
    return entry[answerField];
}

function filterQuestions(data, categories, testType) {
    const allOption = testConfig[testType].allOption;
    return data.filter(q => categories.includes(allOption) || q.categories.some(c => categories.includes(c)));
}

function getEntryByQuestion(data, question) {
    return data.findIndex(q => Object.values(q).includes(question));
}