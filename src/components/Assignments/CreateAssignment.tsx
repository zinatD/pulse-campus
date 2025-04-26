import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import supabase from '../../lib/supabaseClient';

interface FormData {
  title: string;
  description: string;
  dueDate: string;
  courseId: number;
}

interface Student {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  name?: string;
  surname?: string;
}

const CreateAssignment = ({ onSuccess }: { onSuccess: () => void }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { showAlert } = useAlert();

  // Fetch students when component mounts
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, full_name, name, surname')
          .eq('role_id', 3); // Student role_id is 3

        if (error) throw error;
        
        if (data) {
          // Transform the data to include display names
          const formattedStudents = data.map(student => ({
            ...student,
            displayName: student.full_name || 
                        (student.name && student.surname ? `${student.name} ${student.surname}` : student.username)
          }));
          setStudents(formattedStudents);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        showAlert('error', 'Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [showAlert]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/assignments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!user?.id || selectedStudents.length === 0) {
        showAlert('error', 'Please select at least one student');
        return;
      }

      setIsLoading(true);

      let fileUrl = null;
      if (file) {
        fileUrl = await uploadFile();
      }

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert([{
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          course_id: data.courseId,
          created_by: user.id,
          file_url: fileUrl
        }])
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Add recipients
      const recipients = selectedStudents.map(student => ({
        assignment_id: assignment.id,
        user_id: student.id
      }));

      const { error: recipientsError } = await supabase
        .from('assignment_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      showAlert('success', 'Assignment created successfully');
      reset();
      setFile(null);
      setSelectedStudents([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating assignment:', error);
      showAlert('error', 'Failed to create assignment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="datetime-local"
          {...register('dueDate', { required: 'Due date is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        />
        {errors.dueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
        <Select
          isMulti
          isLoading={isLoading}
          options={students.map(student => ({
            value: student.id,
            label: student.displayName || student.email
          }))}
          onChange={(selected) => {
            setSelectedStudents(
              selected.map(option => students.find(s => s.id === option.value)!)
            );
          }}
          className="mt-1"
          placeholder={isLoading ? "Loading students..." : "Select students..."}
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );
};

export default CreateAssignment;