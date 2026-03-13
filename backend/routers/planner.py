from fastapi import APIRouter
import pandas as pd
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
import google.generativeai as genai
import os

router = APIRouter()

# Load the dataset globally
try:
    df = pd.read_csv('../Karnataka_Kharif_crop_Final_Data.csv')
except Exception as e:
    df = pd.DataFrame()
    print(f"Error loading dataset in planner module: {e}")

class PlanRequest(BaseModel):
    crop: str

class RiskRequest(BaseModel):
    crop: str
    stage: str
    attribute: str
    value: float

@router.post("/generate_task_plan")
def generate_task_plan(data: PlanRequest):
    if df.empty:
        return {"error": "Dataset not loaded"}
    
    crop_df = df[df['Crop'].str.lower() == data.crop.lower()]
    if crop_df.empty:
        return {"error": "Crop not found in dataset"}
    
    # Extract unique stages sequentially
    stages = crop_df[['Stage', 'Recommended_Task_Window', 'Stage_Cost_INR_per_acre', 'Govt_Sowing_Window', 'Govt_Harvest_Window']].drop_duplicates(subset=['Stage'])
    
    plan = []
    # Using enumerate as a proxy for timeline days, but real dates are in 'Recommended_Task_Window'
    for idx, row in stages.iterrows():
        plan.append({
            "step": row['Stage'],
            "window": row['Recommended_Task_Window'],
            "cost": row['Stage_Cost_INR_per_acre'],
            "sowing": row['Govt_Sowing_Window'],
            "harvest": row['Govt_Harvest_Window']
        })
    return {"crop": data.crop, "plan": plan}

@router.post("/check_crop_risk")
def check_crop_risk(data: RiskRequest):
    if df.empty:
        return {"error": "Dataset not loaded"}
    
    # Filter by crop, stage, attribute
    cond = (df['Crop'].str.lower() == data.crop.lower()) & \
           (df['Stage'].str.lower() == data.stage.lower()) & \
           (df['Attribute'].str.lower().str.contains(data.attribute.lower()))
    
    row_df = df[cond]
    if row_df.empty:
        # Fallback to general crop + attribute if stage is not specifically outlined
        fallback_cond = (df['Crop'].str.lower() == data.crop.lower()) & \
                        (df['Attribute'].str.lower().str.contains(data.attribute.lower()))
        row_df = df[fallback_cond]
        if row_df.empty:
            return {"status": "Unknown", "message": "No thresholds defined for this"}
    
    row = row_df.iloc[0]
    val = data.value
    
    # Parsing min/max to numbers for simple categorization
    try:
        opt_min, opt_max = map(float, str(row['Optimum_Range']).replace('°C','').replace('kg/ha','').replace('mm','').replace('cm','').split('-'))
        if opt_min <= val <= opt_max:
            return {"status": "Optimum", "risk": "Low", "action": "Maintain optimal conditions"}
        elif val < opt_min:
            return {"status": "Low", "risk": row['Very_Low_Risk'], "action": row['Very_Low_Action']}
        else:
            return {"status": "High", "risk": row['Very_High_Risk'], "action": row['Very_High_Action']}
    except:
        return {"status": "Unknown", "message": "Could not parse threshold ranges"}

class FertRequest(BaseModel):
    N: float
    P: float
    K: float
    crop: str

@router.post("/recommend_fertilizer")
def recommend_fertilizer(data: FertRequest):
    """
    Looks up standard dataset nitrogen, phosphorus, potassium actions for the given crop.
    """
    recommendations = []
    
    for nutrient, val in [("Nitrogen", data.N), ("Phosphorus", data.P), ("Potassium", data.K)]:
        cond = (df['Crop'].str.lower() == data.crop.lower()) & (df['Attribute'].str.contains(nutrient))
        row_df = df[cond]
        if not row_df.empty:
            row = row_df.iloc[0]
            try:
                opt_min, opt_max = map(float, str(row['Optimum_Range']).replace('kg/ha','').split('-'))
                if val < opt_min:
                    recommendations.append({"nutrient": nutrient, "status": "Low", "action": row['Very_Low_Action']})
                elif val > opt_max:
                    recommendations.append({"nutrient": nutrient, "status": "High", "action": row['Very_High_Action']})
                else:
                    recommendations.append({"nutrient": nutrient, "status": "Optimal", "action": "None"})
            except:
                pass
                
    if not recommendations:
        # Fallback generic rules
        if data.N < 50: recommendations.append({"nutrient": "Nitrogen", "status": "Low", "action": "Apply 50kg/ha Urea"})
        if data.P < 20: recommendations.append({"nutrient": "Phosphorus", "status": "Low", "action": "Apply DAP"})
        if data.K < 30: recommendations.append({"nutrient": "Potassium", "status": "Low", "action": "Apply MOP"})
        
    return {"crop": data.crop, "recommendations": recommendations}


class DailyFeedback(BaseModel):
    date: str
    rating: int  # 1-5
    comments: str

