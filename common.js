let quizData = [];

async function loadQuestions() {
    const response = await fetch('questions.json'); // Относительный путь
    quizData = await response.json();
}

loadQuestions().then(() => {
    console.log("Вопросы загружены:", quizData);
});

let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let lastAnswer = null;

const openTestButton = document.getElementById('open-test');
const closedTestButton = document.getElementById('closed-test');
const quizContainer = document.getElementById('quiz-container');
const questionsDiv = document.getElementById('questions');
const submitButton = document.getElementById('submit');
const resultsDiv = document.getElementById('results');
const scoreDisplay = document.getElementById('score');
const restartButton = document.getElementById('restart');
const feedbackDiv = document.getElementById('feedback');

function startQuiz(type) {
    document.querySelector('.container').classList.add('hidden');
    quizContainer.classList.remove('hidden');
    document.getElementById('quiz-title').textContent = type === 'open' ? 'Открытый тест' : 'Закрытый тест';
    if (type === 'open') {
        loadOpenTestQuestions();
    } else {
        loadClosedTestQuestions();
    }
}

function showFeedback(isCorrect, userAnswer, correctAnswer) {
    feedbackDiv.classList.remove('hidden');
    feedbackDiv.classList.remove('correct', 'incorrect');
    feedbackDiv.classList.add(isCorrect ? 'correct' : 'incorrect');

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
    quizContainer.classList.add('hidden');
    resultsDiv.classList.remove('hidden');

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

function restartQuiz() {
    resultsDiv.classList.add('hidden');
    document.querySelector('.container').classList.remove('hidden');
    correctAnswers = 0;
    incorrectAnswers = 0;
    currentQuestionIndex = 0;
    feedbackDiv.classList.add('hidden');
    lastAnswer = null;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

restartButton.addEventListener('click', restartQuiz);