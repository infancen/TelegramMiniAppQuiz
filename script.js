const quizData = [
    {
        question: "Какой язык программирования используется для веб-разработки?",
        options: ["Java", "Python", "JavaScript", "C++"],
        answer: "JavaScript"
    },
    {
        question: "Какой тег используется для создания ссылки в HTML?",
        options: ["<a>", "<link>", "<href>", "<url>"],
        answer: "<a>"
    },
    {
        question: "Какой фреймворк используется для создания пользовательских интерфейсов?",
        options: ["Django", "Flask", "React", "Express"],
        answer: "React"
    }
];

let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let lastAnswer = null; // Храним последний ответ

const openTestButton = document.getElementById('open-test');
const closedTestButton = document.getElementById('closed-test');
const quizContainer = document.getElementById('quiz-container');
const questionsDiv = document.getElementById('questions');
const submitButton = document.getElementById('submit');
const resultsDiv = document.getElementById('results');
const scoreDisplay = document.getElementById('score');
const restartButton = document.getElementById('restart');
const feedbackDiv = document.getElementById('feedback');

openTestButton.addEventListener('click', () => {
    startQuiz('open');
});

closedTestButton.addEventListener('click', () => {
    startQuiz('closed');
});

function startQuiz(type) {
    document.querySelector('.container').classList.add('hidden'); // Скрываем контейнер с кнопками
    quizContainer.classList.remove('hidden'); // Показываем контейнер с вопросами
    document.getElementById('quiz-title').textContent = type === 'open' ? 'Открытый тест' : 'Закрытый тест';
    loadQuestions(type);
}

function loadQuestions(type) {
    questionsDiv.innerHTML = '';
    if (type === 'open') {
        quizData.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.innerHTML = `
                <p><strong>Вопрос ${index + 1}:</strong> ${escapeHtml(question.question)}</p>
                <input type="text" id="answer${index}" placeholder="Введите ваш ответ">
            `;
            questionsDiv.appendChild(questionDiv);
        });
    } else {
        showQuestion(currentQuestionIndex); // Показываем первый вопрос для закрытого теста
    }
}

function showQuestion(index) {
    questionsDiv.innerHTML = ''; // Очищаем контейнер с вопросами
    const question = quizData[index]; // Получаем текущий вопрос

    // Создаем HTML для вопроса
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
        <p><strong>Вопрос ${index + 1}:</strong> ${escapeHtml(question.question)}</p>
        ${question.options.map((option, i) => `
            <label>
                <input type="radio" name="question${index}" value="${escapeHtml(option)}">
                ${escapeHtml(option)}
            </label><br>
        `).join('')}
    `;
    questionsDiv.appendChild(questionDiv);

    // Добавляем кнопку "Следующий вопрос", если это не последний вопрос
    if (index < quizData.length - 1) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Следующий вопрос';
        nextButton.addEventListener('click', () => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            if (selectedOption) {
                const isCorrect = selectedOption.value === quizData[index].answer;
                if (isCorrect) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
                showFeedback(isCorrect, selectedOption.value, quizData[index].answer);
            } else {
                incorrectAnswers++;
                showFeedback(false, null, quizData[index].answer);
            }
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex); // Показываем следующий вопрос
        });
        questionsDiv.appendChild(nextButton);
    } else {
        // Если это последний вопрос, показываем кнопку "Завершить тест"
        const finishButton = document.createElement('button');
        finishButton.textContent = 'Завершить тест';
        finishButton.addEventListener('click', () => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            if (selectedOption) {
                const isCorrect = selectedOption.value === quizData[index].answer;
                if (isCorrect) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
                showFeedback(isCorrect, selectedOption.value, quizData[index].answer);
            } else {
                incorrectAnswers++;
                showFeedback(false, null, quizData[index].answer);
            }
            showResults(); // Показываем результаты
        });
        questionsDiv.appendChild(finishButton);
    }
}

function showFeedback(isCorrect, userAnswer, correctAnswer) {
    feedbackDiv.classList.remove('hidden');
    feedbackDiv.classList.remove('correct', 'incorrect');
    feedbackDiv.classList.add(isCorrect ? 'correct' : 'incorrect');

    // Сохраняем последний ответ
    lastAnswer = {
        isCorrect,
        userAnswer,
        correctAnswer
    };

    if (isCorrect) {
        feedbackDiv.innerHTML = `
            <p>✅ Ваш ответ: <strong>${userAnswer}</strong> (правильно)</p>
            <p>Правильных ответов: ${correctAnswers}</p>
            <p>Неправильных ответов: ${incorrectAnswers}</p>
        `;
    } else {
        feedbackDiv.innerHTML = `
            <p>❌ Ваш ответ: <strong>${userAnswer || '—'}</strong> (неправильно)</p>
            <p>Правильный ответ: <strong>${correctAnswer}</strong></p>
            <p>Правильных ответов: ${correctAnswers}</p>
            <p>Неправильных ответов: ${incorrectAnswers}</p>
        `;
    }
}

function showResults() {
    quizContainer.classList.add('hidden'); // Скрываем контейнер с вопросами
    resultsDiv.classList.remove('hidden'); // Показываем контейнер с результатами

    // Отображаем последний ответ
    let lastAnswerHtml = '';
    if (lastAnswer) {
        if (lastAnswer.isCorrect) {
            lastAnswerHtml = `
                <p>✅ Последний ответ: <strong>${lastAnswer.userAnswer}</strong> (правильно)</p>
            `;
        } else {
            lastAnswerHtml = `
                <p>❌ Последний ответ: <strong>${lastAnswer.userAnswer || '—'}</strong> (неправильно)</p>
                <p>Правильный ответ: <strong>${lastAnswer.correctAnswer}</strong></p>
            `;
        }
    }

    scoreDisplay.innerHTML = `
        ${lastAnswerHtml}
        <p>Правильных ответов: ${correctAnswers}</p>
        <p>Неправильных ответов: ${incorrectAnswers}</p>
    `;
}

restartButton.addEventListener('click', () => {
    resultsDiv.classList.add('hidden'); // Скрываем контейнер с результатами
    document.querySelector('.container').classList.remove('hidden'); // Показываем контейнер с кнопками
    correctAnswers = 0; // Сбрасываем счётчик правильных ответов
    incorrectAnswers = 0; // Сбрасываем счётчик неправильных ответов
    currentQuestionIndex = 0; // Сбрасываем индекс текущего вопроса
    feedbackDiv.classList.add('hidden'); // Скрываем блок с результатом
    lastAnswer = null; // Сбрасываем последний ответ
});

function escapeHtml(unsafe) {
    return unsafe.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}