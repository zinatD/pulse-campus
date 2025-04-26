import { useState, useEffect } from 'react';
import { BsPeople, BsPersonBadge, BsPersonCheck } from 'react-icons/bs';
import supabase from '../../../lib/supabaseClient'; // Import shared client

interface UserStats {
  totalUsers: number;
  teachers: number;
  students: number;
  isLoading: boolean;
}

const UserStatistics = () => {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    teachers: 0,
    students: 0,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchUserStats = async () => {
      // Prevent fetching if we already have stats
      if (stats.totalUsers > 0 && !stats.isLoading) return;
      
      try {
        // Add timeout for stats fetch
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            controller.abort();
            console.error("⏱️ Stats fetch timed out");
            setStats(prev => ({ ...prev, isLoading: false }));
          }
        }, 8000);
        
        // Using Promise.all to run queries in parallel for better performance
        // Query profiles directly without relation to roles
        const [teacherResult, studentResult, totalResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', 2),
            
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', 3),
            
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
        ]);
        
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        const teacherCount = teacherResult.count;
        const studentCount = studentResult.count;
        const totalCount = totalResult.count;
        
        const errors = [
          teacherResult.error, 
          studentResult.error, 
          totalResult.error
        ].filter(Boolean);
        
        if (errors.length > 0) {
          console.error("Failed to fetch user statistics:", errors);
          return;
        }

        setStats({
          totalUsers: totalCount || 0,
          teachers: teacherCount || 0,
          students: studentCount || 0,
          isLoading: false,
        });
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching user statistics:', error);
          setStats(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchUserStats();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (stats.isLoading) {
    return <div className="card-base bg-blue-50 flex justify-center items-center p-6">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="card-base bg-blue-50">
      <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <BsPeople className="text-blue-600 text-2xl" />
            <span className="text-2xl font-bold">{stats.totalUsers}</span>
          </div>
          <p className="text-gray-600 mt-2 text-sm">Total Users</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <BsPersonBadge className="text-green-600 text-2xl" />
            <span className="text-2xl font-bold">{stats.teachers}</span>
          </div>
          <p className="text-gray-600 mt-2 text-sm">Teachers</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <BsPersonCheck className="text-amber-600 text-2xl" />
            <span className="text-2xl font-bold">{stats.students}</span>
          </div>
          <p className="text-gray-600 mt-2 text-sm">Students</p>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
