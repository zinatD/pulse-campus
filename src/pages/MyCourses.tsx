import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';

interface Course {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  progress: number;
}

const MyCourses = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([
    { 
      id: '1', 
      name: 'Calculus I', 
      instructor: 'Dr. Smith',
      schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
      progress: 65
    },
    { 
      id: '2', 
      name: 'Introduction to Programming', 
      instructor: 'Prof. Johnson',
      schedule: 'Tue, Thu 1:00 PM - 2:30 PM',
      progress: 80
    },
    { 
      id: '3', 
      name: 'Physics Fundamentals', 
      instructor: 'Dr. Williams',
      schedule: 'Mon, Wed, Fri 2:00 PM - 3:00 PM',
      progress: 45
    },
  ]);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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
            <h1 className="text-2xl font-bold text-primary mb-4">My Courses</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                  <div className="p-5">
                    <h2 className="font-bold text-lg text-primary mb-2">{course.name}</h2>
                    <p className="text-gray-600 text-sm mb-1">Instructor: {course.instructor}</p>
                    <p className="text-gray-600 text-sm mb-3">{course.schedule}</p>
                    
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-primary">
                            Progress
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-primary">
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${course.progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        ></div>
                      </div>
                    </div>
                    
                    <button className="mt-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                Add New Course
              </button>
            </div>
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

export default MyCourses;
