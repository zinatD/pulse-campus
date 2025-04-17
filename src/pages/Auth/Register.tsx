import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabaseClient'; // Import shared client
import { useAlert } from '../../contexts/AlertContext';
import { parseApiError } from '../../utils/errorHandler';

interface Role {
  id: number;
  name: string;
  description: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const { showAlert } = useAlert();
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: 3, // Default to student role (id=3)
    studentId: '',
    registrationCode: '',
  });

  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, name, description')
          .order('id');
        
        if (error) throw error;
        if (data) setRoles(data);
      } catch (err) {
        console.error('Error fetching roles:', err);
        showAlert('error', 'Failed to load role options. Please refresh the page.');
      }
    };

    fetchRoles();
  }, [showAlert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'roleId' ? parseInt(value) : value,
    });

    // Reset code verification when role changes
    if (name === 'roleId') {
      setCodeVerified(false);
    }
  };

  const isAdminOrTeacher = () => {
    return formData.roleId === 1 || formData.roleId === 2;
  };

  const verifyRegistrationCode = async () => {
    if (!formData.registrationCode) {
      showAlert('error', 'Please enter a registration code');
      return;
    }

    try {
      setVerifyingCode(true);
      
      // First, get the role name for better error messages
      const roleName = getSelectedRoleName();
      
      // Simplified query to avoid policies issues
      const { data, error } = await supabase
        .from('registration_codes')
        .select('*')
        .eq('code', formData.registrationCode)
        .single();
      
      if (error) {
        console.error('Registration code verification error:', error);
        showAlert('error', `Invalid registration code: ${error.message}`);
        setCodeVerified(false);
        return;
      }
      
      // Manually check if the code matches the role and is unused
      if (!data || data.is_used) {
        showAlert('error', `This registration code has already been used`);
        setCodeVerified(false);
        return;
      }
      
      if (data.role_id !== formData.roleId) {
        showAlert('error', `This code is for a different role. Please select the correct role or use a different code.`);
        setCodeVerified(false);
        return;
      }
      
      showAlert('success', `Registration code verified successfully for ${roleName} role`);
      setCodeVerified(true);
    } catch (err) {
      console.error('Error verifying code:', err);
      showAlert('error', 'Failed to verify registration code');
      setCodeVerified(false);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters long');
      return;
    }
    
    // Role-specific validation
    if (formData.roleId === 3 && !formData.studentId) { // Student
      showAlert('error', 'Please enter your student ID');
      return;
    }
    
    if (isAdminOrTeacher() && !codeVerified) {
      showAlert('error', 'Please verify your registration code first');
      return;
    }
    
    try {
      const username = formData.email.split('@')[0]; // Create a simple username from email
      
      // Add extra profile data based on role
      const extraData: Record<string, any> = {
        name: formData.name,
        surname: formData.surname
      };
      
      // Add student ID if applicable
      if (formData.roleId === 3) {
        extraData.student_id = formData.studentId;
      }
      
      console.log('Registering with role ID:', formData.roleId);
      
      // Register user
      await signUp(
        formData.email, 
        formData.password, 
        username, 
        `${formData.name} ${formData.surname}`, 
        formData.roleId, // Ensure this is explicitly passed
        extraData
      );
      
      // If we got here, registration succeeded
      // If admin or teacher, mark the registration code as used
      if (isAdminOrTeacher()) {
        await supabase
          .from('registration_codes')
          .update({ is_used: true })
          .eq('code', formData.registrationCode);
      }
      
      showAlert('success', `Account created successfully as ${getSelectedRoleName()}!`);
      navigate('/dashboard');
    } catch (err) {
      const { message } = parseApiError(err);
      showAlert('error', message);
      
      // Log the error for debugging
      console.error('Registration error:', err);
    }
  };

  const getSelectedRoleName = () => {
    const role = roles.find(r => r.id === formData.roleId);
    return role?.name || '';
  };

  return (
    <section className="w-100 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <div className="w-full md:w-1/2 sm:w-2/3">
            <div className="text-center pt-0">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Welcome</h2>
                <h3 className="text-2xl font-medium text-primary">Pulse Camp</h3>
              </div>
            </div>
            <div className="bg-white rounded-lg border-0 shadow-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      required
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {isAdminOrTeacher() && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          {getSelectedRoleName()} Registration Code
                        </label>
                        {codeVerified && (
                          <span className="text-green-500 text-xs font-medium">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          name="registrationCode"
                          placeholder="Enter registration code"
                          value={formData.registrationCode}
                          onChange={handleChange}
                          required={isAdminOrTeacher()}
                        />
                        <button 
                          type="button"
                          onClick={verifyRegistrationCode}
                          disabled={verifyingCode || !formData.registrationCode || codeVerified}
                          className={`px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors ${
                            (verifyingCode || !formData.registrationCode || codeVerified) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {verifyingCode ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This code is required for {getSelectedRoleName()} registration
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Surname</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="surname"
                      placeholder="Enter your surname"
                      value={formData.surname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {formData.roleId === 3 && (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-1">Student ID</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        name="studentId"
                        placeholder="Enter your student ID number"
                        value={formData.studentId}
                        onChange={handleChange}
                        required={formData.roleId === 3}
                      />
                    </div>
                  )}

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
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="text-center mt-6 flex flex-wrap justify-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => navigate('/')}
                      className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                    >
                      <span className="bi bi-house mr-2"></span> Home Page
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading || (isAdminOrTeacher() && !codeVerified)}
                      className={`flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors ${
                        (isLoading || (isAdminOrTeacher() && !codeVerified)) ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Sign Up <span className="bi bi-arrow-right ml-2"></span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center mt-4 text-sm font-light text-green-900">
                    Already registered? <Link to="/" className="text-primary-dark hover:underline">Sign In</Link>
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

export default Register;
