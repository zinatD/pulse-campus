import { BsCalendarCheck } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const AttendanceCard = () => {
  const [lastAttendance, setLastAttendance] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Fetch the user's latest attendance record
    const fetchLastAttendance = async () => {
      try {
        setLoading(true);
        // You would replace this with your actual API endpoint
        const response = await axios.get('http://localhost:5000/api/attendance/latest');
        setLastAttendance(response.data.status);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
        // Set to null if there's an error or no attendance record
        setLastAttendance(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLastAttendance();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <BsCalendarCheck className="text-blue-600" /> Attendance
      </h2>
      
      <div className="mb-3">
        {loading ? (
          <p className="text-gray-500">Loading attendance status...</p>
        ) : (
          <p className="text-gray-800">Today's Status: 
            <span className={`ml-2 font-medium ${
              lastAttendance === "Present" ? "text-green-600" : 
              lastAttendance === "Late" ? "text-amber-600" : 
              lastAttendance === "Absent" ? "text-red-600" : "text-gray-600"
            }`}>
              {lastAttendance || "Not marked"}
            </span>
          </p>
        )}
      </div>
      
      <Link to="/attendance" className="text-blue-600 hover:underline text-sm font-medium">
        Mark attendance →
      </Link>
    </div>
  );
};

export default AttendanceCard;