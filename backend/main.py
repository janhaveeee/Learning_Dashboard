from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from pydantic import BaseModel

# Load trained model
try:
    model = joblib.load("models/proficiency_model.pkl")
    print(f"✅ Model loaded successfully! Type: {type(model)}")
except FileNotFoundError:
    raise RuntimeError("❌ Model file not found! Ensure 'models/proficiency_model.pkl' exists.")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request data structure
class UserInput(BaseModel):
    quiz_scores: float
    time_spent: float
    correct_answers: float
    topics_completed: float

@app.post("/predict")
def predict(user_input: UserInput):
    try:
        # Convert input to DataFrame
        data = pd.DataFrame([user_input.dict()])
        
        # Ensure features match model's training data
        expected_features = ["quiz_scores", "time_spent", "correct_answers", "topics_completed"]
        if list(data.columns) != expected_features:
            return {"error": f"Incorrect feature names. Expected {expected_features}, but got {list(data.columns)}"}

        # Make prediction
        prediction = model.predict(data)
        return {"prediction": prediction.tolist()}
    
    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

@app.get("/")
def home():
    return {"message": "✅ Learning Dashboard API is running!"}
