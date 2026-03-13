from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os

router = APIRouter()

MODEL_PATH = "ml/crop_model.joblib"
ENCODER_PATH = "ml/label_encoder.joblib"
DIST_ENCODER_PATH = "ml/district_encoder.joblib"

# Load models globally if available
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH) and os.path.exists(DIST_ENCODER_PATH):
        model = joblib.load(MODEL_PATH)
        encoder = joblib.load(ENCODER_PATH)
        dist_encoder = joblib.load(DIST_ENCODER_PATH)
    else:
        model = None
        encoder = None
        dist_encoder = None
except Exception as e:
    model = None
    encoder = None
    dist_encoder = None
    print(f"Error loading model: {e}")

class CropRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    rainfall: float
    district: str

@router.post("/predict_crop")
def predict_crop(data: CropRequest):
    """
    Predicts the best crop given N, P, K, temperature, humidity, and rainfall.
    """
    if model is None or encoder is None or dist_encoder is None:
        raise HTTPException(status_code=500, detail="ML Model not loaded.")
    
    # Safe encoding for district
    try:
        if data.district in dist_encoder.classes_:
            dist_encoded = dist_encoder.transform([data.district])[0]
        else:
            # Fallback to the first class if district is unknown
            dist_encoded = dist_encoder.transform([dist_encoder.classes_[0]])[0]
    except Exception:
        dist_encoded = 0

    # Normalize extreme weather values for ML. Random Forests perform poorly strictly outside their trained feature bounds.
    # The dataset generates rainfall mostly between 20-200. Geolocation monthly rainfall might be 300+.
    # The dataset generates humidity mostly between 40-90%. 
    calc_rain = min(data.rainfall, 250)
    calc_humid = min(max(data.humidity, 30), 100)
    calc_N = min(data.N, 140)
    calc_P = min(data.P, 100)
    calc_K = min(data.K, 100)
    calc_TEMP = min(max(data.temperature, 15), 45)

    # Create DataFrame for prediction. Feature order must match exactly what we trained on
    # FEATURES = ["N", "P", "K", "temperature", "humidity", "rainfall", "district_encoded"]
    input_df = pd.DataFrame([{
        "N": calc_N,
        "P": calc_P,
        "K": calc_K,
        "temperature": calc_TEMP,
        "humidity": calc_humid,
        "rainfall": calc_rain,
        "district_encoded": dist_encoded
    }])
    
    try:
        # Predict probability
        probs = model.predict_proba(input_df)[0]
        
        # Get top 3 classes
        top_indices = probs.argsort()[-3:][::-1]
        
        recommendations = []
        baseline = 1.0 / len(encoder.classes_)
        
        for idx in top_indices:
            raw_confidence = probs[idx]
            if raw_confidence > baseline:
                # Scale it
                relative_confidence = min((raw_confidence - baseline) / (0.6 - baseline), 1.0)
                relative_confidence = max(relative_confidence, 0.4)
            else:
                relative_confidence = raw_confidence
                
            crop_name = encoder.inverse_transform([idx])[0]
            recommendations.append({
                "crop": crop_name,
                "confidence": float(relative_confidence)
            })
        
        return {
            "recommended_crop": recommendations[0]["crop"],
            "confidence": float(recommendations[0]["confidence"]),
            "top_3": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
