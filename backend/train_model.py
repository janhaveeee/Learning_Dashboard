import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
data_path = "data/proficiency_dataset.csv"

try:
    df = pd.read_csv(data_path)
    print(f"✅ Dataset loaded successfully! Shape: {df.shape}")
except FileNotFoundError:
    raise FileNotFoundError(f"❌ Dataset not found: {data_path}")

# Standardize column names (strip spaces)
df.columns = df.columns.str.strip()

# Ensure "Proficiency_Level" is in the dataset
if "Proficiency_Level" not in df.columns:
    raise KeyError("❌ Column 'Proficiency_Level' not found in dataset. Check file!")

# Convert categorical proficiency levels to numerical labels
proficiency_mapping = {"Beginner": 0, "Intermediate": 1, "Expert": 2}
df["Proficiency_Level"] = df["Proficiency_Level"].map(proficiency_mapping)

# Select features and target
feature_cols = ["Quiz_Scores", "Time_Spent", "Correct_Answers", "Topics_Completed"]

# Ensure all required features are present
missing_features = [col for col in feature_cols if col not in df.columns]
if missing_features:
    raise KeyError(f"❌ Missing feature columns: {missing_features}")

X = df[feature_cols]
y = df["Proficiency_Level"]

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest model
model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)  # Improved hyperparameters
model.fit(X_train, y_train)

# Evaluate accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model Accuracy: {accuracy:.4f}")  # Show 4 decimal places

# Save trained model
model_path = "models/proficiency_model.pkl"
joblib.dump(model, model_path)
print(f"✅ Model saved as '{model_path}'")
