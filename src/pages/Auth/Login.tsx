import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { parseApiError } from '../../utils/errorHandler';
import supabase from '../../lib/supabaseClient'; // Import shared client

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, setUserRole } = useAuth();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Function to fetch role directly from the database
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 Fetching role for user:', userId);
      
      // First try to get role from auth metadata as the most reliable source
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user?.user_metadata?.role_id) {
        const roleId = userData.user.user_metadata.role_id;
        console.log('✅ Found role_id in auth metadata:', roleId);
        
        // Convert role_id to role name
        const roleName = roleId === 1 ? 'admin' : 
                         roleId === 2 ? 'teacher' : 'student';
        console.log('👑 Role from metadata:', roleName);
        return roleName;
      }
      
      // If metadata approach fails, try database queries
      try {
        // First, get the user's profile to find their role_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role_id')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          // Check if this is a policy error
          if (profileError.code === '42P17' || 
              profileError.message?.includes('policy')) {
            console.warn('⚠️ Policy error when fetching profile, using alternative approach');
            throw profileError; // Skip to the catch block
          }
          
          console.error('Error getting profile role_id:', profileError);
          return 'student'; // Default fallback
        }
        
        if (!profileData) {
          console.error('No profile data found');
          return 'student';
        }
        
        // Now get the role name using the role_id (which is an integer)
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('name')
          .eq('id', profileData.role_id)
          .single();
          
        if (roleError || !roleData) {
          console.error('Error getting role name:', roleError);
          // Convert role_id to role name as fallback
          return profileData.role_id === 1 ? 'admin' : 
                 profileData.role_id === 2 ? 'teacher' : 'student';
        }
        
        console.log('👑 Role from database:', roleData.name);
        return roleData.name;
      } catch (dbError) {
        console.error('Database error when fetching role:', dbError);
        
        // Get the session user again as a last resort
        const { data } = await supabase.auth.getSession();
        const sessionUser = data?.session?.user;
        
        if (sessionUser?.user_metadata?.role_id) {
          const roleId = sessionUser.user_metadata.role_id;
          const roleName = roleId === 1 ? 'admin' : 
                          roleId === 2 ? 'teacher' : 'student';
          console.log('🆘 Using role from session metadata:', roleName);
          return roleName;
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
    
    console.warn('⚠️ Defaulting to student role after all attempts failed');
    return 'student'; // Ultimate default fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      showAlert('error', 'Please fill in all fields');
      return;
    }
    
    try {
      await signIn(formData.email, formData.password);
      
      // Get the current user to get the ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch the role directly and set it
        const roleName = await fetchUserRole(user.id);
        setUserRole(roleName);
        console.log('Role set after login:', roleName);
      }
      
      showAlert('success', 'Successfully signed in!');
      navigate('/dashboard');
    } catch (err) {
      const { message, code } = parseApiError(err);
      showAlert('error', message);
      
      // Log the error for debugging
      console.error('Login error:', { error: err, code });
    }
  };

  return (
    <section className="w-100 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <div className="w-full md:w-1/2 sm:w-2/3">
            <div className="text-center pt-0">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                <h3 className="text-2xl font-medium text-primary">Pulse Camp</h3>
              </div>
            </div>
            <div className="bg-white rounded-lg border-0 shadow-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="text-primary hover:text-primary-dark">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <div className="text-center mt-6 flex flex-wrap justify-center gap-3">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className={`flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In <span className="bi bi-arrow-right ml-2"></span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center mt-4 text-sm font-light text-green-900">
                    Don't have an account? <Link to="/register" className="text-primary-dark hover:underline">Sign Up</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background image for decoration - using local image */}
      <div 
        className="fixed -z-10 inset-0"
        style={{
          backgroundImage: "url('/assets/img/sr.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
    </section>
  );
};

export default Login;
