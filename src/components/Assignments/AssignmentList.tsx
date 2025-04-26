import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import supabase from '../../lib/supabaseClient';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description: string;
  file_url?: string;
  created_at: string;
  due_date: string;
  course_id: number;
  created_by: string;
  status?: string;
}

const AssignmentList = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, getUserRole } = useAuth();
  const { showAlert } = useAlert();
  const isTeacher = getUserRole() === 'teacher' || getUserRole() === 'admin';

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('assignments').select('*');

      if (!isTeacher) {
        // For students, only fetch assignments assigned to them
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showAlert('error', 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('assignment_recipients')
        .update({ status: newStatus })
        .eq('assignment_id', assignmentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      showAlert('success', 'Assignment status updated');
      fetchAssignments();
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('error', 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No assignments found</p>
        </div>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{assignment.title}</h3>
              {!isTeacher && (
                <select
                  value={assignment.status || 'pending'}
                  onChange={(e) => handleStatusUpdate(assignment.id, e.target.value)}
                  className="ml-4 px-3 py-1 border rounded-md text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="viewed">Viewed</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{assignment.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                <i className="far fa-calendar-alt mr-2"></i>
                Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
              </span>
              
              {assignment.file_url && (
                <a 
                  href={assignment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark"
                >
                  <i className="fas fa-paperclip mr-2"></i>
                  View Attachment
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AssignmentList;