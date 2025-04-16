import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BsPeople, BsPersonBadge, BsPersonCheck } from 'react-icons/bs';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const fetchUserStats = async () => {
      try {
        // Get teacher count (role_id = 2)
        const { count: teacherCount, error: teacherError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', 2);

        // Get student count (role_id = 3)
        const { count: studentCount, error: studentError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', 3);

        // Get total count of all users
        const { count: totalCount, error: totalError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (teacherError || studentError || totalError) throw new Error("Failed to fetch user statistics");

        setStats({
          totalUsers: totalCount || 0,
          teachers: teacherCount || 0,
          students: studentCount || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchUserStats();
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
