import React, { useState, useMemo } from 'react';
import { Brain, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import quizData from './data/quiz.json';
import 'katex/dist/katex.min.css';
import katex from 'katex';
 

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

const SubjectSelection = ({ onSelectSubject }: { onSelectSubject: (subject: string) => void }) => {
  const subjects = [
    { id: 'math', name: 'Mathematics', color: 'bg-blue-500' },
    { id: 'phy', name: 'Physics', color: 'bg-green-500' },
    { id: 'chem', name: 'Chemistry', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <BookOpen className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">JEE Question Bank</h1>
          <p className="text-gray-600 mt-2">Select a subject to start practicing</p>
        </div>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={`w-full p-4 rounded-lg ${subject.color} text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}
            >
              <span>{subject.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (!selectedSubject) return [];
    const subjectQuestions = quizData.questions.filter(q => q.subject === selectedSubject);
    // Randomly select 20 questions
    return subjectQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  }, [selectedSubject]);

  const questions = filteredQuestions;

  const handleQuestionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentQuestion(Number(event.target.value));
  };
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

  if (!selectedSubject) {
    return <SubjectSelection onSelectSubject={setSelectedSubject} />;
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

        <div className="flex justify-center items-center gap-2 mt-4">
          <label htmlFor="questionSelect" className="text-sm font-medium text-gray-700">Go to Question:</label>
          <select
            id="questionSelect"
            value={currentQuestion}
            onChange={handleQuestionSelect}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {questions.map((_, index) => (
              <option key={index} value={index}>
                Question {index + 1}
              </option>
            ))}
          </select>
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