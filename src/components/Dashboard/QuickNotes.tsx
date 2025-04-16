import { BsPencil } from 'react-icons/bs';

const QuickNotes = () => {
  return (
    <div className="card-base bg-green-50">
      <h6 className="flex items-center gap-2 mb-3 font-semibold">
        <BsPencil /> Quick Notes
      </h6>
      <p className="text-gray-600 mb-4">Jot down ideas or tasks...</p>
      <button className="w-full py-2 px-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2">
        Open Notes <span>→</span>
      </button>
    </div>
  );
};

export default QuickNotes;