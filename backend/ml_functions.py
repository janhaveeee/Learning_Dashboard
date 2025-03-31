from transformers import T5ForConditionalGeneration, T5Tokenizer
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer

# Load T5 model for content generation (load once for efficiency)
model_name = "t5-small"
model = T5ForConditionalGeneration.from_pretrained(model_name)
tokenizer = T5Tokenizer.from_pretrained(model_name)

# Generate study material for a specific topic
def generate_study_material(topic):
    prompt = (
        f"Explain {topic} in detail. Include: "
        "1) A clear definition, "
        "2) Key concepts, "
        "3) Real-world applications, and "
        "4) Practical examples."
    )
    input_ids = tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
    output = model.generate(input_ids, max_length=200, num_beams=5, early_stopping=True)
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    return generated_text

# Function to track progress and detect anomalies using Isolation Forest
def track_progress(user_performance):
    # Ensure user_performance is a 2D array (e.g., [[score1, time1], [score2, time2], ...])
    model = IsolationForest(contamination=0.2)
    model.fit(user_performance)
    predictions = model.predict(user_performance)  # 1 for normal, -1 for anomaly
    return predictions

# Function to match learning materials using TF-IDF
def generate_recommended_content(weak_area):
    learning_materials = [
        "Deep Learning for Beginners - Introduction to Neural Networks",
        "Advanced Python Programming for Data Science",
        "Mastering TensorFlow - Deep Learning with Python",
    ]
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(learning_materials)
    
    user_vector = vectorizer.transform([weak_area])
    similarity_scores = (user_vector * tfidf_matrix.T).toarray()
    ranked_materials = sorted(zip(similarity_scores[0], learning_materials), reverse=True)
    return ranked_materials
