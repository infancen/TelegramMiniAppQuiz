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
        getDictionary: () => "hiragana",
        getAllOption: () => "Все звуки" // Добавляем метод для выбора всех вариантов
    },
    katakana: {
        getQuestion: (entry) => entry.jp,
        getAnswer: (entry) => entry.ru,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все звуки") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.jp === question || q.ru === question),
        getDictionary: () => "katakana",
        getAllOption: () => "Все звуки" // Добавляем метод для выбора всех вариантов
    },
    numbersTranslit: {
        getQuestion: (entry) => direction === "jp-ru" ? entry.number : entry.ru_reading,
        getAnswer: (entry) => direction === "jp-ru" ? entry.ru_reading : entry.number,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все цифры") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.number === question || q.ru_reading === question),
        getDictionary: () => "numbers",
        getAllOption: () => "Все цифры" // Добавляем метод для выбора всех вариантов
    },
    numbersHiragana: {
        getQuestion: (entry) => direction === "jp-ru" ? entry.number : entry.jp_reading,
        getAnswer: (entry) => direction === "jp-ru" ? entry.jp_reading : entry.number,
        filterQuestions: (data, categories) => data.filter(q => categories.includes("Все цифры") || q.categories.some(c => categories.includes(c))),
        getEntryByQuestion: (data, question) => data.findIndex(q => q.number === question || q.jp_reading === question),
        getDictionary: () => "numbers",
        getAllOption: () => "Все цифры" // Добавляем метод для выбора всех вариантов
    },
};

// Загрузка данных и категорий
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("data.json");
    data = await response.json();

    // Добавляем обработчик для input
    document.getElementById("answerInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Предотвращаем стандартное поведение

            const inputValue = document.getElementById("answerInput").value.trim();
            if (inputValue === "") {
                // Если поле ввода пустое, показываем сообщение или просто игнорируем
                alert("Поле ввода не может быть пустым!");
                return;
            }

            checkAnswer(inputValue); // Вызываем checkAnswer с текущим значением input
        }
    });

    focusOnInput();
});

function focusOnInput() {
     // Автоматически фокусируемся на поле ввода для мобильных устройств
     if (/Mobi|Android/i.test(navigator.userAgent)) {
        const answerInput = document.getElementById("answerInput");
        if (answerInput.style.display !== "none") {
            answerInput.focus(); // Фокусируемся на поле ввода
        }
    }
}

function getCurrentDictionaryData() {
    return data[testConfig[currentTest].getDictionary()];
}

function getCurrentEntry() {
    return getCurrentDictionaryData().findIndex(q => q.jp === question || q.ru === question);
}

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = ""; // Очищаем список
    
    if (currentTest && data[testConfig[currentTest].getDictionary()]) {
        const allCategories = new Set();
        
        // Добавляем вариант "Все звуки" или "Все цифры" первым элементом
        const allOption = testConfig[currentTest].getAllOption();
        categorySelect.innerHTML += `<option value="${allOption}">${allOption}</option>`;
        
        // Собираем остальные категории
        data[testConfig[currentTest].getDictionary()].forEach(entry => {
            if (entry.categories) {
                entry.categories.forEach(cat => allCategories.add(cat));
            }
        });
        
        // Добавляем остальные категории в список
        categorySelect.innerHTML += Array.from(allCategories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
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

    resetQuestions();

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
    // Если вопросы закончились, сбрасываем флаги answered и перезагружаем список
    if (questions.length === 0) {
        resetQuestions();
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
    
    let allAnswers;
    if (selectedCategories.includes(testConfig[currentTest].getAllOption())) {
        // Если выбрана категория "Все звуки" или "Все цифры", берем все ответы из словаря
        allAnswers = getCurrentDictionaryData().map(q => testConfig[currentTest].getAnswer(q));
    } else {
        // Иначе фильтруем ответы по выбранным категориям
        allAnswers = getCurrentDictionaryData()
            .filter(q => q.categories.some(c => selectedCategories.includes(c)))
            .map(q => testConfig[currentTest].getAnswer(q));
    }

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
    const questionIndex = testConfig[currentTest].getEntryByQuestion(data[testConfig[currentTest].getDictionary()], questionText);
    const question = data[testConfig[currentTest].getDictionary()][questionIndex];
    const correctAnswer = testConfig[currentTest].getAnswer(question).toLowerCase(); // Приводим к нижнему регистру
    const userAnswer = answer.trim().toLowerCase(); // Приводим к нижнему регистру
    const optionButtons = document.querySelectorAll("#answerOptions button");
    const answerInput = document.getElementById("answerInput");

    if (mode === "closed") {
        optionButtons.forEach(button => {
            if (button.textContent.toLowerCase() === correctAnswer) { // Игнорируем регистр
                button.style.backgroundColor = "rgba(255, 255, 128, .5)"; // Подсветить правильный ответ
            }
            if (button.textContent.toLowerCase() === userAnswer) { // Игнорируем регистр
                if (userAnswer === correctAnswer) {
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
        if (userAnswer === correctAnswer) { // Сравниваем с учетом нижнего регистра
            correctCount++;
            document.getElementById("status").textContent = "Правильно!";
            answerInput.style.backgroundColor = "rgba(128, 255, 128, 0.5)"; // Зелёный
        } else {
            incorrectCount++;
            document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
            answerInput.style.backgroundColor = "rgba(255, 128, 128, 0.5)"; // Красный
        }
    }

    updateScore();

    setTimeout(() => {
        // Сбрасываем стили и очищаем поле ввода
        if (mode === "closed") {
            optionButtons.forEach(button => {
                button.style.backgroundColor = "";
                button.disabled = false;
            });
        } else {
            answerInput.style.backgroundColor = ""; // Сбрасываем цвет поля ввода
            answerInput.value = ""; // Очищаем поле ввода
        }
        document.getElementById("status").textContent = "";
        loadQuestion();
    }, 1000);
}

function updateScore() {
    document.getElementById("correctCountDisplay").textContent = correctCount;
    document.getElementById("incorrectCountDisplay").textContent = incorrectCount;
}

function resetQuestions() {
    questions = testConfig[currentTest].filterQuestions(getCurrentDictionaryData(), selectedCategories);
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