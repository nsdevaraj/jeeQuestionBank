import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';
import quizData from './data/quiz.json';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
}

const Table = ({ content }: { content: string }) => {
  const rows = content
    .split("\\\\")
    .map((row) => row.trim())
    .filter((row) => row !== "\\hline" && row !== "");
  
  const headers = rows[0].split("&").map((cell) => cell.trim());
  const bodyRows = rows.slice(1);

  return (
    <div className="overflow-x-auto flex justify-center my-4">
      <table className="min-w-[50%] divide-y divide-gray-200">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {renderMathInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.split("&").map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderMathInline(cell.trim())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderMathInline = (text: string) => {
  return text.split("$").map((part, index) => {
    if (index % 2 === 1) {
      try {
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        );
      } catch (error) {
        console.error("KaTeX rendering error:", error);
        return <span key={index}>{part}</span>;
      }
    }
    return part;
  });
};

const renderMath = (text: string) => {
  const parts = text.split(/\n+/);

  return parts.map((part, index) => {
    if (part.includes("\\begin{center}") && part.includes("\\begin{tabular}")) {
      const tableContent = part.match(/\\begin{tabular}([\s\S]*?)\\end{tabular}/)?.[1];
      return tableContent ? <Table key={index} content={tableContent} /> : part;
    } else if (part.trim() === "\\begin{center}" || part.trim() === "\\end{center}") {
      return null;
    } else {
      return (
        <p key={index} className="my-2">
          {renderMathInline(part)}
        </p>
      );
    }
  });
};

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const questions = quizData.questions;
  const currentQ = questions[currentQuestion];

  const handleAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestion]: [answer],
    });
  };

  const handleMultiAnswer = (answer: string) => {
    const currentAnswers = answers[currentQuestion] || [];
    const newAnswers = currentAnswers.includes(answer)
      ? currentAnswers.filter((a) => a !== answer)
      : [...currentAnswers, answer].sort();
    
    setAnswers({
      ...answers,
      [currentQuestion]: newAnswers,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      const userAnswer = answers[index] || [];
      if (q.type === "MCQ(multiple)") {
        if (userAnswer.join('') === q.gold) {
          score++;
        }
      } else {
        if (userAnswer[0] === q.gold) {
          score++;
        }
      }
    });
    return score;
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <Brain className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h1>
            <div className="text-5xl font-bold text-indigo-600 mb-4">
              {percentage.toFixed(1)}%
            </div>
            <p className="text-gray-600 mb-6">
              You got {score} out of {questions.length} questions correct
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-sm text-gray-500">
              Score: {calculateScore()} / {currentQuestion + 1}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="text-lg text-gray-800 mb-6">
            {renderMath(currentQ.question)}
          </div>

          <div className="space-y-3">
            {currentQ.type === "MCQ" && (
              <div className="space-y-2">
                {["A", "B", "C", "D"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      answers[currentQuestion]?.[0] === option
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === "MCQ(multiple)" && (
              <div className="space-y-2">
                {["A", "B", "C", "D"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleMultiAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      answers[currentQuestion]?.includes(option)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {answers[currentQuestion]?.includes(option) ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 mr-3" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mr-3" />
                      )}
                      {option}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(currentQ.type === "Integer" || currentQ.type === "Numeric") && (
              <input
                type="number"
                value={answers[currentQuestion]?.[0] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-4 rounded-lg border border-gray-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Enter your answer..."
              />
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className={`px-6 py-2 rounded-lg transition-all ${
              answers[currentQuestion]
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;