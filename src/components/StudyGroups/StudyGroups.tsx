import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import supabase from '../../lib/supabaseClient';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

interface GroupMember {
  group_id: string;
  user_id: string;
  username: string;
  joined_at: string;
}

const StudyGroups = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [members, setMembers] = useState<Record<string, GroupMember[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (groups) {
        setGroups(groups);
        // Fetch members for each group
        await Promise.all(groups.map(group => fetchGroupMembers(group.id)));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      showAlert('error', 'Failed to load study groups');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('study_group_members')
        .select('*, profiles(username)')
        .eq('group_id', groupId);

      if (error) throw error;

      if (data) {
        setMembers(prev => ({
          ...prev,
          [groupId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createGroup = async () => {
    try {
      if (!user) {
        showAlert('error', 'You must be logged in to create a group');
        return;
      }

      if (!formData.name.trim()) {
        showAlert('error', 'Please enter a group name');
        return;
      }

      const inviteCode = Math.random().toString(36).substring(2, 8);

      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert([{
          name: formData.name,
          description: formData.description,
          created_by: user.id,
          invite_code: inviteCode
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id
        }]);

      if (memberError) throw memberError;

      showAlert('success', 'Study group created successfully!');
      setFormData({ name: '', description: '' });
      setShowModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('error', 'Failed to create study group');
    }
  };

  const shareGroup = async (group: StudyGroup) => {
    const shareUrl = `${window.location.origin}/join-group/${group.invite_code}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      showAlert('success', 'Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showAlert('error', 'Failed to copy invite link');
    }
  };

  return (
    <div className="min-h-screen bg-pastel-mint p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-2 border-dashed border-accent-green">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-green mb-2">Study Groups</h1>
            <p className="text-accent-green text-lg">Learn together with your friends! 🌱✨</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading study groups...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length === 0 ? (
              <div className="col-span-full text-center bg-white rounded-xl shadow-md p-8">
                <h2 className="text-xl font-bold text-dark-green mb-3">No Study Groups Yet</h2>
                <p className="text-gray-600 mb-4">Create your first group to start learning with friends!</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-accent-green text-white px-6 py-2 rounded-full hover:bg-dark-green transition-colors"
                >
                  Create Group
                </button>
              </div>
            ) : (
              groups.map(group => (
                <div 
                  key={group.id} 
                  className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform"
                  style={{ transform: `rotate(${Math.random() * 2 - 1}deg)` }}
                >
                  <h3 className="text-xl font-bold text-dark-green mb-3">{group.name}</h3>
                  <p className="text-gray-600 mb-4">{group.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {members[group.id]?.map(member => (
                      <span 
                        key={member.user_id}
                        className="bg-pastel-mint px-3 py-1 rounded-full text-sm text-dark-green"
                      >
                        <i className="bi bi-person-circle mr-1"></i>
                        {member.username}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 border-2 border-accent-green text-dark-green rounded-full hover:bg-pastel-teal transition-colors"
                      onClick={() => shareGroup(group)}
                    >
                      Share
                    </button>
                    <button className="px-4 py-2 bg-accent-green text-white rounded-full hover:bg-dark-green transition-colors">
                      Enter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Group Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-dark-green mb-4">Create New Group</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. Biology Buddies"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="What will you study together?"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  className="px-4 py-2 bg-accent-green text-white rounded-md hover:bg-dark-green"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-accent-green text-white rounded-full shadow-lg hover:bg-dark-green transition-colors flex items-center justify-center text-2xl"
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default StudyGroups;