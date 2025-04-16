import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, User } from '@supabase/supabase-js';

// Define types
interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  name: string | null;
  surname: string | null;
  student_id: string | null;
  avatar_url: string | null;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string, roleId?: number, extraData?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  setUserRole: (role: string) => void;
  getUserRole: () => string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store user role in localStorage for persistence
  const setUserRole = (role: string) => {
    console.log("🔑 Setting user role in localStorage:", role);
    localStorage.setItem('userRole', role);
    
    // Force profile update to trigger re-renders that depend on role
    if (profile) {
      setProfile({
        ...profile,
        role: role as 'admin' | 'teacher' | 'student'
      });
    }
  };

  const getUserRole = () => {
    const role = localStorage.getItem('userRole');
    console.log("🔍 Getting user role from localStorage:", role);
    return role;
  };

  // Fetch user profile data using a simplified approach
  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile for user ID:', userId);
      
      // First try to get role via RPC function (most reliable)
      try {
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { user_id: userId });
          
        if (!roleError && roleData) {
          console.log("✅ Role fetched via RPC:", roleData);
          setUserRole(roleData);
        } else {
          console.error("❌ Error fetching role via RPC:", roleError);
        }
      } catch (rpcError) {
        console.error("❌ RPC call failed:", rpcError);
      }
      
      // Fetch profile from user_roles view instead of profiles table
      try {
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!userError && userData) {
          console.log("✅ User role view data:", userData);
          setUserRole(userData.role_name);
        } else {
          console.error("❌ Error fetching from user_roles view:", userError);
        }
      } catch (viewError) {
        console.error("❌ User roles view query failed:", viewError);
      }
      
      // Fetch basic profile info
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, full_name, name, surname, student_id, avatar_url, role_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // Create minimal profile from user metadata
        if (user) {
          const storedRole = getUserRole() || 'student';
          console.log("📝 Creating profile from user metadata with role:", storedRole);
          
          setProfile({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            name: user.user_metadata?.name || null,
            surname: user.user_metadata?.surname || null,
            student_id: user.user_metadata?.student_id || null,
            avatar_url: null,
            role: storedRole as 'admin' | 'teacher' | 'student',
          });
        }
        return;
      }
      
      if (data) {
        // Get role name from localStorage or fallback mechanism
        const roleFromStorage = getUserRole();
        const roleName = roleFromStorage || 
                       (data.role_id === 1 ? 'admin' : 
                        data.role_id === 2 ? 'teacher' : 'student');
        
        console.log("📝 Setting profile with role:", roleName, "from:", 
                   roleFromStorage ? "localStorage" : "role_id");
        
        setProfile({
          ...data,
          role: roleName as 'admin' | 'teacher' | 'student',
        });
        
        // Make sure localStorage has the latest role
        if (!roleFromStorage) {
          setUserRole(roleName);
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
    }
  };

  // Check for session on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('userRole');
        }
        setIsLoading(false);
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        
        // Attempt to get role directly from auth metadata to avoid recursion
        const roleId = data.user.user_metadata?.role_id;
        if (roleId) {
          const roleName = roleId === 1 ? 'admin' : roleId === 2 ? 'teacher' : 'student';
          setUserRole(roleName);
        }
        
        await fetchProfile(data.user.id);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, username: string, fullName: string, roleId: number = 3, extraData: Record<string, any> = {}) => {
    try {
      setIsLoading(true);
      
      console.log('SignUp called with roleId:', roleId);
      
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role_id: roleId, // Explicitly pass as number
            name: extraData.name || '',
            surname: extraData.surname || '',
            student_id: extraData.student_id || '',
          }
        }
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Set role directly in localStorage
      const roleName = roleId === 1 ? 'admin' : roleId === 2 ? 'teacher' : 'student';
      setUserRole(roleName);
      
      // Create or update profile directly
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authData.user.id,
            email,
            username,
            full_name: fullName,
            role_id: roleId,
            name: extraData.name || '',
            surname: extraData.surname || '',
            student_id: extraData.student_id || '',
          }
        ]);
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
        
      setUser(authData.user);
      
      // Create profile object directly instead of fetching
      setProfile({
        id: authData.user.id,
        username,
        email,
        full_name: fullName,
        name: extraData.name || null,
        surname: extraData.surname || null,
        student_id: extraData.student_id || null,
        avatar_url: null,
        role: roleName as 'admin' | 'teacher' | 'student',
      });
      
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Role check functions using local storage as source of truth
  const isAdmin = () => {
    const role = getUserRole();
    const result = role === 'admin';
    console.log("👑 isAdmin check:", { role, result });
    return result;
  };
  
  const isTeacher = () => {
    const role = getUserRole();
    const result = role === 'teacher' || role === 'admin';
    console.log("👨‍🏫 isTeacher check:", { role, result });
    return result;
  };
  
  const isStudent = () => {
    const hasAuth = !!user;
    console.log("🧑‍🎓 isStudent check:", { hasAuth, role: getUserRole() });
    return hasAuth;
  };
  
  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isTeacher,
    isStudent,
    setUserRole,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
