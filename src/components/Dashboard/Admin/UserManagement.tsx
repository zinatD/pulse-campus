import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { useAlert } from '../../../contexts/AlertContext';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  name: string | null;
  surname: string | null;
  student_id: string | null;
  role_id: number;
  role_name?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert } = useAlert();
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          full_name,
          name,
          surname,
          student_id,
          role_id
        `)
        .order('role_id');

      // Apply search if provided
      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      // Calculate pagination
      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;
      
      if (data) {
        // Fetch role names separately
        const enrichedUsers = await Promise.all(data.map(async user => {
          const { data: roleData } = await supabase
            .from('roles')
            .select('name')
            .eq('id', user.role_id)
            .single();
            
          return {
            ...user,
            role_name: roleData?.name || 'Unknown'
          };
        }));
        
        setUsers(enrichedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert('error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      showAlert('success', 'User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      showAlert('error', 'Failed to delete user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeClass = (roleId: number) => {
    switch (roleId) {
      case 1: return "bg-red-100 text-red-800"; // Admin
      case 2: return "bg-green-100 text-green-800"; // Teacher
      case 3: return "bg-blue-100 text-blue-800"; // Student
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="card-base">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="px-3 py-1 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="bg-primary text-white p-2 rounded-md hover:bg-primary-dark" 
            title="Add New User"
          >
            <BsPlus className="text-lg" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Email</th>
              <th className="px-3 py-2 border-b">Username</th>
              <th className="px-3 py-2 border-b">Role</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">
                    {user.name && user.surname 
                      ? `${user.name} ${user.surname}`
                      : user.full_name || user.username}
                  </td>
                  <td className="px-3 py-2 border-b">{user.email}</td>
                  <td className="px-3 py-2 border-b">{user.username}</td>
                  <td className="px-3 py-2 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role_id)}`}>
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit User"
                      >
                        <BsPencil />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800"
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <BsTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {users.length} users
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span className="text-sm">{currentPage}</span>
          <button
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
            disabled={users.length < usersPerPage}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
