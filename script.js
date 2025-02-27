let data;
let lastQuestion = null;
let currentTest = "";
let selectedCategories = [];
let direction = "jp-ru";
let mode = "closed";
let questions = [];
let question;
let correctCount = 0;
let incorrectCount = 0;

const testConfig = {
    hiragana: {
        getQuestion: (entry) => direction === "jp-ru" ? entry.jp : entry.ru,
        getAnswer: (entry) => direction === "jp-ru" ? entry.ru : entry.jp,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все звуки") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.jp === question || q.ru === question),
        getDictionary: () => "hiragana"
    },
    katakana: {
        getQuestion: (entry) => entry.jp,
        getAnswer: (entry) => entry.ru,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все звуки") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.jp === question || q.ru === question),
        getDictionary: () => "katakana"
    },
    numbersTranslit: {
        getQuestion: (entry) => direction === "jp-ru" ? entry.number : entry.ru_reading,
        getAnswer: (entry) => direction === "jp-ru" ? entry.ru_reading : entry.number,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.number === question || q.ru_reading === question),
        getDictionary: () => "numbers"
    },
    numbersHiragana: {
        getQuestion: (entry) => direction === "jp-ru" ? entry.number : entry.jp_reading,
        getAnswer: (entry) => direction === "jp-ru" ? entry.jp_reading : entry.number,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.number === question || q.jp_reading === question),
        getDictionary: () => "numbers"
    },
};

// Загрузка данных и категорий
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("data.json");
    data = await response.json();
});

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = "";
    
    if (currentTest && data[testConfig[currentTest].getDictionary()]) {
        const allCategories = new Set();
        data[testConfig[currentTest].getDictionary()].forEach(entry => {
            if (entry.categories) {
                entry.categories.forEach(cat => allCategories.add(cat));
            }
        });
        
        categorySelect.innerHTML = Array.from(allCategories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
}

function selectTest(testType) {
    currentTest = testType;
    document.getElementById("testSelection").style.display = "none";
    document.getElementById("setupScreen").style.display = "block";
    populateCategories();
}

function startTest() {
    selectedCategories = Array.from(document.getElementById("categorySelect").selectedOptions).map(opt => opt.value);
    direction = document.querySelector("input[name='direction']:checked").value;
    mode = document.querySelector("input[name='modeSelect']:checked").value;

    questions = testConfig[currentTest].filterQuestions(data[testConfig[currentTest].getDictionary()], selectedCategories);

    if (questions.length === 0) {
        alert("Нет вопросов в выбранных категориях");
        return;
    }

    document.getElementById("answerInput").value = "";
    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("testContainer").style.display = "block";
    document.getElementById("answerInput").style.display = mode === "open" ? "block" : "none";
    document.getElementById("submitAnswer").style.display = mode === "open" ? "block" : "none";
    correctCount = 0;
    incorrectCount = 0;
    updateScore();
    loadQuestion();
}

function loadQuestion() {
    if (questions.length === 0) {
        resetQuestions();
        questions = testConfig[currentTest].filterQuestions(data[currentTest.getDictionary()], selectedCategories);
    }

    if (questions.length > 1 && lastQuestion) {
        questions = questions.filter(q => q !== lastQuestion);
    }

    if (questions.length > 0) {
        question = questions.splice(Math.floor(Math.random() * questions.length), 1)[0];
        lastQuestion = question;

        document.getElementById("question").textContent = testConfig[currentTest].getQuestion(question);

        if (mode === "closed") {
            populateAnswerOptions();
        } else {
            document.getElementById("answerOptions").innerHTML = "";
        }
    }
}

function populateAnswerOptions() {
    const answerContainer = document.getElementById("answerOptions");
    answerContainer.innerHTML = "";
    
    let allAnswers = data[testConfig[currentTest].getDictionary()].map(entry => testConfig[currentTest].getAnswer(entry));
    let uniqueAnswers = [...new Set(allAnswers)];
    let correctAnswer = testConfig[currentTest].getAnswer(question);
    
    let options = uniqueAnswers.sort(() => Math.random() - 0.5).slice(0, 4);
    if (!options.includes(correctAnswer)) {
        options[Math.floor(Math.random() * options.length)] = correctAnswer;
    }
    
    options.forEach(option => {
        const button = document.createElement("button");
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        answerContainer.appendChild(button);
    });
}

function checkAnswer(answer) {
    const questionElement = document.getElementById("question");
    const questionText = questionElement.textContent;
    //const questionIndex = data[testConfig[currentTest].getDictionary()].findIndex(q => q.jp === questionElement.textContent || q.ru === questionElement.textContent);
    const questionIndex = testConfig[currentTest].getEntryByQuestion(data[testConfig[currentTest].getDictionary()], questionText);
    const question = data[testConfig[currentTest].getDictionary()][questionIndex];
    const correctAnswer = testConfig[currentTest].getAnswer(question);
    const optionButtons = document.querySelectorAll("#answerOptions button");

    if (mode === "closed") {
        optionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.style.backgroundColor = "rgba(255, 255, 128, .5)"; // Подсветить правильный ответ
            }
            if (button.textContent === answer) {
                if (answer.trim() === correctAnswer) {
                    correctCount++;
                    document.getElementById("status").textContent = "Правильно!";
                    button.style.backgroundColor = "rgba(128, 255, 128, 0.5)"; // Зелёный
                } else {
                    incorrectCount++;
                    document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
                    button.style.backgroundColor = "rgba(255, 128, 128, 0.5)"; // Красный
                }
            }
            button.disabled = true;
        });
    } else {
        if (answer.trim() === correctAnswer) {
            correctCount++;
            document.getElementById("status").textContent = "Правильно!";
        } else {
            incorrectCount++;
            document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
        }
    }

    updateScore();

    setTimeout(() => {
        optionButtons.forEach(button => {
            button.style.backgroundColor = "";
            button.disabled = false;
        });
        document.getElementById("status").textContent = "";
        document.getElementById("answerInput").value = "";
        loadQuestion();
    }, 1000);(() => {
        optionButtons.forEach(button => {
            button.style.backgroundColor = "";
            button.disabled = false;
        });
        loadQuestion();
    }, 1000);
}