class WorksheetRequest(BaseModel):
    crop: str
    start_date: str  # YYYY-MM-DD
    district: str
    latitude: float
    longitude: float
    language: str = "English"
    day_number: Optional[int] = None
    feedback_history: List[DailyFeedback] = []

@router.post("/generate_daily_worksheet")
def generate_daily_worksheet(data: WorksheetRequest):
    if df.empty:
        return {"error": "Dataset not loaded"}
    
    # 1. Calculate elapsed days
    elapsed_days: int = 0
    if data.day_number is not None:
        elapsed_days = data.day_number
    else:
        try:
            start = datetime.strptime(data.start_date, "%Y-%m-%d")
            today = datetime.now()
            elapsed_days = (today - start).days
        except ValueError:
            return {"error": "Invalid date format, use YYYY-MM-DD"}

    # 2. Map elapsed days to the current stage
    crop_df = df[df['Crop'].str.lower() == data.crop.lower()].drop_duplicates(subset=['Stage'])
    
    if crop_df.empty:
        return {"error": f"Crop '{data.crop}' not found in dataset"}
        
    stages = crop_df['Stage'].tolist()
    
    if elapsed_days < 0:
        stage_idx = 0
        current_stage = stages[0]
        days_context = f"The user plans to START growing {data.crop} on {data.start_date} (in {abs(elapsed_days)} days). Give them preparation tasks."
    else:
        stage_idx = min(elapsed_days // 25, len(stages) - 1)
        current_stage = stages[stage_idx]
        days_context = f"The user started growing {data.crop} on {data.start_date} ({elapsed_days} days ago)."
    
    # Get the dataset row for context
    active_row = crop_df.iloc[stage_idx]
    optimum_temp = active_row['Optimum_Range'] # typically temperature is the first row of a stage

    # 3. Fetch Weather Forecast from Open-Meteo
    weather_context = "Weather data unavailable."
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={data.latitude}&longitude={data.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            w_data = resp.json()
            daily = w_data.get('daily', {})
            if daily:
                max_t = daily.get('temperature_2m_max', [0])[0]
                min_t = daily.get('temperature_2m_min', [0])[0]
                rain = daily.get('precipitation_sum', [0])[0]
                weather_context = f"Today's Forecast: Max Temp {max_t}°C, Min Temp {min_t}°C, Rainfall {rain}mm"
    except Exception as e:
        print("Weather fetch failed:", e)

    # 4. Integrate User Feedback
    feedback_context = "No previous feedback."
    if data.feedback_history:
        last_feedback = data.feedback_history[-1]
        feedback_context = f"Yesterday's Feedback Rating ({last_feedback.rating}/5): {last_feedback.comments}"

    # 5. Query Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured."}
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
You are an expert agronomist AI helping a farmer in {data.district}, Karnataka.
{days_context}
The plant is currently in the **{current_stage}** stage.
Dataset Optimums for this stage: {optimum_temp}.
Dataset Reference Sites used: {active_row['Reference_Source']}

{weather_context}
{feedback_context}

Please generate an interactive, highly specific, and actionable Daily Worksheet for TODAY.
IMPORTANT: You must write your entire response in {data.language}. If {data.language} is not English, ensure all headers and checklist items are accurately translated.

Provide your output strictly adhering to these Markdown headers:
### 🌤️ Weather Adaptation
### 📋 Today's Priority Tasks
### 💡 Expert Advice (Based on references & feedback)

CRITICAL FORMATTING INSTRUCTION: 
For "Today's Priority Tasks", you MUST structure the tasks chronologically from Morning till Night. Break down all actions into very small, easily digestible bullet points suitable for a complete beginner who knows nothing about farming. DO NOT use long paragraphs anywhere.

You MUST format EVERY task as a raw HTML checkbox checklist within chronological sub-headers, so it renders interactively on a webpage. 

Example Structure:
<h4>🌅 Morning (6:00 AM - 10:00 AM)</h4>
<ul>
  <li><input type="checkbox" id="task1" /> <label for="task1">Short, simple action 1</label></li>
  <li><input type="checkbox" id="task2" /> <label for="task2">Short, simple action 2</label></li>
</ul>
<h4>☀️ Afternoon (2:00 PM - 5:00 PM)</h4>
<ul>
  <li><input type="checkbox" id="task3" /> <label for="task3">Short action 3</label></li>
</ul>

Do NOT use markdown '- [ ]' checkboxes. Use the exact HTML `<ul><li><input type="checkbox">` structure shown above. Keep the rest of the text as standard Markdown.

Keep it practical and localized. Do not just quote standard knowledge, but adapt it to the fact that {days_context}, the current weather, and directly address any issues raised in yesterday's feedback if applicable.
    """
    
    try:
        response = model.generate_content(prompt)
        return {
            "day_number": elapsed_days + 1,
            "current_stage": current_stage,
            "worksheet_markdown": response.text,
            "weather": weather_context
        }
    except Exception as e:
        return {"error": f"Gemini API failure: {str(e)}"}
