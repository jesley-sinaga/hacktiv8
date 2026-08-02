import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import express from "express";
import multer from "multer";

const app = express();
const upload = multer();
const port = 3000;

const apiKey = process.env.GEMINI_API_KEY;
const model = "gemini-3.6-flash";
const ai = new GoogleGenAI({
    apiKey,
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello hacktiv8!')
})

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
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong',
    });
  }
});

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
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})