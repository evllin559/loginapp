const lessons = {
  greetings: {
    level: "Nivel iniciante",
    title: "Cumprimentos",
    description: "Aprenda a se apresentar e iniciar conversas simples.",
    phrase: "Hello, my name is Ana.",
    translation: "Ola, meu nome e Ana.",
    phrases: [
      ["Good morning!", "Bom dia!"],
      ["How are you?", "Como voce esta?"],
      ["Nice to meet you.", "Prazer em conhecer voce."],
    ],
  },
  food: {
    level: "Nivel iniciante",
    title: "Comida",
    description: "Peca comida, agua e fale sobre suas preferencias.",
    phrase: "I would like a coffee, please.",
    translation: "Eu gostaria de um cafe, por favor.",
    phrases: [
      ["I am hungry.", "Estou com fome."],
      ["Can I have water?", "Posso tomar agua?"],
      ["The food is delicious.", "A comida esta deliciosa."],
    ],
  },
  travel: {
    level: "Nivel basico",
    title: "Viagem",
    description: "Use frases uteis em aeroporto, hotel e transporte.",
    phrase: "Where is the train station?",
    translation: "Onde fica a estacao de trem?",
    phrases: [
      ["I need a taxi.", "Eu preciso de um taxi."],
      ["How much is the ticket?", "Quanto custa o ingresso?"],
      ["I have a reservation.", "Eu tenho uma reserva."],
    ],
  },
};

const flashcards = [
  ["Good morning", "Bom dia"],
  ["Please", "Por favor"],
  ["Thank you", "Obrigado(a)"],
  ["I need help", "Eu preciso de ajuda"],
  ["See you later", "Ate mais tarde"],
];

const quiz = {
  question: 'Como dizer "Eu quero agua"?',
  options: ["I want water.", "I am water.", "I have coffee."],
  answer: "I want water.",
};

const lessonTabs = document.querySelectorAll(".lesson-tab");
const lessonLevel = document.querySelector("#lessonLevel");
const lessonTitle = document.querySelector("#lessonTitle");
const lessonDescription = document.querySelector("#lessonDescription");
const mainPhrase = document.querySelector("#mainPhrase");
const mainPhrasePt = document.querySelector("#mainPhrasePt");
const phraseList = document.querySelector("#phraseList");
const speakPhrase = document.querySelector("#speakPhrase");
const flashcard = document.querySelector("#flashcard");
const flashcardHint = document.querySelector("#flashcardHint");
const flashcardWord = document.querySelector("#flashcardWord");
const flashcardTranslation = document.querySelector("#flashcardTranslation");
const prevCard = document.querySelector("#prevCard");
const nextCard = document.querySelector("#nextCard");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");

let currentLesson = "greetings";
let currentFlashcard = 0;

function renderLesson(lessonKey) {
  const lesson = lessons[lessonKey];

  currentLesson = lessonKey;
  lessonLevel.textContent = lesson.level;
  lessonTitle.textContent = lesson.title;
  lessonDescription.textContent = lesson.description;
  mainPhrase.textContent = lesson.phrase;
  mainPhrasePt.textContent = lesson.translation;

  phraseList.innerHTML = lesson.phrases
    .map(([english, portuguese]) => `<li><strong>${english}</strong><span>${portuguese}</span></li>`)
    .join("");

  lessonTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.lesson === lessonKey);
  });
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    speakPhrase.textContent = "Audio indisponivel";
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
}

function renderFlashcard() {
  const [word, translation] = flashcards[currentFlashcard];

  flashcard.classList.remove("revealed");
  flashcardHint.textContent = "Toque para traduzir";
  flashcardWord.textContent = word;
  flashcardTranslation.textContent = translation;
}

function moveFlashcard(direction) {
  currentFlashcard =
    (currentFlashcard + direction + flashcards.length) % flashcards.length;
  renderFlashcard();
}

function renderQuiz() {
  quizQuestion.textContent = quiz.question;
  quizFeedback.textContent = "";
  quizOptions.innerHTML = "";

  quiz.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(button, option));
    quizOptions.appendChild(button);
  });
}

function checkAnswer(selectedButton, option) {
  const buttons = quizOptions.querySelectorAll("button");

  buttons.forEach((button) => {
    button.disabled = true;
    if (button.textContent === quiz.answer) {
      button.classList.add("correct");
    }
  });

  if (option === quiz.answer) {
    quizFeedback.textContent = "Muito bem! Repita a frase em voz alta.";
    quizFeedback.style.color = "var(--success)";
    speak(option);
  } else {
    selectedButton.classList.add("wrong");
    quizFeedback.textContent = `Quase! A resposta correta e: ${quiz.answer}`;
    quizFeedback.style.color = "var(--danger)";
  }

  window.setTimeout(renderQuiz, 2800);
}

lessonTabs.forEach((tab) => {
  tab.addEventListener("click", () => renderLesson(tab.dataset.lesson));
});

speakPhrase.addEventListener("click", () => speak(lessons[currentLesson].phrase));

flashcard.addEventListener("click", () => {
  const isRevealed = flashcard.classList.toggle("revealed");
  flashcardHint.textContent = isRevealed ? "Traducao" : "Toque para traduzir";
});

flashcard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    flashcard.click();
  }
});

prevCard.addEventListener("click", () => moveFlashcard(-1));
nextCard.addEventListener("click", () => moveFlashcard(1));

renderLesson(currentLesson);
renderFlashcard();
renderQuiz();
