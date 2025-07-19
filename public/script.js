const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const fileInput = document.getElementById("file-input");
const chatBox = document.getElementById("chat-box");
const buttons = document.querySelectorAll(".input-selector button");

let currentMode = "text";

// Handle mode switching
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.type;

    if (currentMode === "text") {
      input.style.display = "block";
      fileInput.style.display = "none";
      input.required = true;
    } else {
      input.style.display = "none";
      fileInput.style.display = "block";
      input.required = false;
    }
  });
});

// Form submit handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userText = input.value.trim();
  const file = fileInput.files[0];

  if (currentMode === "text" && !userText) return;
  if (currentMode !== "text" && !file) return;

  appendMessage(
    "user",
    currentMode === "text" ? userText : `[Uploaded ${currentMode}]`
  );
  appendMessage("bot", "Gemini is thinking...");

  try {
    let responseData;

    if (currentMode === "text") {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      responseData = await response.json();
    } else {
      const formData = new FormData();
      formData.append(currentMode, file);

      const endpoint = {
        image: "/generate-from-image",
        audio: "/generate-from-audio",
        document: "/generate-from-document",
      }[currentMode];

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      responseData = await response.json();
    }

    updateLastBotMessage(
      responseData.output || responseData.reply || "No response"
    );
  } catch (error) {
    updateLastBotMessage("Error: " + error.message);
  }

  input.value = "";
  fileInput.value = "";
});

// Menambahkan pesan ke chat box
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Update balasan terakhir dari bot
function updateLastBotMessage(text) {
  const botMessages = document.querySelectorAll(".message.bot");
  const lastBotMsg = botMessages[botMessages.length - 1];
  if (lastBotMsg) lastBotMsg.textContent = text;
}
