import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();
const port = 3000;

const apiKey = process.env.GEMINI_API_KEY;
const model = "gemini-3.6-flash"; // Reverted to working model
const ai = new GoogleGenAI({
    apiKey,
});

app.use(express.json());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

app.post('/api/chat', async (req, res) => {
  try {
    const {prompt} = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Something went wrong processing your request.',
    });
  }
});

// Original endpoint kept for compatibility if needed
app.post('/generate-text', async (req, res) => {
  try {
    const {prompt} = req.body;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    res.status(200).json({
      result: response.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

// Original endpoint kept for compatibility
app.post(
  '/generate-from-file',
  upload.single('upload'),
  async (req, res) => {
    try {
      const {prompt} = req.body;
      const base64File = req.file.buffer.toString('base64');

      const response = await ai.models.generateContent({
        model,
        contents: [
          {text: prompt, type: 'text'},
          {
            inlineData: {
              data: base64File,
              mimeType: req.file.mimetype,
            },
          },
        ],
      });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});



app.listen(port, () => {
  console.log(`NanyaAI app listening on port ${port}`)
})