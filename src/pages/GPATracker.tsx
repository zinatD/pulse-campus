import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
  gradePoints: number;
}

const GPATracker = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: 'Mathematics 101', credits: 3, grade: 'A', gradePoints: 4.0 },
    { id: '2', name: 'Computer Science', credits: 4, grade: 'B+', gradePoints: 3.3 },
    { id: '3', name: 'Physics', credits: 3, grade: 'A-', gradePoints: 3.7 },
  ]);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const calculateGPA = () => {
    if (courses.length === 0) return 0;
    
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalPoints = courses.reduce((sum, course) => sum + (course.credits * course.gradePoints), 0);
    
    return totalPoints / totalCredits;
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
            <h1 className="text-2xl font-bold text-primary mb-4">GPA Tracker</h1>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
              <h2 className="text-xl mb-2">Your Current GPA</h2>
              <p className="text-4xl font-bold text-primary">{calculateGPA().toFixed(2)}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 border-b">Course Name</th>
                    <th className="px-4 py-2 border-b">Credits</th>
                    <th className="px-4 py-2 border-b">Grade</th>
                    <th className="px-4 py-2 border-b">Grade Points</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{course.name}</td>
                      <td className="px-4 py-2 border-b">{course.credits}</td>
                      <td className="px-4 py-2 border-b">{course.grade}</td>
                      <td className="px-4 py-2 border-b">{course.gradePoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
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

export default GPATracker;