function updateScore() {
    document.getElementById("correctCountDisplay").textContent = correctCount;
    document.getElementById("incorrectCountDisplay").textContent = incorrectCount;
}

function resetQuestions() {
    data[currentTest.getDictionary()].forEach(q => q.answered = false);
}

document.getElementById("submitAnswer").addEventListener("click", () => {
    checkAnswer(document.getElementById("answerInput").value);
});

document.getElementById("endTest").addEventListener("click", () => {
    document.getElementById("testContainer").style.display = "none";
    document.getElementById("testSelection").style.display = "block";
});


function endTest() {
    resetQuestions();
    document.getElementById("status").textContent = "";
    alert(`Тест завершён! Правильных ответов: ${correctCount}, Неправильных ответов: ${incorrectCount}`);
    document.getElementById("testContainer").style.display = "none";
    document.getElementById("testSelection").style.display = "block";
}


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



//document.getElementById("endTest").addEventListener("click", endTest);


// Автотест для проверки, что вопросы не повторяются подряд
function autoTestNoConsecutiveRepeats() {
    const iterations = 1000;
    let previousQuestion = null;
    let consecutiveRepeats = 0;

    for (let i = 0; i < iterations; i++) {
        loadQuestion();
        const currentQuestion = document.getElementById("question").textContent;
        
        if (currentQuestion === previousQuestion) {
            consecutiveRepeats++;
            console.error(`Ошибка: Вопрос повторяется подряд (${currentQuestion})`);
        }
        
        previousQuestion = currentQuestion;
    }

    if (consecutiveRepeats === 0) {
        console.log("Тест пройден: Вопросы не повторяются подряд.");
    } else {
        console.error(`Тест провален: Повторений подряд - ${consecutiveRepeats}`);
    }
};