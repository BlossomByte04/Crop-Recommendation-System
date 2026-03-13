from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

@router.get("/get_weather")
def get_weather(lat: float, lon: float):
    """
    Fetches temperature, humidity, and rainfall from Open-Meteo API.
    """
    # Open-Meteo Current Weather API
    # We fetch temperature_2m, relative_humidity_2m, and precipitation
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current", {})
        
        return {
            "temperature": current.get("temperature_2m", 25.0),
            "humidity": current.get("relative_humidity_2m", 60.0),
            "rainfall": current.get("precipitation", 0.0),
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {str(e)}")
