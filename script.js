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

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("data.json");
    data = await response.json();

    document.getElementById("answerInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Предотвращаем стандартное поведение

            const inputValue = document.getElementById("answerInput").value.trim();
            if (inputValue === "") {
                alert("Поле ввода не может быть пустым!");
                return;
            }

            checkAnswer(inputValue);
        }
    });

    // Инициализация Telegram WebApp
    Telegram.WebApp.ready();

    focusOnInput();

    applyTelegramTheme();
});

function focusOnInput() {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        const answerInput = document.getElementById("answerInput");
        if (answerInput.style.display !== "none") {
            answerInput.focus();
        }
    }
}

function getCurrentDictionaryData() {
    return data[currentTest];
}

function getCurrentEntry() {
    return getCurrentDictionaryData().findIndex(q => Object.values(q).includes(question));
}

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = "";
    
    if (currentTest && data[currentTest]) {
        const allCategories = new Set();
        
        const allOption = testConfig[currentTest].allOption;
        categorySelect.innerHTML += `<option value="${allOption}">${allOption}</option>`;
        
        data[currentTest].forEach(entry => {
            if (entry.categories) {
                entry.categories.forEach(cat => allCategories.add(cat));
            }
        });
        
        categorySelect.innerHTML += Array.from(allCategories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
        if (categorySelect.options.length > 0) {
            categorySelect.options[0].selected = true;
        }
    }
}

function populateDirectionRadioGroup() {
    const directionRadioGroup = document.getElementById("directionRadioGroup");
    directionRadioGroup.innerHTML = "";

    const questionFields = testConfig[currentTest].questionFields;
    const answerFields = testConfig[currentTest].answerFields;
    const fieldLabels = testConfig[currentTest].fieldLabels;

    const directions = [];
    questionFields.forEach((qField, index) => {
        const aField = answerFields[index];
        directions.push({
            value: `${qField}-${aField}`,
            label: `${fieldLabels[qField]} → ${fieldLabels[aField]}`
        });
    });

    directions.forEach(dir => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "direction";
        input.value = dir.value;
        if (dir.value === directions[0].value) input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(dir.label));
        directionRadioGroup.appendChild(label);
    });
}

function populateModeRadioGroup() {
    const modeRadioGroup = document.getElementById("modeRadioGroup");
    modeRadioGroup.innerHTML = "";

    const modes = testConfig[currentTest].modes;
    const modeLabels = {
        closed: "Закрытый",
        open: "Открытый"
    };

    modes.forEach(mode => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "modeSelect";
        input.value = mode;
        if (mode === "closed") input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(modeLabels[mode]));
        modeRadioGroup.appendChild(label);
    });
}

function selectTest(testType) {
    currentTest = testType;
    document.getElementById("testSelection").style.display = "none";
    document.getElementById("setupScreen").style.display = "block";

    populateCategories();
    populateFromToFormats();
    populateModeRadioGroup();
}

function startTest() {
    if (!validateFromToFormats()) {
        return;
    }

    selectedCategories = Array.from(document.getElementById("categorySelect").selectedOptions).map(opt => opt.value);
    mode = document.querySelector("input[name='modeSelect']:checked").value;

    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;
    direction = `${fromFormat}-${toFormat}`;

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
    if (questions.length === 0) {
        resetQuestions();
    }

    if (questions.length > 1 && lastQuestion) {
        questions = questions.filter(q => q !== lastQuestion);
    }

    if (questions.length > 0) {
        question = questions.splice(Math.floor(Math.random() * questions.length), 1)[0];
        lastQuestion = question;

        const fromFormat = document.getElementById("fromFormat").value;

        document.getElementById("question").textContent = question[fromFormat];

        if (mode === "closed") {
            populateAnswerOptions();
        } else {
            document.getElementById("answerOptions").innerHTML = "";
        }
    }
}

function populateFromToFormats() {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");
    fromFormat.innerHTML = "";
    toFormat.innerHTML = "";

    const questionFields = testConfig[currentTest].questionFields;
    const fieldLabels = testConfig[currentTest].fieldLabels;

    questionFields.forEach(field => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = fieldLabels[field];
        fromFormat.appendChild(option.cloneNode(true));
        toFormat.appendChild(option);
    });

    fromFormat.value = questionFields[0];
    toFormat.value = questionFields[1];

    fromFormat.addEventListener("change", () => adjustToFormat());
    toFormat.addEventListener("change", () => adjustFromFormat());
}

function adjustToFormat() {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");

    if (fromFormat.value === toFormat.value) {
        const availableOptions = Array.from(toFormat.options).map(opt => opt.value);
        const nextOption = availableOptions.find(opt => opt !== fromFormat.value);
        toFormat.value = nextOption;
    }
}

