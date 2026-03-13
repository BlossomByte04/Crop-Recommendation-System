from fastapi import APIRouter, UploadFile, File, HTTPException
import easyocr
import io
from PIL import Image
import numpy as np
import re

router = APIRouter()

# Initialize EasyOCR reader (this happens once when the app starts)
# Using english language. (Can throw it into a background thread if startup is too slow, but fine for now)
try:
    reader = easyocr.Reader(['en'])
except Exception as e:
    reader = None
    print(f"Error initializing EasyOCR: {e}")

@router.post("/upload_soil_card")
async def upload_soil_card(file: UploadFile = File(...)):
    """
    Accepts an image of a soil health card, runs OCR, and attempts to extract N, P, K, pH.
    """
    if reader is None:
        raise HTTPException(status_code=500, detail="OCR engine not initialized properly.")
    
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(image)
        
        # Run EasyOCR
        results = reader.readtext(img_np, detail=0)
        full_text = " ".join(results)
        
        return extract_soil_values_from_text(full_text)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

def extract_soil_values_from_text(text: str):
    """
    Tries to find Nitrogen, Phosphorus, Potassium, and pH numbers in the text.
    """
    text_lower = text.lower()
    
    # Using simple regex heuristics to find numbers following keywords
    # Ex: "Nitrogen (N) : 120" or "N = 80"
    def find_val(keywords):
        for kw in keywords:
            # Look for keyword, optional punctuation, then a number
            match = re.search(r'\b' + kw + r'\b[^0-9]*?([0-9]+\.?[0-9]*)', text_lower)
            if match:
                return float(match.group(1))
        return None

    n_val = find_val(['nitrogen', 'n:', 'n =', 'n -'])
    p_val = find_val(['phosphorus', 'p:', 'p =', 'p -'])
    k_val = find_val(['potassium', 'k:', 'k =', 'k -'])
    ph_val = find_val(['ph', 'p.h', 'p h'])
    
    return {
        "raw_text": text,
        "extracted_values": {
            "N": n_val,
            "P": p_val,
            "K": k_val,
            "ph": ph_val
        }
    }
