function loadOpenTestQuestions() {
    questionsDiv.innerHTML = '';
    showOpenTestQuestion(currentQuestionIndex);
}

function showOpenTestQuestion(index) {
    questionsDiv.innerHTML = '';
    const question = quizData[index];

    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
        <p><strong>Вопрос ${index + 1}:</strong> ${escapeHtml(question.question)}</p>
        <input type="text" id="answer${index}" placeholder="Введите ваш ответ">
    `;
    questionsDiv.appendChild(questionDiv);

    if (index < quizData.length - 1) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Следующий вопрос';
        nextButton.addEventListener('click', () => {
            const userAnswer = document.getElementById(`answer${index}`).value.trim().toLowerCase();
            const correctAnswer = quizData[index].answer.toLowerCase();
            if (userAnswer === correctAnswer) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
            showFeedback(userAnswer === correctAnswer, userAnswer, correctAnswer);
            currentQuestionIndex++;
            showOpenTestQuestion(currentQuestionIndex);
        });
        questionsDiv.appendChild(nextButton);
    } else {
        const finishButton = document.createElement('button');
        finishButton.textContent = 'Завершить тест';
        finishButton.addEventListener('click', () => {
            const userAnswer = document.getElementById(`answer${index}`).value.trim().toLowerCase();
            const correctAnswer = quizData[index].answer.toLowerCase();
            if (userAnswer === correctAnswer) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
            showFeedback(userAnswer === correctAnswer, userAnswer, correctAnswer);
            showResults();
        });
        questionsDiv.appendChild(finishButton);
    }
}

openTestButton.addEventListener('click', () => {
    startQuiz('open');
});