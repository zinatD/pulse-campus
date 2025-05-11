import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../../store/quizStore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import SearchBox from '../../components/SearchBox';

const QuizTake = () => {
  const navigate = useNavigate();
  const { quizzes } = useQuizStore();
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    console.log('Quiz Take component loaded, quizzes:', quizzes);
    // Get the most recently created quiz
    if (quizzes && quizzes.length > 0) {
      setCurrentQuiz(quizzes[0]);
      console.log('Set current quiz:', quizzes[0]);
    } else {
      console.log('No quizzes available, redirecting');
      // If no quiz is available, redirect back to create
      navigate('/quiz');
    }
  }, [quizzes, navigate]);

  if (!currentQuiz) {
    return (
      <div className="flex h-screen bg-[url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center bg-fixed">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
            <div className="mb-6">
              <SearchBox />
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Loading quiz...</h2>
            </div>
          </main>
          
          <footer className="bg-white py-4 px-6">
            {/* Footer content */}
          </footer>
        </div>
      </div>
    );
  }

  // Quiz logic functions
  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const submitQuiz = () => {
    console.log('Quiz answers submitted:', selectedAnswers);
    navigate('/quiz');
  };

  // Quiz content
  let quizContent;
  
  if (quizCompleted) {
    quizContent = (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">Quiz Completed!</h2>
        <button
          onClick={submitQuiz}
          className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
        >
          Submit Answers
        </button>
      </div>
    );
  } else {
    const question = currentQuiz.questions[currentQuestion];
    quizContent = (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {currentQuiz.topic} Quiz - Question {currentQuestion + 1}/{currentQuiz.questions.length}
        </h2>
        
        <div className="mb-6">
          <p className="text-lg font-medium mb-4">{question.text}</p>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name={`question-${currentQuestion}`}
                  checked={selectedAnswers[currentQuestion] === option}
                  onChange={() => handleAnswerSelect(currentQuestion, option)}
                  className="mr-3"
                />
                <label htmlFor={`option-${index}`}>{option}</label>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswers[currentQuestion]}
          className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          {currentQuestion < currentQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center bg-fixed">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
          <div className="mb-6">
            <SearchBox />
          </div>
          
          {quizContent}
        </main>

        <footer className="bg-white py-4 px-6">
          <div className="container mx-auto flex justify-between items-center text-sm text-gray-600">
            <p>
              <a href="#" className="font-semibold">@PulseCamp</a>
            </p>
            <ul className="flex gap-4">
              <li><a href="#" className="hover:text-gray-900">About Us</a></li>
              <li><a href="#" className="hover:text-gray-900">Confidentiality</a></li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default QuizTake;