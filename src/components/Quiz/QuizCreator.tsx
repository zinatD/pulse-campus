import { useState } from 'react';
import { useQuizStore } from '../../store/quizStore';
import { useNavigate } from 'react-router-dom';

interface QuizParams {
  topic: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const QuizCreator = () => {
  const navigate = useNavigate();
  const { createQuiz, isLoading, error, clearError } = useQuizStore();
  const [quizParams, setQuizParams] = useState<QuizParams>({
    topic: '',
    questionCount: 5,
    difficulty: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating quiz with params:', quizParams);
      await createQuiz(quizParams.topic, quizParams.difficulty, quizParams.questionCount);
      console.log('Quiz created successfully, navigating to:', '/quiz/take');
      // Try using absolute path to ensure correct navigation
      navigate('/quiz/take');
    } catch (err) {
      console.error('Error creating quiz:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Create New Quiz</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button onClick={clearError} className="text-sm underline">Dismiss</button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic
          </label>
          <input
            type="text"
            value={quizParams.topic}
            onChange={(e) => setQuizParams({ ...quizParams, topic: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter quiz topic"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={quizParams.questionCount}
            onChange={(e) => setQuizParams({ ...quizParams, questionCount: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={quizParams.difficulty}
            onChange={(e) => setQuizParams({ ...quizParams, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Creating Quiz...' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
};

export default QuizCreator;