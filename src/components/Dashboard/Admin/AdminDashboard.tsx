import { useAuth } from '../../../contexts/AuthContext';
import UserStatistics from './UserStatistics';
import UserManagement from './UserManagement';
import { BsGear } from 'react-icons/bs';

const AdminDashboard = () => {
  const { profile } = useAuth();
  
  return (
    <>
      <div className="bg-primary text-white rounded-xl shadow-md p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/80">
              Welcome back, {profile?.name || profile?.full_name || 'Admin'}!
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
            <BsGear /> System Settings
          </button>
        </div>
      </div>

      <div className="mb-6">
        <UserStatistics />
      </div>

      <div className="mb-6">
        <UserManagement />
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center">
            Create Registration Code
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center">
            Manage Courses
          </button>
          <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-center">
            System Reports
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
