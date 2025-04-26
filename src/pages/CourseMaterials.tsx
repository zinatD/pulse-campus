import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import supabase from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';

interface Material {
  id: string;
  name: string;
  type: 'note' | 'pdf' | 'image';
  content?: string;
  file_url?: string;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  instructor_name: string | null;
  user_id: string;
}

const CourseMaterials = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'note' as const,
    content: '',
    file: null as File | null
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fetch course and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, name, instructor_name, user_id')
          .eq('id', courseId)
          .single();

        if (courseError) {
          showAlert('error', 'Course not found');
          navigate('/courses');
          return;
        }

        setCourse(courseData);

        // Fetch materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('course_materials')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });

        if (materialsError) throw materialsError;
        setMaterials(materialsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('error', 'Failed to load course materials');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, navigate]);

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${courseId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.id || !courseId || !course) {
        throw new Error('Missing required data');
      }

      // Verify user owns the course
      if (course.user_id !== user.id) {
        showAlert('error', 'You do not have permission to add materials to this course');
        return;
      }

      let fileUrl = null;
      if (formData.type !== 'note' && formData.file) {
        fileUrl = await handleFileUpload(formData.file);
      }

      const { error } = await supabase
        .from('course_materials')
        .insert([{
          course_id: parseInt(courseId),
          name: formData.name,
          type: formData.type,
          content: formData.type === 'note' ? formData.content : null,
          file_url: fileUrl,
          user_id: user.id
        }]);

      if (error) throw error;

      showAlert('success', 'Material added successfully!');
      setShowAddModal(false);
      setFormData({ name: '', type: 'note', content: '', file: null });
      
      // Refresh materials list
      const { data: newMaterials } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
        
      if (newMaterials) {
        setMaterials(newMaterials);
      }
    } catch (error) {
      console.error('Error adding material:', error);
      showAlert('error', 'Failed to add material');
    }
  };

  // This check determines whether to show the Add button
  const canAddMaterials = course?.user_id === user?.id;

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
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-primary">{course?.name}</h1>
                    {course?.instructor_name && (
                      <p className="text-gray-600">
                        <i className="fas fa-chalkboard-teacher mr-2"></i>
                        {course.instructor_name}
                      </p>
                    )}
                  </div>
                  {canAddMaterials && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i> Add Material
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'notes'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <i className="fas fa-sticky-note mr-2"></i> Notes
                      </button>
                      <button
                        onClick={() => setActiveTab('files')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'files'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <i className="fas fa-file mr-2"></i> Files
                      </button>
                    </nav>
                  </div>

                  <div className="mt-6">
                    {activeTab === 'notes' ? (
                      <div className="space-y-4">
                        {materials
                          .filter(m => m.type === 'note')
                          .map(note => (
                            <div key={note.id} className="bg-green-50 rounded-lg p-4">
                              <h3 className="font-semibold mb-2">{note.name}</h3>
                              <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                              <div className="mt-2 text-sm text-gray-500">
                                Added {new Date(note.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials
                          .filter(m => m.type !== 'note')
                          .map(file => (
                            <div key={file.id} className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <i className={`fas fa-${file.type === 'pdf' ? 'file-pdf' : 'image'} text-primary mr-2`}></i>
                                <h3 className="font-semibold">{file.name}</h3>
                              </div>
                              <a
                                href={file.file_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-dark"
                              >
                                View File →
                              </a>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add Material Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Material</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'note' | 'pdf' | 'image' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="note">Note</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                    </select>
                  </div>

                  {formData.type === 'note' ? (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={5}
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        File
                      </label>
                      <input
                        type="file"
                        accept={formData.type === 'pdf' ? '.pdf' : 'image/*'}
                        onChange={e => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
                    >
                      Add Material
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

export default CourseMaterials;