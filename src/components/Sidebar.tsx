import { BiCommand } from 'react-icons/bi';
import { BsSliders2Vertical, BsTextareaT, BsPersonGear, BsTextareaResize, BsCardText } from 'react-icons/bs';
import { Link } from 'react-router-dom';

const Sidebar = ({ isCollapsed, toggleSidebar }: { isCollapsed: boolean; toggleSidebar: () => void }) => {
  return (
    <aside className={`bg-primary max-w-[264px] min-w-[264px] h-screen overflow-y-auto transition-all duration-300 ease-in-out ${isCollapsed ? '-ml-[264px]' : ''}`}>
      <div className="h-full">
        <div className="p-4">
          <Link to="/dashboard" className="text-gray-100 text-lg font-semibold flex items-center gap-2">
            <BiCommand /> Pulse Camp
          </Link>
        </div>
        
        <ul className="mt-4">
          <li className="text-gray-100 text-xs px-6 py-4 border-t border-white/20">pages</li>
          
          <li>
            <Link to="/dashboard" className="sidebar-link flex items-center gap-2">
              <BsSliders2Vertical /> Dashboard
            </Link>
          </li>
          
          <li>
            <Link to="/gpa-tracker" className="sidebar-link flex items-center gap-2">
              <BsTextareaT /> GPA tracker
            </Link>
          </li>
          
          <li>
            <Link to="/study-room" className="sidebar-link flex items-center gap-2">
              <BsPersonGear /> Study Room
            </Link>
          </li>
          
          <li>
            <Link to="/courses" className="sidebar-link flex items-center gap-2">
              <BsTextareaResize /> My Courses
            </Link>
          </li>
          
          <li>
            <Link to="/scheduler" className="sidebar-link flex items-center gap-2">
              <BsCardText /> Scheduler
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;