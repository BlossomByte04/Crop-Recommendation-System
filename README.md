# SmartCrop AI

An advanced, full-stack AI agriculture application for Karnataka farmers, integrating crop recommendations, OCR soil health card parsing, farming task planning, and a multilingual AI assistant.

## Features
- **Soil Health Card Reader**: Extracts N, P, K, pH using EasyOCR.
- **Crop Recommendation Engine**: Recommends the optimal crop using a Random Forest model trained on Karnataka Kharif data.
- **Task Planner**: Generates a complete farming timeline with tasks, windows, and costs from the dataset.
- **Weather Dashboard**: Uses Open-Meteo API based on geolocation.
- **Multilingual AI Chatbot**: Powered by Google Gemini with Voice (Speech-to-Text) capabilities.

## Architecture
- **Frontend**: Next.js, TailwindCSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI
- **Machine Learning**: Scikit-Learn (RandomForest)

---

## Local Setup

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the training script once to generate the ML model
python train_model.py

# Start the server
uvicorn main:app --reload --port 8000
```
*Note: Make sure to add your GEMINI_API_KEY in `backend/.env` for the chatbot to work.*

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Deployment Guide

### Deploying the Frontend (Vercel)
1. Push the repository to GitHub.
2. Link the repository to [Vercel](https://vercel.com/new).
3. Set the Root Directory to `frontend`.
4. Deploy!

### Deploying the Backend (Render)
1. Link the repository to [Render](https://dashboard.render.com).
2. Create a new "Web Service".
3. Set Root Directory to `backend`.
4. Build Command: `pip install -r requirements.txt && python train_model.py`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add the `GEMINI_API_KEY` Environment Variable.
7. Deploy!
