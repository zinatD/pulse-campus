import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SearchBox from '../components/SearchBox';
import { useAuth } from '../contexts/AuthContext';
import { BsStickies, BsPlusLg, BsPencilFill, BsTrash } from 'react-icons/bs';

// Define a note interface
interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
  isPinned: boolean;
}

const Notes = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile } = useAuth();
  
  // State for notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ffffff');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ref for the note content textarea
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('userNotes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(parsedNotes);
      } catch (error) {
        console.error('Error parsing saved notes:', error);
      }
    } else {
      // If no saved notes, add some example notes
      const exampleNotes: Note[] = [
        {
          id: 'note1',
          title: 'Welcome to Notes',
          content: 'This is where you can keep track of all your important information. Create, edit, and organize your notes easily.',
          color: '#c0e6ff',
          createdAt: new Date(),
          isPinned: true
        },
        {
          id: 'note2',
          title: 'Study Tips',
          content: '1. Use active recall\n2. Study in short, focused sessions\n3. Teach what you learn to someone else\n4. Take breaks and get enough sleep',
          color: '#d0f0c0',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          isPinned: false
        },
        {
          id: 'note3',
          title: 'Project Ideas',
          content: '- Mobile app for tracking habits\n- Website for sharing study resources\n- Research paper on AI in education',
          color: '#ffd6e0',
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          isPinned: false
        }
      ];
      setNotes(exampleNotes);
      localStorage.setItem('userNotes', JSON.stringify(exampleNotes));
    }
  }, []);
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('userNotes', JSON.stringify(notes));
    }
  }, [notes]);
  
  // Handle creating a new note
  const handleCreateNote = () => {
    setActiveNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('#ffffff');
    setIsCreating(true);
    setIsEditing(true);
    
    // Focus on the title input after the component renders
    setTimeout(() => {
      const titleInput = document.getElementById('note-title');
      if (titleInput) titleInput.focus();
    }, 100);
  };
  
  // Handle saving a note
  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      showAlert('error', 'Please add a title for your note');
      return;
    }
    
    if (activeNote) {
      // Update existing note
      const updatedNotes = notes.map(note => 
        note.id === activeNote.id 
          ? { 
            ...note, 
            title: noteTitle,
            content: noteContent,
            color: noteColor
          } 
          : note
      );
      setNotes(updatedNotes);
      setActiveNote({
        ...activeNote,
        title: noteTitle,
        content: noteContent,
        color: noteColor
      });
      showAlert('success', 'Note updated successfully');
    } else {
      // Create new note
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: noteTitle,
        content: noteContent,
        color: noteColor,
        createdAt: new Date(),
        isPinned: false
      };
      setNotes([newNote, ...notes]);
      setActiveNote(newNote);
      setIsCreating(false);
      showAlert('success', 'Note created successfully');
    }
    setIsEditing(false);
  };
  
  // Handle deleting a note
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(null);
        setIsEditing(false);
      }
      
      showAlert('success', 'Note deleted successfully');
    }
  };
  
  // Handle toggling pin status
  const handleTogglePin = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, isPinned: !note.isPinned } 
        : note
    );
    
    // Sort notes so pinned ones appear first
    updatedNotes.sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return 0;
      }
      return a.isPinned ? -1 : 1;
    });
    
    setNotes(updatedNotes);
    
    if (activeNote && activeNote.id === noteId) {
      setActiveNote({ ...activeNote, isPinned: !activeNote.isPinned });
    }
  };
  
  // Handle selecting a note to view
  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color);
    setIsEditing(false);
    setIsCreating(false);
  };
  
  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;
  
  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="flex h-screen">
      {/* Background */}
      <div 
        className="bg-image-wrapper"
        style={{backgroundImage: "url('https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')"}}
      ></div>
      
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto backdrop-blur-sm bg-white/30">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
                <p className="text-gray-600">
                  Organize your thoughts and ideas
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <button 
                  onClick={handleCreateNote}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BsPlusLg /> New Note
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Notes list */}
              <div className="w-full md:w-1/3">
                <div className="bg-white rounded-xl shadow-md p-4 mb-4">
                  <h3 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <BsStickies /> Your Notes ({filteredNotes.length})
                  </h3>
                  
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No notes found.</p>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-primary hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto pr-2">
                      {filteredNotes.map(note => (
                        <div 
                          key={note.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            activeNote?.id === note.id 
                              ? 'border-2 border-primary' 
                              : 'border border-gray-200 hover:border-primary/50'
                          }`}
                          style={{ backgroundColor: note.color }}
                          onClick={() => handleSelectNote(note)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-800 mb-1">
                              {note.isPinned && <span className="mr-1">📌</span>}
                              {note.title}
                            </h4>
                            <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Note editor/viewer */}
              <div className="w-full md:w-2/3">
                <div className="bg-white rounded-xl shadow-md p-5 min-h-[500px]">
                  {activeNote || isCreating ? (
                    <>
                      <div className="mb-4 flex justify-between">
                        {isEditing ? (
                          <input
                            id="note-title"
                            type="text"
                            className="text-xl font-semibold w-full border-b border-gray-300 pb-2 focus:outline-none focus:border-primary"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Note title"
                          />
                        ) : (
                          <h2 className="text-xl font-semibold">
                            {activeNote?.title}
                          </h2>
                        )}
                        
                        {!isCreating && (
                          <div className="flex gap-2">
                            {isEditing ? (
                              <button 
                                onClick={handleSaveNote}
                                className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
                              >
                                Save
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => setIsEditing(true)}
                                  className="p-2 text-gray-600 hover:text-primary"
                                  title="Edit note"
                                >
                                  <BsPencilFill />
                                </button>
                                <button 
                                  onClick={() => activeNote && handleTogglePin(activeNote.id)}
                                  className={`p-2 ${activeNote?.isPinned ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                                  title={activeNote?.isPinned ? 'Unpin note' : 'Pin note'}
                                >
                                  📌
                                </button>
                                <button 
                                  onClick={() => activeNote && handleDeleteNote(activeNote.id)}
                                  className="p-2 text-gray-600 hover:text-red-600"
                                  title="Delete note"
                                >
                                  <BsTrash />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note Color</label>
                          <div className="flex gap-2">
                            {['#ffffff', '#c0e6ff', '#d0f0c0', '#ffd6e0', '#e6d3ff', '#fff4c0'].map(color => (
                              <div 
                                key={color}
                                className={`w-8 h-8 rounded-full cursor-pointer ${noteColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNoteColor(color)}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <textarea
                          ref={contentRef}
                          className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Write your note here..."
                        ></textarea>
                      ) : (
                        <div className="whitespace-pre-wrap">{activeNote?.content}</div>
                      )}
                      
                      {isCreating && (
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={handleSaveNote}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                          >
                            Save Note
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                      <BsStickies className="text-6xl text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-600 mb-2">No Note Selected</h3>
                      <p className="text-gray-500 mb-6">Select a note from the list or create a new one</p>
                      <button 
                        onClick={handleCreateNote}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        Create New Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

export default Notes;
