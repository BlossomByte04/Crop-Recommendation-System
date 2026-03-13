from fastapi import APIRouter
from pydantic import BaseModel
import csv
import os
from datetime import datetime

router = APIRouter()

FEEDBACK_FILE = "data/user_feedback.csv"

class FeedbackRequest(BaseModel):
    crop: str
    rating: int
    comments: str
    inputs_used: dict

@router.post("/submit_feedback")
def submit_feedback(data: FeedbackRequest):
    """
    Submits user feedback regarding the crop recommendation and saves it to a persistent CSV log.
    In the future, this log can be used to re-train and fine-tune the model.
    """
    file_exists = os.path.isfile(FEEDBACK_FILE)
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    
    try:
        with open(FEEDBACK_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            # Write header if new file
            if not file_exists:
                writer.writerow(["Timestamp", "Recommended_Crop", "Rating_1_to_5", "Comments", "Raw_Inputs"])
            
            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                data.crop,
                data.rating,
                data.comments,
                str(data.inputs_used)
            ])
        return {"status": "success", "message": "Feedback recorded successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
