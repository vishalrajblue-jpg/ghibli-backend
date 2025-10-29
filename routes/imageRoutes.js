const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const pathLib = require('path');

const upload = multer({ dest: 'uploads/' });

function getMimeType(filepath) {
  const ext = pathLib.extname(filepath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

function fileToDataURL(filepath) {
  const buffer = fs.readFileSync(filepath);
  const mimeType = getMimeType(filepath);
  const b64 = buffer.toString('base64');
  return `data:${mimeType};base64,${b64}`;
}

async function pollPrediction(predictionUrl, headers) {
  while (true) {
    const resp = await axios.get(predictionUrl, { headers });
    const data = resp.data;
    if (data.status === 'succeeded') return data;
    if (data.status === 'failed') throw new Error(JSON.stringify(data));
    await new Promise((r) => setTimeout(r, 1500));
  }
}

router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const modelVersion = process.env.REPLICATE_MODEL_VERSION;

    if (!replicateToken || !modelVersion) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
      return res.status(500).json({ message: 'Server not configured. Set REPLICATE_API_TOKEN and REPLICATE_MODEL_VERSION in env.' });
    }

    const dataUrl = fileToDataURL(req.file.path);

    const prompt = `Convert this photo into a Studio Ghibli-inspired illustration: soft pastel colors, warm lighting, hand-drawn look, gentle film grain, richly textured background, expressive eyes, cinematic composition. Keep the subject recognizable and preserve skin tones. Do not add logos or text.`;

    // Create prediction
    const createResp = await axios.post('https://api.replicate.com/v1/predictions', {
      version: modelVersion,
      input: {
        image: dataUrl,
        prompt: prompt
      }
    }, {
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json'
      }
    });

    const prediction = createResp.data;
    const predictionUrl = `https://api.replicate.com/v1/predictions/${prediction.id}`;
    const final = await pollPrediction(predictionUrl, { 'Authorization': `Token ${replicateToken}` });

    const outputs = final.output;
    let generatedImageUrl = null;
    if (Array.isArray(outputs) && outputs.length > 0) generatedImageUrl = outputs[0];
    else if (typeof outputs === 'string') generatedImageUrl = outputs;

    // cleanup uploaded file
    try { fs.unlinkSync(req.file.path); } catch(e){}

    const suggestions = [
      { type: 'Framed Art (12x12)', productHandle: 'framed-art-12x12' },
      { type: 'Greeting Card (Pack of 5)', productHandle: 'greeting-card-pack' },
      { type: 'Custom Postcard', productHandle: 'custom-postcard' }
    ];

    return res.json({ image_url: generatedImageUrl, suggestions });
  } catch (err) {
    console.error('Error in /convert', err?.response?.data || err.message || err);
    try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(500).json({ message: 'Failed to generate image', error: String(err) });
  }
});

module.exports = router;
