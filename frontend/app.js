
// ========================================
// SIZU PRANAV - AI COMPANION
// Main Frontend Application
// ========================================

// IMPORTANT:
// Replace this URL after deploying your backend.
const API_URL = "YOUR_BACKEND_URL/chat";

// Elements
const character = document.getElementById("sizu");
const emotionLabel = document.getElementById("emotionLabel");
const characterMessage = document.getElementById("characterMessage");

const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const hint = document.getElementById("hint");

// State
let conversationHistory = [];
let isThinking = false;
let recognition = null;

// ========================================
// STATUS
// ========================================

function setStatus(status) {
  if (!statusText || !statusDot) return;

  statusText.textContent = status.toUpperCase();
  statusDot.className = status.toLowerCase();
}

// ========================================
// EMOTIONS
// ========================================

function setEmotion(emotion) {
  const allowedEmotions = [
    "normal",
    "happy",
    "sad",
    "angry",
    "sarcastic",
    "thinking",
    "listening"
  ];

  if (!allowedEmotions.includes(emotion)) {
    emotion = "normal";
  }

  if (character) {
    character.classList.remove(...allowedEmotions);
    character.classList.add(emotion);
  }

  if (emotionLabel) {
    emotionLabel.textContent = emotion.toUpperCase();
  }
}

// ========================================
// CHAT MESSAGE DISPLAY
// ========================================

function addMessage(sender, text) {
  const message = document.createElement("div");

  message.className =
    sender === "bot" ? "message bot" : "message user";

  const name = document.createElement("b");
  name.textContent =
    sender === "bot" ? "SIZU PRANAV" : "YOU";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  message.appendChild(name);
  message.appendChild(paragraph);

  chatMessages.appendChild(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========================================
// VOICE OUTPUT
// ========================================

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = "en-IN";
  speech.rate = 1;
  speech.pitch = 1.05;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

// ========================================
// AI CHAT
// ========================================

async function sendMessage() {
  const message = userInput.value.trim();

  if (!message || isThinking) return;

  if (API_URL === "YOUR_BACKEND_URL/chat") {
    addMessage(
      "bot",
      "My AI brain is not connected yet. Please connect my backend first."
    );
    return;
  }

  addMessage("user", message);

  userInput.value = "";

  isThinking = true;
  sendButton.disabled = true;

  setEmotion("thinking");
  setStatus("THINKING");

  if (characterMessage) {
    characterMessage.textContent = "Let me think...";
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    const reply =
      typeof data.reply === "string"
        ? data.reply
        : "I couldn't understand that.";

    const emotion = data.emotion || "normal";

    conversationHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    // Keep recent conversation only
    conversationHistory =
      conversationHistory.slice(-12);

    addMessage("bot", reply);

    setEmotion(emotion);

    if (characterMessage) {
      characterMessage.textContent = reply;
    }

    speak(reply);

    setStatus("ONLINE");

  } catch (error) {
    console.error("SIZU ERROR:", error);

    addMessage(
      "bot",
      "Sorry! I'm having trouble connecting. Please try again."
    );

    setEmotion("sad");
    setStatus("ERROR");

  } finally {
    isThinking = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// ========================================
// BUTTON EVENTS
// ========================================

sendButton.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// ========================================
// VOICE INPUT
// ========================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setEmotion("listening");
    setStatus("LISTENING");

    if (characterMessage) {
      characterMessage.textContent =
        "I'm listening to you...";
    }

    if (hint) {
      hint.textContent = "Listening...";
    }
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    userInput.value = transcript;

    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("VOICE ERROR:", event.error);

    setEmotion("normal");
    setStatus("ONLINE");

    if (hint) {
      hint.textContent =
        "Voice input failed. Please try again.";
    }
  };

  recognition.onend = () => {
    if (!isThinking) {
      setEmotion("normal");
      setStatus("ONLINE");
    }

    if (hint) {
      hint.textContent =
        "Tap the microphone and start speaking.";
    }
  };

  micButton.addEventListener("click", () => {
    if (isThinking) return;

    try {
      recognition.start();
    } catch (error) {
      console.log("Microphone is already active.");
    }
  });

} else {

  micButton.disabled = true;

  if (hint) {
    hint.textContent =
      "Voice recognition is not supported in this browser.";
  }
}

// ========================================
// INITIALIZATION
// ========================================

setEmotion("happy");
setStatus("ONLINE");

if (characterMessage) {
  characterMessage.textContent =
    "Hello! I'm Sizu Pranav. Ready to explore?";
}

console.log("Sizu Pranav initialized successfully.");
