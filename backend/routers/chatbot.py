from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load env variables BEFORE trying to use them
load_dotenv(override=True)

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using gemini-2.5-flash which is the current recommended text model
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    print("WARNING: GEMINI_API_KEY not found in environment variables. Chatbot will use fallback or fail.")

class ChatRequest(BaseModel):
    message: str
    language: str = "en-IN"  # Default English India
    context: str = ""

@router.post("/chatbot_query")
def chatbot_query(data: ChatRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env file.")
    
    # System prompt to ensure the chatbot acts as an agriculture expert
    system_prompt = (
        "You are an expert agricultural AI assistant named SmartCrop AI. "
        "You help farmers in Karnataka, India, with crop recommendations, farming plans, pest control, and weather advice. "
        "Provide clear, practical, and localized advice. "
        f"The user wants the response in this language code: {data.language}. "
        "Reply directly to their message in that exact language.\n\n"
        f"User message: {data.message}\n"
    )
    
    if data.context:
        system_prompt += f"Context about the user's farm/crop: {data.context}\n"
        
    try:
        response = model.generate_content(system_prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")
