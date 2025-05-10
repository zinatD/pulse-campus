import { useAuth } from '../../../contexts/AuthContext';
import { BsBook, BsGraphUp, BsLamp } from 'react-icons/bs';
import { useState, useEffect } from 'react';
import WelcomeCard from '../WelcomeCard';
import StreakCard from '../StreakCard';
import StudyChart from '../StudyChart';
import QuickNotes from '../QuickNotes';
import UpcomingTasks from '../UpcomingTasks';

const Student = () => {
  const { profile } = useAuth();
  const [quote, setQuote] = useState({ text: '', author: '' });
  
  // Quotes collection
  const quotes = [
    {
      text: "Education is the most powerful weapon which you can use to change the world.",
      author: "Nelson Mandela"
    },
    {
      text: "The beautiful thing about learning is that no one can take it away from you.",
      author: "B.B. King"
    },
    {
      text: "Success is the sum of small efforts, repeated day in and day out.",
      author: "Robert Collier"
    },
    {
      text: "The expert in anything was once a beginner.",
      author: "Helen Hayes"
    },
    {
      text: "Learning is like rowing upstream: not to advance is to drop back.",
      author: "Chinese Proverb"
    },
    {
      text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
      author: "Dr. Seuss"
    }
  ];
  
  // Select a random quote on component mount
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);
  
  return (
    <>
      {/* Updated welcome card to match HTML design */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-primary text-white rounded-xl shadow-md p-5 mb-6 welcome-card"
               style={{
                 background: 'linear-gradient(135deg, #81c784, #2e7d32)',
                 position: 'relative',
                 overflow: 'hidden'
               }}>
            <div className="row align-items-center">
              <div className="col-md-8 position-relative">
                <h1 className="text-3xl font-bold mb-3">Welcome back, {profile?.name || profile?.full_name || 'xx'}!</h1>
                <div className="quote-box mb-3">
                  <p className="quote-text italic text-white/90 text-lg mb-1">"{quote.text}"</p>
                  <p className="quote-author text-sm text-white/80">— {quote.author}</p>
                </div>
              </div>
              <div className="col-md-4 d-flex justify-content-end">
                <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                  <BsBook /> My Courses
                </button>
              </div>
            </div>
            {/* Add decorative pseudo-element effect using inline style */}
            <div
              style={{
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                transform: 'rotate(30deg)',
                pointerEvents: 'none'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl shadow-md p-5 relative">
          <div className="absolute top-0 right-0 -mt-5 -mr-2 text-4xl animate-bounce">📊</div>
          <div className="flex flex-col items-center text-center">
            <BsGraphUp className="text-4xl mb-4 text-primary" />
            <h5 className="text-lg font-medium mb-2">Weekly Studying Report</h5>
            <p className="text-sm text-gray-600 mb-4">Get insights into your teaching patterns and student engagement</p>
            <button 
              onClick={() => alert("Coming soon")}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              View Report 🌱
            </button>
          </div>
        </div>
        <UpcomingTasks />

       
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <QuickNotes />
        <div className="bg-gradient-to-br from-green-100 to-yellow-100 rounded-xl shadow-md p-5 relative">
          <div className="absolute top-0 right-0 -mt-5 -mr-2 text-4xl animate-bounce">💡</div>
          <div className="flex flex-col items-center text-center">
            <BsLamp className="text-4xl mb-4 text-primary" />
            <h5 className="text-lg font-medium mb-2">Study Room</h5>
            <p className="text-sm text-gray-600 mb-4">Start an interactive session</p>
            <button 
              onClick={() => alert("Coming soon")}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Get Started 📚
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Student;