function adjustFromFormat() {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");

    if (fromFormat.value === toFormat.value) {
        const availableOptions = Array.from(fromFormat.options).map(opt => opt.value);
        const nextOption = availableOptions.find(opt => opt !== toFormat.value);
        fromFormat.value = nextOption;
    }
}

function validateFromToFormats() {
    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;

    if (fromFormat === toFormat) {
        alert("Поля 'Из' и 'В' не должны совпадать. Пожалуйста, выберите разные форматы.");
        return false;
    }
    return true;
}

function populateAnswerOptions() {
    const answerContainer = document.getElementById("answerOptions");
    answerContainer.innerHTML = "";


    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;

    let allAnswers;
    if (selectedCategories.includes(testConfig[currentTest].allOption)) {
        allAnswers = getCurrentDictionaryData().map(q => q[toFormat]);
    } else {
        allAnswers = getCurrentDictionaryData()
            .filter(q => q.categories.some(c => selectedCategories.includes(c)))
            .map(q => q[toFormat]);
    }

    let uniqueAnswers = [...new Set(allAnswers)];
    let correctAnswer = question[toFormat];

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

    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;

    const questionIndex = getCurrentDictionaryData().findIndex(q => q[fromFormat] === questionText);
    if (questionIndex === -1) {
        console.error("Вопрос не найден в данных.");
        return;
    }

    const question = getCurrentDictionaryData()[questionIndex];
    const correctAnswer = question[toFormat].toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    const optionButtons = document.querySelectorAll("#answerOptions button");
    const answerInput = document.getElementById("answerInput");

    if (mode === "closed") {
        optionButtons.forEach(button => {
            if (button.textContent.toLowerCase() === correctAnswer) {
                button.style.backgroundColor = "rgba(255, 255, 128, .5)";
            }
            if (button.textContent.toLowerCase() === userAnswer) {
                if (userAnswer === correctAnswer) {
                    correctCount++;
                    document.getElementById("status").textContent = "Правильно!";
                    button.style.backgroundColor = "rgba(128, 255, 128, 0.5)"; 
                } else {
                    incorrectCount++;
                    document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
                    button.style.backgroundColor = "rgba(255, 128, 128, 0.5)";
                }
            }
            button.disabled = true;
        });
    } else {
        if (userAnswer === correctAnswer) {
            correctCount++;
            document.getElementById("status").textContent = "Правильно!";
            answerInput.style.backgroundColor = "rgba(128, 255, 128, 0.5)";
        } else {
            incorrectCount++;
            document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
            answerInput.style.backgroundColor = "rgba(255, 128, 128, 0.5)";
        }
    }

    updateScore();

    setTimeout(() => {
        if (mode === "closed") {
            optionButtons.forEach(button => {
                button.style.backgroundColor = "";
                button.disabled = false;
            });
        } else {
            answerInput.style.backgroundColor = "";
            answerInput.value = "";
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
    questions = filterQuestions(getCurrentDictionaryData(), selectedCategories, currentTest);
}

document.getElementById("submitAnswer").addEventListener("click", () => {
    checkAnswer(document.getElementById("answerInput").value);
});

document.getElementById("endTest").addEventListener("click", function() {
    document.getElementById("testContainer").style.display = "none";
    document.getElementById("setupScreen").style.display = "block";
    endTest();
});

function exitToTestSelection() {
    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("testSelection").style.display = "block";
}

function endTest() {
    resetQuestions();
    document.getElementById("status").textContent = "";
    const message = `Тест завершён! Правильных ответов: ${correctCount}, Неправильных ответов: ${incorrectCount}`;
    alert(message);

    // Подготавливаем данные для отправки
    const results = {
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        testType: currentTest
    };

    // Отправляем данные в бота
    Telegram.WebApp.sendData(JSON.stringify(results));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function applyTelegramTheme() {
    const tg = Telegram.WebApp;
    const theme = tg.themeParams;
    const root = document.documentElement;

    root.style.setProperty('--tg-bg-color', theme.bg_color || '#f4f4f4');
    root.style.setProperty('--tg-text-color', theme.text_color || '#000000');
    root.style.setProperty('--tg-hint-color', theme.hint_color || '#999999');
    root.style.setProperty('--tg-link-color', theme.link_color || '#267eb8');
    root.style.setProperty('--tg-button-color', theme.button_color || '#2aabee');
    root.style.setProperty('--tg-button-text-color', theme.button_text_color || '#ffffff');
    root.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color || '#ffffff');

    document.body.style.backgroundColor = theme.bg_color || '#f4f4f4';
    document.body.style.color = theme.text_color || '#000000';
}
