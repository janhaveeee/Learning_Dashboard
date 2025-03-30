import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Define file paths
data_path = "data/learning_dashboard_dataset.csv"
model_path = "models/proficiency_model.pkl"

# Check if dataset exists
if not os.path.exists(data_path):
    raise FileNotFoundError(f"Dataset not found: {data_path}")

# Load dataset
df = pd.read_csv(data_path)

# Ensure necessary columns exist
required_columns = {"proficiency_level", "quiz_scores", "time_spent", "correct_answers", "topics_completed"}
if not required_columns.issubset(df.columns):
    raise ValueError(f"Missing required columns: {required_columns - set(df.columns)}")

# Convert categorical proficiency levels to numerical values
proficiency_mapping = {"Beginner": 0, "Intermediate": 1, "Expert": 2}
df["proficiency_level"] = df["proficiency_level"].map(proficiency_mapping)

# Check for NaN values after mapping
if df["proficiency_level"].isna().any():
    raise ValueError("Invalid values found in 'proficiency_level' column. Ensure all values are mapped correctly.")

# Select features and target
X = df[["quiz_scores", "time_spent", "correct_answers", "topics_completed"]]
y = df["proficiency_level"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
os.makedirs("models", exist_ok=True)  # Ensure models directory exists
joblib.dump(model, model_path)
print(f"✅ Model trained and saved successfully at {model_path}!")
