// JavaScript (script.js)
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

// Загрузка данных и категорий
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("data.json");
    data = await response.json();
});

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    const allCategories = new Set();
    
    if (currentTest && data[currentTest]) {
        data[currentTest].forEach(entry => {
            entry.categories.forEach(cat => allCategories.add(cat));
        });
    }
    
    categorySelect.innerHTML = Array.from(allCategories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
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

    questions = data[currentTest].filter(q => selectedCategories.includes("Все звуки") || q.categories.some(c => selectedCategories.includes(c)));

    if (questions.length === 0) {
        alert("Нет вопросов в выбранных категориях");
        return;
    }

    // Очистка поля ввода
    document.getElementById("answerInput").value = "";

    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("testContainer").style.display = "block";
    correctCount = 0;
    incorrectCount = 0;
    loadQuestion();
}

function loadQuestion() {
    if (questions.length === 0) {
        resetQuestions(); // Сбрасываем флаги answered
        questions = shuffle(data[currentTest].filter(q => selectedCategories.includes('Все звуки') || q.categories.some(c => selectedCategories.includes(c))));
        if (questions.length > 1 && lastQuestion) {
            questions = questions.filter(q => q !== lastQuestion);
        }
    }

    question = questions.splice(Math.floor(Math.random() * questions.length), 1)[0];
    lastQuestion = question;

    document.getElementById("question").textContent = direction === "jp-ru" ? question.jp : question.ru;

    if (mode === "closed") {
        let options = data[currentTest].filter(q => q !== question && q.categories.some(cat => question.categories.includes(cat)));
        options = shuffle(options).slice(0, 3);
        options.push(question);
        options = shuffle(options);

        document.getElementById("options").innerHTML = options.map(q => `<button onclick="checkAnswer('${direction === "jp-ru" ? q.ru : q.jp}')">${direction === "jp-ru" ? q.ru : q.jp}</button>`).join('');
        document.getElementById("answerInput").style.display = "none";
        document.getElementById("submitAnswer").style.display = "none";
    } else {
        document.getElementById("options").innerHTML = "";
        document.getElementById("answerInput").style.display = "block";
        document.getElementById("submitAnswer").style.display = "block";

        // Очистка поля ввода
        document.getElementById("answerInput").value = "";

        // Удаляем старый обработчик (если есть)
        document.getElementById("answerInput").removeEventListener("keypress", handleEnterKey);

        // Объявляем handleEnterKey как функцию
        function handleEnterKey(event) {
            if (event.key === "Enter") {
                checkAnswer(document.getElementById("answerInput").value);
            }
        }

        // Добавляем новый обработчик нажатия Enter
        document.getElementById("answerInput").addEventListener("keypress", handleEnterKey);

        // Обработчик нажатия кнопки "Ответить"
        document.getElementById("submitAnswer").onclick = () => checkAnswer(document.getElementById("answerInput").value);
    }
}

function checkAnswer(answer) {
    if (!question) {
        console.error("Ошибка: Вопрос не загружен.");
        return;
    }

    const correctAnswer = direction === "jp-ru" ? question.ru : question.jp;
    const optionButtons = document.querySelectorAll("#options button");

    if (mode === "closed") {
        optionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.style.backgroundColor = "rgba(255, 255, 128, .5)"; // Подсветить правильный ответ
            }
            if (button.textContent === answer) {
                if (answer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
                    if (!question.answered) {
                        correctCount++;
                        question.answered = true;
                    }
                    document.getElementById("status").textContent = "Правильно!";
                    document.getElementById("answerInput").style.backgroundColor = "rgba(128, 255, 128, 0.5)";
                    button.style.backgroundColor = "rgba(128, 255, 128, 0.5)"; // Зелёный
                } else {
                    if (!question.answered) {
                        incorrectCount++;
                        question.answered = true;
                    }
                    document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
                    document.getElementById("answerInput").style.backgroundColor = "rgba(255, 128, 128, 0.5)";
                    button.style.backgroundColor = "rgba(255, 128, 128, 0.5)"; // Красный
                }
            }
            button.disabled = true;
        });
    } else {
        if (answer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
            if (!question.answered) {
                correctCount++;
                question.answered = true;
            }
            document.getElementById("status").textContent = "Правильно!";
            document.getElementById("answerInput").style.backgroundColor = "rgba(128, 255, 128, 0.5)";
        } else {
            if (!question.answered) {
                incorrectCount++;
                question.answered = true;
            }
            document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
            document.getElementById("answerInput").style.backgroundColor = "rgba(255, 128, 128, 0.5)";
        }
    }

    setTimeout(() => {
        optionButtons.forEach(button => {
            button.style.backgroundColor = "";
            button.disabled = false;
        });
        document.getElementById("status").textContent = "";
        document.getElementById("answerInput").value = "";
        document.getElementById("answerInput").style.backgroundColor = "";
        loadQuestion();
    }, 1000);
}

function resetQuestions() {
    data[currentTest].forEach(q => q.answered = false);
}

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

document.getElementById("endTest").addEventListener("click", endTest);


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
