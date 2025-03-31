import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load dataset
data_path = "data/proficiency_dataset.csv"  # Dataset path

try:
    df = pd.read_csv(data_path)
    print(f"✅ Dataset loaded successfully! Shape: {df.shape}")
except FileNotFoundError:
    raise FileNotFoundError(f"❌ Dataset not found: {data_path}")

# Standardize column names (strip spaces)
df.columns = df.columns.str.strip()

# Ensure "Suggested_Roadmap" is in the dataset
if "Suggested_Roadmap" not in df.columns:
    raise KeyError("❌ Column 'Suggested_Roadmap' not found in dataset. Check file!")

# Encode the 'Suggested_Roadmap' column as numerical values (this is necessary for machine learning models)
roadmap_mapping = {
    "Deep Learning, AI Research, Big Data Analytics": 0,
    "Advanced Python, Data Science Basics, ML Algorithms": 1,
    "Intro to Programming, Basic Python, Fundamentals of ML": 2,
    # Add more mappings as necessary based on your dataset
}
df["Suggested_Roadmap"] = df["Suggested_Roadmap"].map(roadmap_mapping)

# Select features and target
feature_cols = ["Quiz_Scores", "Time_Spent", "Correct_Answers", "Topics_Completed"]

# Ensure all required features are present
missing_features = [col for col in feature_cols if col not in df.columns]
if missing_features:
    raise KeyError(f"❌ Missing feature columns: {missing_features}")

X = df[feature_cols]
y = df["Suggested_Roadmap"]

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest model
roadmap_model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
roadmap_model.fit(X_train, y_train)

# Evaluate accuracy
y_pred = roadmap_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Roadmap Model Accuracy: {accuracy:.4f}")

# Save trained model
roadmap_model_path = "models/roadmap_model.pkl"
joblib.dump(roadmap_model, roadmap_model_path)
print(f"✅ Roadmap model saved as '{roadmap_model_path}'")

# Optionally, save label encoder if using mapped labels
roadmap_label_encoder_path = "models/roadmap_label_encoder.pkl"
joblib.dump(roadmap_mapping, roadmap_label_encoder_path)
