let questions = [];
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        console.log('Словарь с буквами загружен');
    })
    .catch(error => console.error('Ошибка при загрузке словаря:', error));

let score = { correct: 0, incorrect: 0 };
let mode = "closed";
let lastQuestionIndex = -1;
let selectedCategory = "Все звуки";
let currentQuestion = null;

function startTest() {
    selectedCategory = document.getElementById("categorySelect").value;
    mode = document.querySelector('input[name="modeSelect"]:checked').value;
    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("testContainer").style.display = "block";
    loadQuestion();
}

function endTest() {
    alert(`Тест завершён!\nПравильных ответов: ${score.correct}\nОшибок: ${score.incorrect}`);
    location.reload();
}

function getFilteredQuestions() {
    return questions.filter(q => selectedCategory === "Все звуки" || q.categories.includes(selectedCategory));
}

function getRandomQuestion() {
    let filteredQuestions = getFilteredQuestions();
    let nextQuestionIndex;
    do {
        nextQuestionIndex = Math.floor(Math.random() * filteredQuestions.length);
    } while (nextQuestionIndex === lastQuestionIndex && filteredQuestions.length > 1);
    lastQuestionIndex = nextQuestionIndex;
    return filteredQuestions[nextQuestionIndex];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestion() {
    const nextButton = document.getElementById("nextQuestion");
    nextButton.style.display = "none"; // Скрываем кнопку "Пропустить" перед загрузкой следующего вопроса

    setTimeout(() => {
        currentQuestion = getRandomQuestion();  // Сохраняем текущий вопрос
        document.getElementById("question").textContent = currentQuestion.char; // Отображаем вопрос

        const optionsContainer = document.getElementById("options");
        optionsContainer.innerHTML = "";  // Очищаем старые варианты ответов

        // В зависимости от режима показываем вариант с кнопками или поле для ввода
        if (mode === "closed") {
            let options = getFilteredQuestions().map(q => q.answer);
            options = options.filter(opt => opt !== currentQuestion.answer);  // Исключаем правильный ответ из опций
            shuffleArray(options);
            options = options.slice(0, 3);
            options.push(currentQuestion.answer);
            shuffleArray(options);

            options.forEach(option => {
                const button = document.createElement("button");
                button.textContent = option;
                button.onclick = () => checkAnswer(option);  // Проверка ответа по кнопке
                optionsContainer.appendChild(button);
            });
        } else {
            document.getElementById("answerInput").style.display = "block"; // Показываем поле для ввода
            document.getElementById("submitAnswer").style.display = "block"; // Показываем кнопку "Ответить"
            document.getElementById("submitAnswer").onclick = () => checkAnswer(document.getElementById("answerInput").value.trim().toLowerCase()); // Проверка ответа при вводе
        }

        nextButton.style.display = "none"; // Скрываем кнопку до того, как ответ будет проверен
    }, 1000);
}

function checkAnswer(userAnswer) {
    const correctAnswer = currentQuestion.answer.trim().toLowerCase();  // Правильный ответ

    if (userAnswer === correctAnswer) {
        score.correct++;
        document.getElementById("status").textContent = `Правильный ответ: ${correctAnswer}`;
    } else {
        score.incorrect++;
        document.getElementById("status").textContent = `Неправильный ответ. Правильный: ${correctAnswer}`;
    }

    // Скрываем поле ввода и кнопку "Ответить" после того, как проверен ответ
    document.getElementById("submitAnswer").style.display = "none";
    document.getElementById("answerInput").style.display = "none";

    // Показываем кнопку "Пропустить" для перехода к следующему вопросу
    loadQuestion();
}

// Загружаем следующий вопрос при нажатии на кнопку "Пропустить"
document.getElementById("nextQuestion").addEventListener("click", () => {
    loadQuestion();
    document.getElementById("nextQuestion").style.display = "none"; // Скрываем кнопку "Пропустить" после перехода к следующему вопросу
});

// Привязываем обработчик события к кнопке завершения теста
document.getElementById("endTest").addEventListener("click", endTest);
