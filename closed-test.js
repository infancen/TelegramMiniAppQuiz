function loadClosedTestQuestions() {
    questionsDiv.innerHTML = '';
    showClosedTestQuestion(currentQuestionIndex);
}

function showClosedTestQuestion(index) {
    questionsDiv.innerHTML = '';
    const question = quizData[index];

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
            showClosedTestQuestion(currentQuestionIndex);
        });
        questionsDiv.appendChild(nextButton);
    } else {
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
            showResults();
        });
        questionsDiv.appendChild(finishButton);
    }
}

closedTestButton.addEventListener('click', () => {
    startQuiz('closed');
});