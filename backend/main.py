from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import soil, weather, crop, planner, chatbot, feedback

app = FastAPI(title="SmartCrop AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(soil.router, prefix="/api", tags=["Soil"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(crop.router, prefix="/api", tags=["Crop Recommendation"])
app.include_router(planner.router, prefix="/api", tags=["Farming Planner"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback Data Collection"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartCrop AI API"}
