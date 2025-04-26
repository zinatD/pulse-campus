import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import supabase from '../lib/supabaseClient';

interface Course {
  id: number;
  name: string;
  description: string | null;
  instructor_id: string | null;
  created_at: string;
  updated_at: string;
  public: boolean;
  created_by: string | null;
}

const Courses = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showAlert('error', 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('error', 'Please enter a course name');
      return;
    }

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create course with the simplified permissions model
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            public: true,                // Make it public by default
            created_by: user.id,         // Set creator directly
            instructor_id: user.id       // For backward compatibility
          }
        ])
        .select()
        .single();

      if (error) throw error;

      showAlert('success', 'Course added successfully!');
      setFormData({ name: '', description: '' });
      setShowModal(false);
      fetchCourses();
    } catch (error: any) {
      console.error('Error adding course:', error);
      showAlert('error', `Failed to add course: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="flex h-screen bg-[url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center bg-fixed">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
          <div className="mb-6">
            <SearchBox />
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-primary">📚 My Courses</h1>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i> Add Course
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-10">
                <i className="fas fa-book-open text-4xl text-gray-400 mb-3"></i>
                <h3 className="text-xl font-semibold text-gray-600">No courses yet</h3>
                <p className="text-gray-500">Add your first course to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-green-50 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-xl font-semibold text-primary mb-2">{course.name}</h3>
                    {course.description && (
                      <p className="text-gray-600 mb-4">{course.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Added {new Date(course.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="text-primary hover:text-primary-dark"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Course Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Course</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
                    >
                      Add Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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

export default Courses;