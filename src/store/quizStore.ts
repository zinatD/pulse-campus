import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  createdAt: Date;
}

interface QuizStore {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  isLoading: boolean;
  error: string | null;
  createQuiz: (topic: string, difficulty: 'easy' | 'medium' | 'hard', questionCount: number) => Promise<void>;
  submitAnswer: (quizId: string, questionId: string, answer: string) => void;
  clearError: () => void;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [],
      currentQuiz: null,
      isLoading: false,
      error: null,

      createQuiz: async (topic, difficulty, questionCount) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Making OpenAI request for quiz on topic:', topic);
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Create a quiz about ${topic} with ${questionCount} questions at ${difficulty} difficulty level. 
                Format the response as a JSON object with a 'questions' array, where each question has:
                - text: the question text
                - options: array of 4 possible answers
                - correctAnswer: the correct answer (must be one of the options)
                Make sure questions are appropriate for the difficulty level.
                Use the following format: {"questions": [{question objects}]}`
              }
            ],
            response_format: { type: "json_object" }
          });

          if (!response.choices[0].message.content) {
            throw new Error('No response from AI');
          }

          console.log('Raw response content:', response.choices[0].message.content);
          const content = JSON.parse(response.choices[0].message.content);
          console.log('Parsed content:', content);
          
          // Try to handle different possible response structures
          const questionsArray = content.questions || content.quiz || [];
          console.log('Questions array:', questionsArray);
          
          if (!questionsArray || !Array.isArray(questionsArray) || questionsArray.length === 0) {
            throw new Error('Invalid quiz format received from AI');
          }

          const questions = questionsArray.map((q: any) => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer
          }));

          const newQuiz: Quiz = {
            id: Date.now().toString(),
            topic,
            difficulty,
            questions,
            createdAt: new Date()
          };
          console.log('Created new quiz:', newQuiz);

          set(state => {
            const updatedState = {
              quizzes: [...state.quizzes, newQuiz],
              currentQuiz: newQuiz,
              isLoading: false
            };
            console.log('Updating state with new quiz');
            return updatedState;
          });
        } catch (error) {
          console.error('Error creating quiz:', error);
          set({ error: 'Failed to create quiz: ' + (error instanceof Error ? error.message : 'Unknown error'), isLoading: false });
        }
      },

      submitAnswer: (quizId, questionId, answer) => {
        const quiz = get().quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) return;

        // Here you could track user answers and scores
        const isCorrect = answer === question.correctAnswer;
        console.log(`Answer submitted for quiz ${quizId}, question ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'quiz-storage'
    }
  )
);