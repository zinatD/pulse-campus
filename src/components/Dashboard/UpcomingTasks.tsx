import { BsCalendarCheck } from 'react-icons/bs';

const UpcomingTasks = () => {
  return (
    <div className="card-base bg-amber-50">
      <h6 className="flex items-center gap-2 mb-3 font-semibold">
        <BsCalendarCheck /> Upcoming
      </h6>
      <ul className="space-y-2">
        <li className="flex justify-between items-center py-1">
          <span className="text-gray-800">Math Quiz</span>
          <span className="text-amber-600 text-sm">Tomorrow</span>
        </li>
        <li className="flex justify-between items-center py-1">
          <span className="text-gray-800">History Essay</span>
          <span className="text-gray-500 text-sm">Fri</span>
        </li>
      </ul>
    </div>
  );
};

export default UpcomingTasks;