import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';

interface Event {
  id: string;
  title: string;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  color: string;
}

const Scheduler = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    { 
      id: '1', 
      title: 'Calculus Study',
      day: 1, // Monday
      startTime: '10:00',
      endTime: '12:00',
      color: '#a8e6cf'
    },
    { 
      id: '2', 
      title: 'Programming Lab',
      day: 2, // Tuesday
      startTime: '14:00',
      endTime: '16:00',
      color: '#ffaaa5'
    },
    { 
      id: '3', 
      title: 'Physics Review',
      day: 4, // Thursday
      startTime: '09:00',
      endTime: '11:00',
      color: '#ffd3b6'
    }
  ]);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Get the days of the current week
  const startOfCurrentWeek = startOfWeek(currentDate);
  const daysOfWeek = [...Array(7)].map((_, i) => addDays(startOfCurrentWeek, i));
  
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
              <h1 className="text-2xl font-bold text-primary">Scheduler</h1>
              
              <div className="flex items-center gap-2">
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  &lt; Prev Week
                </button>
                <span className="font-medium">
                  Week of {format(startOfCurrentWeek, 'MMM d, yyyy')}
                </span>
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Next Week &gt;
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 bg-gray-50 border-r"></div>
                {daysOfWeek.map((day, index) => (
                  <div key={index} className="p-2 text-center font-medium bg-gray-50 border-r last:border-r-0">
                    <div>{format(day, 'EEE')}</div>
                    <div>{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-8 h-[600px]">
                <div className="border-r">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-[50px] px-2 text-right text-xs text-gray-500 border-b">
                      {(i + 8) % 12 === 0 ? '12' : (i + 8) % 12}:00 {i + 8 >= 12 ? 'PM' : 'AM'}
                    </div>
                  ))}
                </div>
                
                {daysOfWeek.map((_, dayIndex) => (
                  <div key={dayIndex} className="border-r last:border-r-0 relative">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="h-[50px] border-b"></div>
                    ))}
                    
                    {events
                      .filter(event => event.day === dayIndex)
                      .map(event => {
                        const startHour = parseInt(event.startTime.split(':')[0]);
                        const startMinute = parseInt(event.startTime.split(':')[1]);
                        const startPosition = (startHour - 8) * 50 + (startMinute / 60) * 50;
                        
                        const endHour = parseInt(event.endTime.split(':')[0]);
                        const endMinute = parseInt(event.endTime.split(':')[1]);
                        const height = (endHour - startHour) * 50 + ((endMinute - startMinute) / 60) * 50;
                        
                        return (
                          <div 
                            key={event.id}
                            className="absolute left-0 right-0 rounded p-1 overflow-hidden text-xs text-white"
                            style={{
                              top: `${startPosition}px`,
                              height: `${height}px`,
                              backgroundColor: event.color
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div>{event.startTime} - {event.endTime}</div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                Add New Event
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

export default Scheduler;
