import React, { useState, useMemo, useEffect } from 'react';
import { Brain, CheckCircle2, XCircle, BookOpen, Download, Copy, Github } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  // First handle display math mode as a whole
  if (text.includes("\\[") && text.includes("\\]")) {
    const parts = text.split(/(\\\[[\s\S]*?\\\])/);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith("\\[") && part.endsWith("\\]")) {
            const mathContent = part.slice(2, -2);
            try {
              return (
                <div key={index} className="flex justify-center my-4">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(mathContent.trim(), {
                        throwOnError: false,
                        displayMode: true
                      }),
                    }}
                  />
                </div>
              );
            } catch (error) {
              console.error("KaTeX rendering error:", error);
              return <div key={index}>{mathContent}</div>;
            }
          } else {
            // Handle the text before and after the display math
            const textParts = part.split(/\n+/);
            return textParts.map((textPart, textIndex) => {
              if (!textPart.trim()) return null;
              return (
                <p key={`${index}-${textIndex}`} className="my-2">
                  {renderMathInline(textPart)}
                </p>
              );
            });
          }
        })}
      </>
    );
  }

  // Then handle other cases
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-4">
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
  const [showToast, setShowToast] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (!selectedSubject) return [];
    const subjectQuestions = quizData.questions.filter(q => q.subject === selectedSubject);
    // Randomly select 20 questions
    return subjectQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  }, [selectedSubject]);

  const questions = filteredQuestions;
  const currentQ = questions[currentQuestion];


  const handleAnswer = (answer: string) => {
    // Record time spent on current question
    if (questionStartTime) {
      const timeSpent = Date.now() - questionStartTime; // Keep in milliseconds
      setTimePerQuestion(prev => ({
        ...prev,
        [currentQuestion]: timeSpent
      }));
    }
    setAnswers({
      ...answers,
      [currentQuestion]: [answer],
    });
  };

  useEffect(() => {
    if (selectedSubject && !startTime) {
      setStartTime(Date.now());
    }
  }, [selectedSubject, startTime]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestion]);

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

  if (showResults && !isReviewMode) {
    const score = calculateScore();
    const totalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const averageTimePerQuestion = Object.values(timePerQuestion).reduce((acc, curr) => acc + curr, 0) / questions.length / 1000;
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
            <div className="text-sm text-gray-600 mb-6">
              <p>Total Time: {Math.floor(totalTime / 60)}m {totalTime % 60}s</p>
              <p>Average Time per Question: {averageTimePerQuestion.toFixed(1)}s</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => setIsReviewMode(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const exportToPDF = async () => {
    const reviewContent = document.getElementById('review-content');
    if (!reviewContent) return;

    // Show loading state
    setExporting(true);

    try {
      const canvas = await html2canvas(reviewContent, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
      });

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.9),
        'JPEG',
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Save the PDF
      pdf.save(`quiz-review-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }

    // Hide loading state
    setExporting(false);
  };

  if (isReviewMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Review Answers</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${exporting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={() => setIsReviewMode(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Results
              </button>
            </div>
          </div>
          <div id="review-content" className="space-y-8">
            {questions.map((q, index) => {
              const userAnswers = answers[index] || [];
              const isCorrect = JSON.stringify(userAnswers.sort()) === JSON.stringify(q.gold.split('').sort());
              const timeSpent = timePerQuestion[index] || 0;
              const timeInSeconds = (timeSpent / 1000).toFixed(1);

              return (
                <div key={index} className={`p-6 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-4`}>
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h3>
                        <span className="text-sm text-gray-600">
                          Time spent: {timeInSeconds}s
                        </span>
                      </div>
                      <div className="text-lg text-gray-800 mb-4 p-4 bg-white rounded border">
                        {renderMath(q.question)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-500 mb-1">Your answer:</p>
                          <p className="text-lg font-medium">{userAnswers.join(', ') || 'No answer provided'}</p>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-500 mb-1">Correct answer:</p>
                          <p className="text-lg font-medium">{q.gold.split('').join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSubject) {
    return <SubjectSelection onSelectSubject={setSelectedSubject} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative py-16 px-4">
      {showToast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out max-w-[90%] sm:max-w-md">
          Question copied to clipboard, open QuickLaTeX to view the question
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <a
            href="https://github.com/nsdevaraj/jeeQuestionBank"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">View on GitHub</span>
          </a>
          <div className="text-gray-600 text-sm max-w-[200px] sm:max-w-xs text-right truncate">
            {currentQ.description}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 w-full max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
              <BookOpen className="w-4 h-4" />
              <span className="flex-1">Having trouble viewing the question? Try</span>
              <a href="https://quicklatex.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                QuickLaTeX
              </a>
            </div> */}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="questionSelect" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Go to Question:
                </label>
                <input
                  id="questionSelect"
                  type="number"
                  min={1}
                  max={questions.length}
                  value={currentQuestion + 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) - 1;
                    if (value >= 0 && value < questions.length) {
                      setCurrentQuestion(value);
                    }
                  }}
                  className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
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

          <div className="mb-6 sm:mb-8">
            <div className="text-lg text-gray-800 mb-6">
              <div className="relative group">
                <div className="max-h-[50vh] overflow-y-auto overflow-x-auto px-2">
                  {renderMath(currentQ.question)}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentQ.question);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy question"
                >
                  <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {currentQ.type === "MCQ" && (
                <div className="space-y-2">
                  {["A", "B", "C", "D"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${answers[currentQuestion]?.[0] === option
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
                      className={`w-full text-left p-4 rounded-lg border transition-all ${answers[currentQuestion]?.includes(option)
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

          <div className="flex justify-end mt-6">
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion]}
              className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-all ${answers[currentQuestion]
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
