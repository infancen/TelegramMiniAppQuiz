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
    return data[currentTest];
}

function getCurrentEntry() {
    return getCurrentDictionaryData().findIndex(q => Object.values(q).includes(question));
}

function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = ""; // Очищаем список
    
    if (currentTest && data[currentTest]) {
        const allCategories = new Set();
        
        // Добавляем вариант "Все звуки" или "Все цифры" первым элементом
        const allOption = testConfig[currentTest].allOption;
        categorySelect.innerHTML += `<option value="${allOption}">${allOption}</option>`;
        
        // Собираем остальные категории
        data[currentTest].forEach(entry => {
            if (entry.categories) {
                entry.categories.forEach(cat => allCategories.add(cat));
            }
        });
        
        // Добавляем остальные категории в список
        categorySelect.innerHTML += Array.from(allCategories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
        // Выбираем первую категорию автоматически
        if (categorySelect.options.length > 0) {
            categorySelect.options[0].selected = true;
        }
    }
}

function populateDirectionRadioGroup() {
    const directionRadioGroup = document.getElementById("directionRadioGroup");
    directionRadioGroup.innerHTML = ""; // Очищаем группу

    // Получаем поля для вопросов и ответов из конфигурации
    const questionFields = testConfig[currentTest].questionFields;
    const answerFields = testConfig[currentTest].answerFields;
    const fieldLabels = testConfig[currentTest].fieldLabels; // Маппинг полей

    // Создаём направления на основе полей
    const directions = [];
    questionFields.forEach((qField, index) => {
        const aField = answerFields[index];
        directions.push({
            value: `${qField}-${aField}`,
            label: `${fieldLabels[qField]} → ${fieldLabels[aField]}` // Используем понятные названия
        });
    });

    // Добавляем радио-кнопки в группу
    directions.forEach(dir => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "direction";
        input.value = dir.value;
        if (dir.value === directions[0].value) input.checked = true; // По умолчанию выбран первый вариант
        label.appendChild(input);
        label.appendChild(document.createTextNode(dir.label));
        directionRadioGroup.appendChild(label);
    });
}

function populateModeRadioGroup() {
    const modeRadioGroup = document.getElementById("modeRadioGroup");
    modeRadioGroup.innerHTML = ""; // Очищаем группу

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
        if (mode === "closed") input.checked = true; // По умолчанию выбран первый вариант
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

    // Получаем выбранные форматы
    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;
    direction = `${fromFormat}-${toFormat}`; // Формируем направление

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

        // Получаем выбранный формат "из"
        const fromFormat = document.getElementById("fromFormat").value;

        // Формируем вопрос на основе выбранного формата
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
    fromFormat.innerHTML = ""; // Очищаем списки
    toFormat.innerHTML = "";

    // Получаем поля для вопросов и ответов из конфигурации
    const questionFields = testConfig[currentTest].questionFields;
    const fieldLabels = testConfig[currentTest].fieldLabels; // Маппинг полей

    // Заполняем списки
    questionFields.forEach(field => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = fieldLabels[field];
        fromFormat.appendChild(option.cloneNode(true)); // Клонируем для второго списка
        toFormat.appendChild(option);
    });

    // Устанавливаем начальные значения
    fromFormat.value = questionFields[0];
    toFormat.value = questionFields[1];

    // Добавляем обработчики событий для автоматического изменения значений
    fromFormat.addEventListener("change", () => adjustToFormat());
    toFormat.addEventListener("change", () => adjustFromFormat());
}

// Функция для автоматической подмены значения в списке "в"
function adjustToFormat() {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");

    if (fromFormat.value === toFormat.value) {
        // Если значения совпадают, выбираем следующее доступное значение
        const availableOptions = Array.from(toFormat.options).map(opt => opt.value);
        const nextOption = availableOptions.find(opt => opt !== fromFormat.value);
        toFormat.value = nextOption;
    }
}

// Функция для автоматической подмены значения в списке "из"
function adjustFromFormat() {
    const fromFormat = document.getElementById("fromFormat");
    const toFormat = document.getElementById("toFormat");

    if (fromFormat.value === toFormat.value) {
        // Если значения совпадают, выбираем следующее доступное значение
        const availableOptions = Array.from(fromFormat.options).map(opt => opt.value);
        const nextOption = availableOptions.find(opt => opt !== toFormat.value);
        fromFormat.value = nextOption;
    }
}

// Функция для проверки совпадений форматов
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

    // Получаем выбранные форматы "из" и "в"
    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;

    // Получаем все возможные ответы
    let allAnswers;
    if (selectedCategories.includes(testConfig[currentTest].allOption)) {
        // Если выбрана категория "Все звуки" или "Все цифры", берем все ответы из словаря
        allAnswers = getCurrentDictionaryData().map(q => q[toFormat]); // Используем toFormat для ответов
    } else {
        // Иначе фильтруем ответы по выбранным категориям
        allAnswers = getCurrentDictionaryData()
            .filter(q => q.categories.some(c => selectedCategories.includes(c)))
            .map(q => q[toFormat]); // Используем toFormat для ответов
    }

    // Убираем дубликаты и перемешиваем
    let uniqueAnswers = [...new Set(allAnswers)];
    let correctAnswer = question[toFormat]; // Правильный ответ

    // Генерируем варианты ответов
    let options = uniqueAnswers.sort(() => Math.random() - 0.5).slice(0, 4);
    if (!options.includes(correctAnswer)) {
        options[Math.floor(Math.random() * options.length)] = correctAnswer;
    }

    // Создаём кнопки с вариантами ответов
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

    // Получаем выбранные форматы "из" и "в"
    const fromFormat = document.getElementById("fromFormat").value;
    const toFormat = document.getElementById("toFormat").value;

    // Находим текущий вопрос в данных
    const questionIndex = getCurrentDictionaryData().findIndex(q => q[fromFormat] === questionText);
    if (questionIndex === -1) {
        console.error("Вопрос не найден в данных.");
        return;
    }

    const question = getCurrentDictionaryData()[questionIndex];
    const correctAnswer = question[toFormat].toLowerCase(); // Правильный ответ
    const userAnswer = answer.trim().toLowerCase(); // Ответ пользователя

    const optionButtons = document.querySelectorAll("#answerOptions button");
    const answerInput = document.getElementById("answerInput");

    if (mode === "closed") {
        optionButtons.forEach(button => {
            if (button.textContent.toLowerCase() === correctAnswer) {
                button.style.backgroundColor = "rgba(255, 255, 128, .5)"; // Подсветить правильный ответ
            }
            if (button.textContent.toLowerCase() === userAnswer) {
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
        if (userAnswer === correctAnswer) {
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
    questions = filterQuestions(getCurrentDictionaryData(), selectedCategories, currentTest);
}

document.getElementById("submitAnswer").addEventListener("click", () => {
    checkAnswer(document.getElementById("answerInput").value);
});

// Функция для завершения теста и возврата в настройки
document.getElementById("endTest").addEventListener("click", function() {
    // Скрываем контейнер теста
    document.getElementById("testContainer").style.display = "none";
    // Показываем настройки теста
    document.getElementById("setupScreen").style.display = "block";
});

// Функция для выхода ко всем тестам
function exitToTestSelection() {
    // Скрываем настройки теста
    document.getElementById("setupScreen").style.display = "none";
    // Показываем выбор теста
    document.getElementById("testSelection").style.display = "block";
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