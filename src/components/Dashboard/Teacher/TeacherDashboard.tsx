import { useAuth } from '../../../contexts/AuthContext';
import { BsBook } from 'react-icons/bs';
import WelcomeCard from '../WelcomeCard';
import StreakCard from '../StreakCard';
import StudyChart from '../StudyChart';
import QuickNotes from '../QuickNotes';
import UpcomingTasks from '../UpcomingTasks';

const TeacherDashboard = () => {
  const { profile } = useAuth();
  
  return (
    <>
      <div className="bg-primary text-white rounded-xl shadow-md p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-white/80">
              Welcome back, {profile?.name || profile?.full_name || 'Teacher'}!
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
            <BsBook /> My Courses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <WelcomeCard />
        <StreakCard />
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-xl font-semibold mb-4">My Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium mb-1">Mathematics {i}01</h3>
                <p className="text-sm text-gray-600 mb-2">25 Students</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mon, Wed 10am</span>
                  <span>Room 204</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-primary text-white px-4 py-2 rounded-lg">
              Create New Class
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StudyChart />
        <UpcomingTasks />
      </div>
    </>
  );
};

export default TeacherDashboard;
