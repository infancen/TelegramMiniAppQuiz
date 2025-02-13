let data;
let currentTest = "";
let selectedCategories = [];
let direction = "jp-ru";
let mode = "closed";
let questions = [];
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
    
    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("testContainer").style.display = "block";
    correctCount = 0;
    incorrectCount = 0;
    loadQuestion();
}

function loadQuestion() {
    const question = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById("question").textContent = direction === "jp-ru" ? question.jp : question.ru;
    
    if (mode === "closed") {
        let options = data[currentTest].filter(q => q !== question && q.categories.some(cat => question.categories.includes(cat)));
        options = shuffle(options).slice(0, 3);
        options.push(question);
        options = shuffle(options);

        document.getElementById("options").innerHTML = options.map(q => `<button onclick="checkAnswer('${q.ru}')">${q.ru}</button>`).join('');
        document.getElementById("answerInput").style.display = "none";
        document.getElementById("submitAnswer").style.display = "none";
    } else {
        document.getElementById("options").innerHTML = "";
        document.getElementById("answerInput").style.display = "block";
        document.getElementById("submitAnswer").style.display = "block";
        document.getElementById("submitAnswer").onclick = () => checkAnswer(document.getElementById("answerInput").value);
    }
}

function checkAnswer(answer) {
    const questionElement = document.getElementById("question");
    const question = questions.find(q => q.jp === questionElement.textContent || q.ru === questionElement.textContent);
    const correctAnswer = direction === "jp-ru" ? question.ru : question.jp;
    
    if (answer.trim() === correctAnswer) {
        correctCount++;
        document.getElementById("status").textContent = "Правильно!";
    } else {
        incorrectCount++;
        document.getElementById("status").textContent = `Неправильно. Правильный ответ: ${correctAnswer}`;
    }
    
    setTimeout(loadQuestion, 1000);
}

function endTest() {
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
