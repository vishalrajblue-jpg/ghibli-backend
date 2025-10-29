import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import Replicate from "replicate";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const upload = multer();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ✅ Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Ghibli server up");
});

// ✅ Image generation route
app.post("/generate", upload.none(), async (req, res) => {
  const { image } = req.body;

  try {
    const output = await replicate.run("stability-ai/sdxl:latest", {
      input: { image },
    });

    res.json({ output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Ghibli backend running on port ${PORT}`));
