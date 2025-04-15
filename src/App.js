import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { LinearProgress } from "@mui/material";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL =
  "https://raw.githubusercontent.com/yghugardare/Sample/main/sample.json";

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [examStarted, setExamStarted] = useState(false); // State to track if the exam has started
  const [darkMode, setDarkMode] = useState(false); // Dark mode state

  // Fetch questions
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const q = data.data.questions;
        setQuestions(q);
        setSelectedWords(Array(q.length).fill([]));
      });
  }, []);

  // Timer logic
  useEffect(() => {
    if (!examStarted || isFinished || submitted) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleAutoSubmit();
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [current, submitted, isFinished, examStarted]);

  const handleStartExam = () => {
    setExamStarted(true); // Start the exam
    setTimer(30); // Reset timer for first question
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode); // Toggle between dark and light mode
  };

  const handleWordSelect = (word) => {
    if (submitted) return;

    const currentSelection = selectedWords[current];
    if (currentSelection.includes(word)) return;

    if (currentSelection.length < 4) {
      const updated = [...selectedWords];
      updated[current] = [...currentSelection, word];
      setSelectedWords(updated);
    }
  };

  const handleUnselect = (idx) => {
    if (submitted) return;
    const updated = [...selectedWords];
    updated[current] = updated[current].filter((_, i) => i !== idx);
    setSelectedWords(updated);
  };

  const handleSubmit = () => {
    const correct = questions[current].correctAnswer;
    const user = selectedWords[current];
    const isCorrect = JSON.stringify(correct) === JSON.stringify(user);
    setScore((s) => (isCorrect ? s + 1 : s));
    setShowAnswers(true);
    setSubmitted(true);

    const updatedAnswers = [...userAnswers];
    updatedAnswers[current] = { user, correct };
    setUserAnswers(updatedAnswers);
  };

  const handleAutoSubmit = () => {
    if (!submitted) {
      handleSubmit();
    }
    if (current < questions.length - 1) {
      goToNext();
    } else {
      setIsFinished(true);
    }
  };

  const goToNext = () => {
    setCurrent((prev) => prev + 1);
    setShowAnswers(false);
    setSubmitted(false);
    setTimer(30);
  };

  const progressData = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [score, questions.length - score],
        backgroundColor: ["#4caf50", "#f44336"],
        borderColor: ["#4caf50", "#f44336"],
        borderWidth: 1,
      },
    ],
  };

  const progressBarValue = ((current + 1) / questions.length) * 100; // Percentage of questions answered

  if (questions.length === 0) return <p>Loading...</p>;

  if (isFinished) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Test Completed!</h2>
        <p>
          Your Score: {score} / {questions.length}
        </p>
        <Pie data={progressData} />
        {questions.map((q, idx) => {
          const user = userAnswers[idx]?.user || [];
          const correct = q.correctAnswer;
          const isCorrect = JSON.stringify(user) === JSON.stringify(correct);
          return (
            <div key={q.questionId} style={{ marginTop: "1rem" }}>
              <p>
                <strong>Q{idx + 1}:</strong> {q.question}
              </p>
              <p style={{ color: isCorrect ? "green" : "red" }}>
                Your Answer: {user.join(", ")} {isCorrect ? "✔" : "✘"}
              </p>
              {!isCorrect && (
                <p style={{ color: "blue" }}>
                  Correct Answer: {correct.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const currentQuestion = questions[current];
  const blanks = selectedWords[current] || [];

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: darkMode ? "#2b2b2b" : "#fff",
        color: darkMode ? "#fff" : "#000",
      }}
    >
      {!examStarted ? (
        <div>
          <h2>Welcome to the Quiz</h2>
          <button onClick={handleStartExam} style={{ marginTop: "20px" }}>
            Start Exam
          </button>
        </div>
      ) : (
        <>
          <button onClick={toggleDarkMode} style={{ marginBottom: "20px" }}>
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>
          <h2>
            Question {current + 1} of {questions.length}
          </h2>
          <p>Time Left: {timer} seconds</p>
          <p>
            <strong>{currentQuestion.question}</strong>
          </p>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={progressBarValue}
            style={{ marginBottom: "20px" }}
          />

          <div style={{ margin: "1rem 0", minHeight: "2rem" }}>
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <span
                  key={i}
                  onClick={() => handleUnselect(i)}
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    marginRight: "0.5rem",
                    cursor: "pointer",
                    background: showAnswers
                      ? blanks[i] === currentQuestion.correctAnswer[i]
                        ? "lightgreen"
                        : "salmon"
                      : "white",
                  }}
                >
                  {blanks[i] || "____"}
                </span>
              ))}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleWordSelect(option)}
                disabled={blanks.includes(option) || submitted}
                style={{
                  marginRight: "0.5rem",
                  marginBottom: "0.5rem",
                  padding: "0.5rem 1rem",
                }}
              >
                {option}
              </button>
            ))}
          </div>

          {!submitted && blanks.length === 4 && (
            <button onClick={handleSubmit}>Submit</button>
          )}
          {submitted && current < questions.length - 1 && (
            <button onClick={goToNext} style={{ marginLeft: "1rem" }}>
              Next
            </button>
          )}
          {submitted && current === questions.length - 1 && (
            <button
              onClick={() => setIsFinished(true)}
              style={{ marginLeft: "1rem" }}
            >
              Finish
            </button>
          )}
        </>
      )}
    </div>
  );
}
