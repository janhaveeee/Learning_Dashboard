import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from pydantic import BaseModel
from ml_functions import generate_study_material, track_progress, generate_recommended_content

# ✅ Load trained proficiency model
model = joblib.load("models/proficiency_model.pkl")

# ✅ Load trained roadmap model
roadmap_model = joblib.load("models/roadmap_model.pkl")

app = FastAPI()

# ✅ Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ SQLite Database
DATABASE = "predictions.db"

# ✅ Create Table if it does not exist
def create_table():
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    quiz_scores REAL,
                    time_spent REAL,
                    correct_answers REAL,
                    topics_completed REAL,
                    proficiency_level TEXT,
                    roadmap TEXT
                )
            """)
            # Check if 'roadmap' column exists; if not, add it
            cursor.execute("PRAGMA table_info(predictions)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            if 'roadmap' not in column_names:
                cursor.execute("ALTER TABLE predictions ADD COLUMN roadmap TEXT")
            conn.commit()
    except sqlite3.Error as e:
        print(f"Error creating table: {e}")

create_table()

# ✅ Request Models
class UserInput(BaseModel):
    quiz_scores: float
    time_spent: float
    correct_answers: float
    topics_completed: float

class ContentRequest(BaseModel):
    topic: str

class ProgressData(BaseModel):
    user_performance: list

# ✅ Roadmap Suggestions
def suggest_roadmap(proficiency_level):
    roadmap_suggestions = {
        "Beginner": "Beginner Roadmap: Focus on foundational concepts. Start with basics and gradually move to intermediate topics.",
        "Intermediate": "Intermediate Roadmap: Work on advanced concepts, real-world projects, and practice problem-solving.",
        "Expert": "Expert Roadmap: Focus on specialization, contributing to open-source projects, and mastering niche areas."
    }
    return roadmap_suggestions.get(proficiency_level, "No roadmap available.")

# ✅ Prediction Endpoint
@app.post("/predict")
def predict(user_input: UserInput):
    try:
        data = pd.DataFrame([user_input.dict()])
        data.columns = ['Quiz_Scores', 'Time_Spent', 'Correct_Answers', 'Topics_Completed']

        proficiency_prediction = int(model.predict(data)[0])  # Convert NumPy int64 to Python int
        proficiency_mapping = {0: "Beginner", 1: "Intermediate", 2: "Expert"}
        proficiency_level = proficiency_mapping.get(proficiency_prediction, "Unknown")

        roadmap = suggest_roadmap(proficiency_level)

        # Save prediction & roadmap
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO predictions (quiz_scores, time_spent, correct_answers, topics_completed, proficiency_level, roadmap) VALUES (?, ?, ?, ?, ?, ?)",
                (user_input.quiz_scores, user_input.time_spent, user_input.correct_answers, user_input.topics_completed, proficiency_level, roadmap)
            )
            conn.commit()

        return {"proficiency_level": proficiency_level, "roadmap": roadmap}
    
    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

# ✅ Generate Study Material
@app.post("/generate_content")
def generate_content(request: ContentRequest):
    try:
        study_material = generate_study_material(request.topic)
        return {"study_material": study_material}
    except Exception as e:
        return {"error": f"Error generating content: {str(e)}"}

# ✅ Track Progress & Detect Anomalies
@app.post("/track_progress")
def track_user_progress(data: ProgressData):
    try:
        predictions = track_progress(data.user_performance)
        return {"anomalies": predictions.tolist()}
    except Exception as e:
        return {"error": f"Error tracking progress: {str(e)}"}

# ✅ Recommend Learning Content
@app.post("/recommend_content")
def recommend_content(request: ContentRequest):
    try:
        recommended_content = generate_recommended_content(request.topic)
        return {"recommended_content": recommended_content}
    except Exception as e:
        return {"error": f"Error recommending content: {str(e)}"}

# ✅ Fetch All Predictions
@app.get("/predictions")
def get_predictions():
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM predictions")
            rows = cursor.fetchall()
        return {"predictions": rows}
    except Exception as e:
        return {"error": f"Error fetching predictions: {str(e)}"}

# ✅ API Status
@app.get("/")
def home():
    return {
        "message": "✅ Learning Dashboard API is running!",
        "endpoints": ["/predict", "/predictions", "/generate_content", "/track_progress", "/recommend_content"]
    }

# ✅ Close Database Connection on Shutdown
@app.on_event("shutdown")
def shutdown():
    pass  # No explicit connection closure needed as context manager is used.
