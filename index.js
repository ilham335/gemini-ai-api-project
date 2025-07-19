const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

//? Setup Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//? Gemini Setup 
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    maxOutputTokens: 50,
    temperature: 0.7,
    topP: 0.8,
  },
});

const upload = multer({ dest: "uploads/" });

app.listen(PORT, () => {
  console.log(
    `Server Gemini API server is running on http://localhost:${PORT}`
  );
});

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    res.json({ output: response.text() });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

//! "VERSI HACKTIV"
// const imageGenerativePart = (filePath, mimeType) => ({
//     inlineData: {
//         data: fs.readFileSync(filePath).toString('base64'), // Read the file and convert it to base64,
//         mimeType: mimeType // Set the MIME type of the file
//     }
// })

// app.post('/generate-from-image', upload.single('image'), async (req, res) => {
//   const prompt = req.body.prompt || 'Describe the image';
//   const image = imageToGenerativePart(req.file.path);

//   try {
//     const result = await model.generateContent([prompt, image]);
//     const response = result.response;
//     res.json({ output: response.text() });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     fs.unlinkSync(req.file.path);
//   }
// });

//? VERSI DISKUSIKU DENGAN EMBAH SEPUH
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  function imageToGenerativePart(filePath, mimeType = "image/png") {
    const buffer = fs.readFileSync(filePath);
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  }
  const prompt = req.body.prompt || "Jelaskan gambar ini";
  const image = imageToGenerativePart(req.file.path, req.file.mimetype);
  try {
    const result = await model.generateContent([prompt, image]);
    const response = result.response;
    res.json({ output: response.text() });
  } catch (error) {
    console.error("Error generating from image:", error);
    res.status(500).json({ error: "Failed to generate from image" });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString("base64");
    const mimeType = req.file.mimetype;

    try {
      const documentPart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };
      const result = await model.generateContent([
        "Analyze this document:",
        documentPart,
      ]);
      const response =  result.response;
      res.json({ output: response.text() });
    } catch (error) {
      console.error("Error generating from document:", error);
      res.status(500).json({ error: "Failed to generate from document" });
    } finally {
      fs.unlinkSync(filePath);
    }
  }
);

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const audioBuffer = fs.readFileSync(req.file.path);
  const base64Audio = audioBuffer.toString("base64");
  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: req.file.mimetype,
    },
  };
  try {
    const result = await model.generateContent([
      "Transkib atau analisis audio ini:",
      audioPart,
    ]);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (error) {
    console.error("Error generating from audio:", error);
    res.status(500).json({ error: "Failed to generate from audio" });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

// Route penting!
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "Message is required." });
  }

  try {
    const result = await model.generateContent(userMessage);
    const response = result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong." });
  }
});
