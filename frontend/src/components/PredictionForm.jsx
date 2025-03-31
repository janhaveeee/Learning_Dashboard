import { useState, useEffect } from "react";
import axios from "axios";

const PredictionForm = () => {
    const [formData, setFormData] = useState({
        quiz_scores: "",
        time_spent: "",
        correct_answers: "",
        topics_completed: "",
        topic: "",
        user_performance: "", // This will be converted to array before sending
        user_id: "default_user" 
    });

    const [prediction, setPrediction] = useState(null);
    const [roadmap, setRoadmap] = useState(null);
    const [studyMaterial, setStudyMaterial] = useState("");
    const [recommendedContent, setRecommendedContent] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pastPredictions, setPastPredictions] = useState([]);

    useEffect(() => {
        fetchPastPredictions();
    }, []);

    const fetchPastPredictions = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/predictions");
            setPastPredictions(response.data.predictions || []);
        } catch (err) {
            console.error("Error fetching past predictions:", err);
            setPastPredictions([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Helper function to convert user_performance string into an array
    const parseUserPerformance = (performanceStr) => {
        // Split by commas if it contains commas
        if (performanceStr.includes(',')) {
            return performanceStr.split(',').map(item => item.trim()).filter(item => item !== '');
        }
        
        // Split by spaces if it contains spaces
        if (performanceStr.includes(' ')) {
            return performanceStr.split(' ').filter(item => item !== '');
        }
        
        // If it's a single value, wrap it in an array
        return performanceStr ? [performanceStr] : [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPrediction(null);
        setRoadmap(null);
        setStudyMaterial("");
        setRecommendedContent([]);
        setAnomalies([]);

        try {
            // Parse and validate numeric inputs
            const parsedQuizScores = isNaN(parseFloat(formData.quiz_scores)) || !isFinite(parseFloat(formData.quiz_scores)) ? 0 : parseFloat(formData.quiz_scores);
            const parsedTimeSpent = isNaN(parseFloat(formData.time_spent)) || !isFinite(parseFloat(formData.time_spent)) ? 0 : parseFloat(formData.time_spent);
            const parsedCorrectAnswers = isNaN(parseFloat(formData.correct_answers)) || !isFinite(parseFloat(formData.correct_answers)) ? 0 : parseFloat(formData.correct_answers);
            const parsedTopicsCompleted = isNaN(parseFloat(formData.topics_completed)) || !isFinite(parseFloat(formData.topics_completed)) ? 0 : parseFloat(formData.topics_completed);
            
            // Parse user_performance as an array
            const parsedUserPerformance = parseUserPerformance(formData.user_performance);

            // Prepare base request data
            const requestData = {
                quiz_scores: parsedQuizScores,
                time_spent: parsedTimeSpent,
                correct_answers: parsedCorrectAnswers,
                topics_completed: parsedTopicsCompleted,
                topic: formData.topic,
                user_performance: parsedUserPerformance, // Now sending as array
                user_id: formData.user_id
            };

            console.log("Request Data:", requestData);

            // First request: predict endpoint
            const response = await axios.post("http://127.0.0.1:8000/predict", requestData);

            if (response.data.proficiency_level && response.data.roadmap) {
                setPrediction(response.data.proficiency_level);
                setRoadmap(response.data.roadmap);
                fetchPastPredictions();
            } else {
                setError("Invalid response from the /predict endpoint.");
                throw new Error("Invalid response from /predict");
            }

            // Second request: generate_content endpoint
            try {
                const materialResponse = await axios.post("http://127.0.0.1:8000/generate_content", requestData);
                setStudyMaterial(materialResponse.data.study_material);
            } catch (generateContentError) {
                console.error("Error calling /generate_content:", generateContentError);
                if (generateContentError.response) {
                    console.error("generate_content Server Error:", generateContentError.response.data);
                    const errorDetail = generateContentError.response.data.detail 
                        ? JSON.stringify(generateContentError.response.data.detail) 
                        : JSON.stringify(generateContentError.response.data);
                    setError(`generate_content Error: ${generateContentError.response.status} - ${errorDetail}`);
                } else {
                    setError("Error calling /generate_content, but no server response.");
                }
            }

            // Third request: recommend_content endpoint
            try {
                const contentResponse = await axios.post("http://127.0.0.1:8000/recommend_content", requestData);
                setRecommendedContent(contentResponse.data.recommended_content);
            } catch (recommendError) {
                console.error("Error calling /recommend_content:", recommendError);
                // Continue executing even if this fails
            }

            // Fourth request: track_progress endpoint
            try {
                // Create a modified request specifically for track_progress
                const trackProgressRequest = {
                    ...requestData,
                    // Make sure user_performance is an array
                    user_performance: Array.isArray(requestData.user_performance) 
                        ? requestData.user_performance 
                        : parseUserPerformance(requestData.user_performance),
                    timestamp: new Date().toISOString(),
                    quiz_scores: Number(requestData.quiz_scores),
                    time_spent: Number(requestData.time_spent),
                    correct_answers: Number(requestData.correct_answers),
                    topics_completed: Number(requestData.topics_completed)
                };
                
                console.log("Track Progress Request:", trackProgressRequest);
                
                const progressResponse = await axios.post("http://127.0.0.1:8000/track_progress", trackProgressRequest);
                setAnomalies(progressResponse.data.anomalies);
            } catch (trackProgressError) {
                console.error("Error calling /track_progress:", trackProgressError);
                if (trackProgressError.response) {
                    console.error("track_progress Server Error:", trackProgressError.response.data);
                    
                    // Extract and log detailed error information
                    if (trackProgressError.response.data && trackProgressError.response.data.detail) {
                        console.error("Error details:", trackProgressError.response.data.detail);
                    }
                    
                    const errorDetail = trackProgressError.response.data.detail 
                        ? JSON.stringify(trackProgressError.response.data.detail) 
                        : JSON.stringify(trackProgressError.response.data);
                    
                    setError(`track_progress Error: ${trackProgressError.response.status} - ${errorDetail}`);
                } else {
                    setError("Error calling /track_progress, but no server response.");
                }
                
                // Set a default anomalies value to prevent UI errors
                setAnomalies([]);
            }

        } catch (err) {
            console.error("Error during API calls:", err);
            if (err.response) {
                console.error("Server Error:", err.response.data);
                
                // Better error detail extraction
                const errorDetail = err.response.data.detail 
                    ? JSON.stringify(err.response.data.detail) 
                    : JSON.stringify(err.response.data);
                
                setError(`Server Error: ${err.response.status} - ${errorDetail}`);
            } else if (err.request) {
                console.error("Network Error:", err.request);
                setError("Network Error: Could not connect to the server.");
            } else {
                console.error("Client Error:", err.message);
                setError(`Client Error: ${err.message}`);
            }
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
                            value={formData.quiz_scores}
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
                            value={formData.time_spent}
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
                            value={formData.correct_answers}
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
                            value={formData.topics_completed}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Topic</label>
                        <input
                            type="text"
                            name="topic"
                            placeholder="Enter topic"
                            className="form-input"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">User Performance</label>
                        <input
                            type="text"
                            name="user_performance"
                            placeholder="Enter values separated by commas (e.g., 10,20,30)"
                            className="form-input"
                            value={formData.user_performance}
                            onChange={handleChange}
                            required
                        />
                        <small className="form-help-text">Enter values as a list (separated by commas)</small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">User ID</label>
                        <input
                            type="text"
                            name="user_id"
                            placeholder="Enter user ID"
                            className="form-input"
                            value={formData.user_id}
                            onChange={handleChange}
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
                        <h3 className="result-title">Proficiency Level:</h3>
                        <p className="result-text">{prediction}</p>

                        {roadmap && (
                            <div className="roadmap-container">
                                <h3 className="roadmap-title">Suggested Roadmap:</h3>
                                <p className="roadmap-text">{roadmap}</p>
                            </div>
                        )}

                        {studyMaterial && (
                            <div className="study-material-container">
                                <h3>Generated Study Material:</h3>
                                <p>{studyMaterial}</p>
                            </div>
                        )}

                        {recommendedContent.length > 0 && (
                            <div className="recommended-content-container">
                                <h3>Recommended Learning Materials:</h3>
                                <ul>
                                    {recommendedContent.map(([score, content], index) => (
                                        <li key={`recommended-content-${content}-${score}`}>
                                            {content} (Score: {score})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {anomalies && anomalies.length > 0 && (
                            <div className="anomalies-container">
                                <h3>Progress Anomalies:</h3>
                                <p>
                                    {anomalies.includes(-1)
                                        ? "Anomalies detected in your progress!"
                                        : "No anomalies detected."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="past-predictions">
                <h2>Past Predictions</h2>
                {Array.isArray(pastPredictions) && pastPredictions.length === 0 ? (
                    <p>No past predictions available.</p>
                ) : (
                    <div className="table-container">
                        <table className="predictions-table">
                            <thead>
                                <tr>
                                    <th>Quiz Scores</th>
                                    <th>Time Spent</th>
                                    <th>Correct Answers</th>
                                    <th>Topics Completed</th>
                                    <th>Proficiency Level</th>
                                    <th>Roadmap</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastPredictions.map((item, index) => {
                                    const key = item.id || `past-prediction-${index}`;
                                    return (
                                        <tr key={key}>
                                            <td>{item.quiz_scores}</td>
                                            <td>{item.time_spent}</td>
                                            <td>{item.correct_answers}</td>
                                            <td>{item.topics_completed}</td>
                                            <td>{item.proficiency_level}</td>
                                            <td>{item.roadmap}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredictionForm;