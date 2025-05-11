import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext';

const Register = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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
    
    try {
      setIsSubmitting(true);
      
      // Instead of registering here, navigate to role selection page with form data
      navigate('/select', { 
        state: { 
          registrationData: formData 
        }
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      showAlert('error', 'An unexpected error occurred');
      setIsSubmitting(false);
    }
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
                      disabled={isSubmitting}
                      className={`flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Next: Select Role <span className="bi bi-arrow-right ml-2"></span>
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
