import { BsFire } from 'react-icons/bs';

const StreakCard = () => {
  return (
    <div className="card-base bg-teal-50 text-center">
      <h6 className="flex items-center justify-center gap-2 mb-1">
        <BsFire /> Streak
      </h6>
      <p className="text-4xl font-bold mb-0">7</p>
      <small className="text-gray-500">days in a row!</small>
    </div>
  );
};

export default StreakCard;