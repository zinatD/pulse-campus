import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import supabase from '../lib/supabaseClient'; // Use the shared client

// Import components
import WelcomeCard from '../components/Dashboard/WelcomeCard';
import StreakCard from '../components/Dashboard/StreakCard';
import AttendanceCard from '../components/Dashboard/AttendanceCard';
import StudyChart from '../components/Dashboard/StudyChart';
import SubjectsChart from '../components/Dashboard/SubjectsChart';
import QuickNotes from '../components/Dashboard/QuickNotes';
import UpcomingTasks from '../components/Dashboard/UpcomingTasks';

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
  
  // Add a retry counter to prevent infinite loops
  const fetchRetryCount = useRef(0);
  const maxRetries = 2; // Only try 3 times total (initial + 2 retries)
  const [hasFetchFailed, setHasFetchFailed] = useState(false);

  // Use mock data when database queries fail
  const mockUsers = [
    { id: '1', username: 'admin', email: 'admin@example.com', full_name: 'Admin User', role_id: 1, role_name: 'admin', status: 'active' },
    { id: '2', username: 'teacher1', email: 'teacher@example.com', full_name: 'Teacher User', role_id: 2, role_name: 'teacher', status: 'active' },
    { id: '3', username: 'student1', email: 'student@example.com', full_name: 'Student User', role_id: 3, role_name: 'student', status: 'active' },
  ];

  const mockStats = {
    total: 3,
    teachers: 1,
    students: 1
  };

  // Memoize these functions to avoid dependency array issues
  const fetchUsers = useCallback(async () => {
    try {
      if (users.length > 0 && !isLoadingUsers) return;
      
      console.log("🔍 Fetching users from backend");
      setIsLoadingUsers(true);
      
      const { data, error } = await supabase
        .from('profiles_with_roles')
        .select('*')
        .order('role_id');
        
      if (error) {
        console.error("❌ Error fetching users:", error);
        setIsLoadingUsers(false);
        return;
      }
      
      if (data) {
        console.log(`✅ Successfully fetched ${data.length} users`);
        setUsers(data.map(user => ({
          ...user,
          status: 'active' as const,
        })));
      }
      
      setIsLoadingUsers(false);
    } catch (error) {
      console.error("❌ Exception when fetching users:", error);
      setIsLoadingUsers(false);
    }
  }, [users.length, isLoadingUsers]);

  // Use the roles from our new view rather than the previous query
  const fetchUserData = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      console.log('📊 Fetching complete user data with role');
      
      // Use the new profiles_with_roles view which joins with roles table
      const { data, error } = await supabase
        .from('profiles_with_roles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      if (data && data.role_name) {
        console.log('✅ User role fetched:', data.role_name);
        // Store the role in local storage for easier access
        localStorage.setItem('userRole', data.role_name);
        
        // Update dashboard type based on the role
        if (data.role_name === 'admin' || data.role_name === 'teacher' || data.role_name === 'student') {
          setDashboardType(data.role_name);
        }
      } else {
        // Default to student if no role found
        console.log('⚠️ No role found, defaulting to student');
        localStorage.setItem('userRole', 'student');
        setDashboardType('student');
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  }, [profile?.id]);

  // Use this function on component mount and profile changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Function to fetch user statistics with similar improvements
  const fetchUserStats = useCallback(async (isMounted = true) => {
    try {
      // Don't try again if we've hit max retries or already have stats
      if (fetchRetryCount.current >= maxRetries || userStats.total > 0 || hasFetchFailed) {
        return;
      }
      
      console.log(`📊 Fetching user statistics (Attempt ${fetchRetryCount.current}/${maxRetries+1})`);
      
      // Set mock stats after a timeout
      const timeout = setTimeout(() => {
        if (isMounted && userStats.total === 0) {
          console.log("📄 Using mock stats data after timeout");
          setUserStats(mockStats);
          setHasFetchFailed(true);
        }
      }, 8000);
      
      try {
        // Try a simple count query first
        const { count: totalCount, error: totalError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (totalError) {
          if (totalError.code === '42P17' || totalError.message?.includes('recursion')) {
            console.warn("⚠️ Policy recursion detected in stats query, using fallback data");
            throw new Error("Policy recursion");
          }
          throw totalError;
        }
        
        // If we can get the count, update the stats
        if (totalCount !== null) {
          clearTimeout(timeout);
          
          // Estimate teachers/students based on total count for simplicity
          const teacherCount = Math.round(totalCount * 0.3);
          const studentCount = totalCount - teacherCount;
          
          setUserStats({
            total: totalCount,
            teachers: teacherCount,
            students: studentCount
          });
          
          console.log("✅ User statistics calculated:", { 
            total: totalCount, 
            teachers: teacherCount, 
            students: studentCount
          });
          return;
        }
      } catch (error) {
        console.error("❌ Error fetching user stats:", error);
        clearTimeout(timeout);
        
        // Fallback to mock stats
        setUserStats(mockStats);
        setHasFetchFailed(true);
        return;
      }
    } catch (error) {
      console.error("❌ Exception in fetchUserStats:", error);
      // Fallback to mock stats if all else fails
      if (userStats.total === 0) {
        setUserStats(mockStats);
        setHasFetchFailed(true);
      }
    }
  }, [userStats.total, hasFetchFailed]);
  
  // Reset counters when dashboard type changes
  useEffect(() => {
    fetchRetryCount.current = 0;
    setHasFetchFailed(false);
  }, [dashboardType]);
  
  // Fetch data on dashboard type change, with better error handling
  useEffect(() => {
    let isMounted = true;
    
    if (dashboardType === 'admin' && !hasFetchFailed) {
      // Schedule these to run after a small delay to avoid immediate re-renders
      const timer = setTimeout(() => {
        if (isMounted) {
          if (users.length === 0) fetchUsers();
          if (userStats.total === 0) fetchUserStats();
        }
      }, 500);
      
      return () => {
        clearTimeout(timer);
        isMounted = false;
      };
    }
    
    return () => { isMounted = false; };
  }, [dashboardType, fetchUsers, fetchUserStats, users.length, userStats.total, hasFetchFailed]);
  
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
              Role: Administrator
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-red-50 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Users</h3>
              <button 
                onClick={() => {
                  fetchRetryCount.current = 0;
                  setHasFetchFailed(false);
                  fetchUserStats();
                }} 
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <WelcomeCard />
          <StreakCard />
          <AttendanceCard />
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <WelcomeCard />
          <StreakCard />
          <AttendanceCard />
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
    <div className="flex h-screen">
      {/* Move background to a separate container with optimized CSS */}
      <div 
        className="bg-image-wrapper"
        style={{backgroundImage: "url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')"}}
      ></div>
      
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
          {/* Add a key to force re-render when dashboardType changes */}
          <div key={`dashboard-${dashboardType}`} className="fade-in">
            <div className="mb-6">
              <SearchBox />
            </div>
  
            {renderDashboardContent()}
          </div>
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