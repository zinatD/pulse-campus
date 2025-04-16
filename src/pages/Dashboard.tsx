import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { useAlert } from '../contexts/AlertContext';

// Import components
import WelcomeCard from '../components/Dashboard/WelcomeCard';
import StreakCard from '../components/Dashboard/StreakCard';
import StudyChart from '../components/Dashboard/StudyChart';
import SubjectsChart from '../components/Dashboard/SubjectsChart';
import QuickNotes from '../components/Dashboard/QuickNotes';
import UpcomingTasks from '../components/Dashboard/UpcomingTasks';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define User interface
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  role_id: number;
  role_name?: string;
  created_at: string;
  status?: 'active' | 'inactive' | 'pending';
}

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile, getUserRole } = useAuth();
  const { showAlert } = useAlert();
  const [dashboardType, setDashboardType] = useState<'student' | 'teacher' | 'admin'>(
    // Initialize from localStorage if available
    (localStorage.getItem('userRole') as 'admin' | 'teacher' | 'student') || 'student'
  );
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userStats, setUserStats] = useState({ total: 0, teachers: 0, students: 0 });
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Force re-evaluation of dashboard type when component mounts
  useEffect(() => {
    const role = getUserRole();
    console.log("🏁 Dashboard mounted, checking role:", role);
    
    if (role === 'admin') {
      console.log("👑 Setting dashboard type to admin");
      setDashboardType('admin');
    } else if (role === 'teacher') {
      console.log("👨‍🏫 Setting dashboard type to teacher");
      setDashboardType('teacher');
    } else {
      console.log("🧑‍🎓 Setting dashboard type to student (default)");
      setDashboardType('student');
    }
  }, []);
  
  // Also update when profile changes
  useEffect(() => {
    const role = getUserRole();
    console.log("📱 Profile updated, current role:", role);
    
    if (role && role !== dashboardType && 
       (role === 'admin' || role === 'teacher' || role === 'student')) {
      console.log(`🔄 Updating dashboard from ${dashboardType} to ${role}`);
      setDashboardType(role as 'admin' | 'teacher' | 'student');
    }
  }, [profile]);
  
  // Fetch users when on admin dashboard
  useEffect(() => {
    if (dashboardType === 'admin') {
      fetchUsers();
      fetchUserStats();
    }
  }, [dashboardType]);
  
  // Function to fetch users from backend
  const fetchUsers = async () => {
    try {
      console.log("🔍 Fetching users from backend");
      setIsLoadingUsers(true);
      
      // Fetch users with role information
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('*')
        .order('role_id');
      
      if (userError) {
        console.error("❌ Error fetching users:", userError);
        showAlert('error', 'Failed to load users. See console for details.');
        return;
      }
      
      if (userData) {
        console.log(`✅ Successfully fetched ${userData.length} users`);
        
        // Add a default status (in a real app, you would have this in the database)
        const enrichedUsers = userData.map(user => ({
          ...user,
          status: 'active' as const,  // All users default to active for this example
          full_name: user.full_name || `${user.name || ''} ${user.surname || ''}`.trim() || user.username
        }));
        
        setUsers(enrichedUsers);
      }
    } catch (error) {
      console.error("❌ Exception when fetching users:", error);
      showAlert('error', 'An unexpected error occurred while loading users');
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Function to fetch user statistics
  const fetchUserStats = async () => {
    try {
      console.log("📊 Fetching user statistics");
      
      // Using a single query to get all counts
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name');
        
      if (error) {
        console.error("❌ Error fetching user stats:", error);
        showAlert('error', 'Failed to load user statistics');
        return;
      }
      
      if (data) {
        // Count users by role
        const total = data.length;
        const teachers = data.filter(user => user.role_name === 'teacher').length;
        const students = data.filter(user => user.role_name === 'student').length;
        const admins = data.filter(user => user.role_name === 'admin').length;
        
        console.log("✅ User statistics calculated:", { 
          total, 
          admins,
          teachers, 
          students 
        });
        
        setUserStats({
          total: total || 0,
          teachers: teachers || 0,
          students: students || 0
        });
      } else {
        console.log("⚠️ No user data returned from query");
        setUserStats({ total: 0, teachers: 0, students: 0 });
      }
    } catch (error) {
      console.error("❌ Exception when fetching user stats:", error);
      showAlert('error', 'An error occurred while retrieving user statistics');
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user ${userName}?`)) {
      return;
    }
    
    try {
      console.log("🗑️ Attempting to delete user:", userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error("❌ Error deleting user:", error);
        showAlert('error', `Failed to delete user: ${error.message}`);
        return;
      }
      
      console.log("✅ User deleted successfully:", userId);
      showAlert('success', 'User deleted successfully');
      
      // Refresh users list
      fetchUsers();
      fetchUserStats();
      
    } catch (error) {
      console.error("❌ Exception when deleting user:", error);
      showAlert('error', 'An unexpected error occurred while deleting user');
    }
  };
  
  // Handle editing a user (we'll just log it for now)
  const handleEditUser = (userId: string, userName: string) => {
    console.log("✏️ Edit user requested for:", userId, userName);
    showAlert('info', `Edit user functionality will be implemented soon for: ${userName}`);
  };
  
  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case 'admin': return "bg-red-100 text-red-800";
      case 'teacher': return "bg-green-100 text-green-800";
      case 'student': return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'inactive': return "bg-gray-100 text-gray-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  console.log('📊 Rendering dashboard for type:', dashboardType);
  
  const renderAdminDashboard = () => {
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
            <div className="p-2 bg-white/20 rounded-lg text-white">
              Role: Administrator (from localStorage: {getUserRole()})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-red-50 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Users</h3>
              <button 
                onClick={() => fetchUserStats()} 
                title="Refresh stats"
                className="text-gray-500 hover:text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-3xl font-bold">{userStats.total}</p>
            <p className="text-gray-600 text-sm">Total registered users</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Teachers</h3>
            <p className="text-3xl font-bold">{userStats.teachers}</p>
            <p className="text-gray-600 text-sm">Active teachers</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Students</h3>
            <p className="text-3xl font-bold">{userStats.students}</p>
            <p className="text-gray-600 text-sm">Enrolled students</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b">
                        {user.full_name || user.username}
                      </td>
                      <td className="px-4 py-3 border-b">{user.email}</td>
                      <td className="px-4 py-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role_name || '')}`}>
                          {user.role_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(user.status || 'active')}`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <button 
                          onClick={() => handleEditUser(user.id, user.full_name || user.username)}
                          className="text-blue-600 mr-2 hover:underline">
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.full_name || user.username)} 
                          className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <button 
              onClick={() => showAlert('info', 'Add user functionality coming soon!')} 
              className="bg-primary text-white px-4 py-2 rounded-lg">
              Add New User
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderTeacherDashboard = () => {
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
            <div className="p-2 bg-white/20 rounded-lg text-white">
              Role: Teacher (from localStorage: {getUserRole()})
            </div>
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

  const renderStudentDashboard = () => {
    return (
      <>
        <div className="bg-primary text-white rounded-xl shadow-md p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-white/80">
                Welcome back, {profile?.name || profile?.full_name || 'Student'}!
              </p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg text-white">
              Role: Student (from localStorage: {getUserRole()})
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <WelcomeCard />
          <StreakCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StudyChart />
          <SubjectsChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickNotes />
          <UpcomingTasks />
        </div>
      </>
    );
  };
  
  // Determine which dashboard to render based on dashboardType state
  const renderDashboardContent = () => {
    console.log('📊 Rendering dashboard content for type:', dashboardType);
    
    switch (dashboardType) {
      case 'admin':
        return renderAdminDashboard();
      case 'teacher':
        return renderTeacherDashboard();
      default:
        return renderStudentDashboard();
    }
  };

  // Main render
  return (
    <div className="flex h-screen bg-[url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center bg-fixed">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
          <div className="mb-6">
            <SearchBox />
          </div>

          {renderDashboardContent()}
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

export default Dashboard;