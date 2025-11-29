// server.js - Expert generation server (Node.js + Express)
// Minimal example: accepts image + metadata, runs optional OCR, and calls OpenAI chat completions.
// Requires: Node 18+, npm packages: express, multer, node-fetch, tesseract.js, dotenv
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import fetch from 'node-fetch';
import { createWorker } from 'tesseract.js';
import dotenv from 'dotenv';
dotenv.config();

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if(!OPENAI_KEY) console.warn('Warning: OPENAI_API_KEY not set in env');

async function runOCR(filePath){
  try{
    const worker = createWorker({ logger: m=>{} });
    await worker.load();
    await worker.loadLanguage('eng+ind');
    await worker.initialize('eng+ind');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  }catch(e){
    console.warn('OCR failed', e);
    return '';
  }
}

async function callLLM(systemPrompt, userPrompt){
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 800,
    temperature: 0.2
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await res.json();
  const text = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : (j.error?.message || '');
  return { text, raw: j };
}

app.post('/api/generate-expert', upload.single('image'), async (req, res) => {
  try{
    const meta = JSON.parse(req.body.metadata || '{}');
    const file = req.file;
    if(!file) return res.status(400).json({ error: 'image required' });

    // 1) Run OCR (best-effort)
    let ocrText = '';
    try { ocrText = await runOCR(file.path); } catch(e){ console.warn('ocr error', e); }

    // 2) (Optional) integrate vision microservice here for BLIP caption / YOLO detections
    // Placeholder: detected_objects empty array
    const detected_objects = meta.detected_objects || [];

    // 3) Compose prompts. Include legal references passed from client or fallback to defaults (ISO45001, ILO, UU Ketenagakerjaan)
    const systemPrompt = fs.readFileSync('./prompts/system_prompt.txt', 'utf8');
    const userPromptTemplate = fs.readFileSync('./prompts/user_prompt.txt', 'utf8');
    const userPrompt = userPromptTemplate
      .replace('{metadata_json}', JSON.stringify(meta, null, 2))
      .replace('{ocr_text}', ocrText || 'Tidak ada teks terdeteksi.')
      .replace('{detected_objects}', JSON.stringify(detected_objects))
      .replace('{selected_experts}', JSON.stringify(meta.selectedExperts || []));

    // 4) Call LLM
    const llm = await callLLM(systemPrompt, userPrompt);

    // remove uploaded file ASAP
    fs.unlink(file.path, ()=>{});

    return res.json({ text: llm.text, meta: { ocr: ocrText, detected_objects, llm_raw: llm.raw } });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: e.message || 'server error' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, ()=> console.log(`Expert server listening on ${port}`));
