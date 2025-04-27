import { useState } from 'react';
import { useQuizStore } from '../../store/quizStore';

const QuizTaker = () => {
  const { currentQuiz, submitAnswer } = useQuizStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);

  if (!currentQuiz) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">No Quiz Selected</h2>
        <p className="text-gray-600">Please create or select a quiz to begin.</p>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    submitAnswer(currentQuiz.id, currentQuestion.id, selectedAnswer);

    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">{currentQuiz.topic}</h2>
        <p className="text-gray-600">
          Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
        </p>
      </div>

      {!showResult ? (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedAnswer === option
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </>
      ) : (
        <div className="text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">Quiz Completed!</h3>
          <p className="text-gray-600">Thank you for taking the quiz.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;