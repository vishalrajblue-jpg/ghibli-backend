# Ghibli-backend (Node.js) - Ready to deploy to Render

This project provides a simple Express backend with one endpoint to convert an uploaded image
into a Ghibli-style image using the Replicate Predictions API.

## Files
- index.js           -> Express server & route mount
- routes/imageRoutes.js -> Image upload, call Replicate, poll prediction, return result
- package.json
- .env.example

## Quickstart (local)
1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and set:
   REPLICATE_API_TOKEN=your_replicate_token_here
   REPLICATE_MODEL_VERSION=the_model_version_id_from_replicate
   PORT=5000
3. Start:
   npm start
4. POST /api/convert
   - Form field name: `image`
   - Response: JSON { image_url: "<generated image url>", suggestions: [...] }

## Deploy to Render
- Push this repo to GitHub.
- On Render, create a **Web Service** from the GitHub repo.
- Build Command: npm install
- Start Command: npm start
- Add environment variables on Render dashboard: REPLICATE_API_TOKEN, REPLICATE_MODEL_VERSION

## Notes
- Use a Replicate model that supports image-to-image or img2img. Copy the *Version* id from the model page.
- Consider generating low-res previews first to save cost, then high-res on purchase.
