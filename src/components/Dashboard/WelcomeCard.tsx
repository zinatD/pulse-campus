import { BsEmojiSmile } from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';

const WelcomeCard = () => {
  const { profile } = useAuth();
  
  // Get motivational quotes
  const quotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Believe you can and you're halfway there.",
    "The only way to do great work is to love what you do."
  ];
  
  // Select a random quote
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  // Get display name
  const displayName = profile?.name || profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="card-base bg-green-100">
      <h6 className="flex items-center gap-2 mb-1">
        <BsEmojiSmile /> Welcome back, <span>{displayName}</span>!
      </h6>
      <p className="text-gray-600 mb-2">
        "{randomQuote}"
      </p>
      <button className="px-4 py-1 text-sm border border-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
        Start Studying
      </button>
    </div>
  );
};

export default WelcomeCard;