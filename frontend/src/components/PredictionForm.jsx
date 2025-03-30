import { useState } from "react";
import axios from "axios";

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    quiz_scores: "",
    time_spent: "",
    correct_answers: "",
    topics_completed: "",
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const requestData = {
        quiz_scores: parseFloat(formData.quiz_scores),
        time_spent: parseFloat(formData.time_spent),
        correct_answers: parseFloat(formData.correct_answers),
        topics_completed: parseFloat(formData.topics_completed),
      };

      const response = await axios.post("http://127.0.0.1:8000/predict", requestData);
      setPrediction(response.data.prediction);
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError("Failed to fetch prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form-container">
      <div className="prediction-form-card">
        <h2 className="prediction-form-title">Skill Level Predictor</h2>
        <p className="prediction-form-description">
          Enter your learning data to predict your proficiency level.
        </p>
        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="form-group">
            <label className="form-label">Quiz Scores</label>
            <input
              type="number"
              name="quiz_scores"
              placeholder="Enter quiz score"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time Spent (hrs)</label>
            <input
              type="number"
              name="time_spent"
              placeholder="Enter time spent on learning"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Correct Answers</label>
            <input
              type="number"
              name="correct_answers"
              placeholder="Enter number of correct answers"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Topics Completed</label>
            <input
              type="number"
              name="topics_completed"
              placeholder="Enter topics completed"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className={`form-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Predicting..." : "Get Prediction"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {prediction !== null && (
          <div className="prediction-result">
            <h3 className="result-title">Prediction:</h3>
            <p className="result-text">{prediction}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionForm;