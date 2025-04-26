import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define types for our context
interface Profile {
  id: string;
  username: string;
  full_name?: string;
  name?: string;
  surname?: string;
  avatar_url?: string;
  role_id: number;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionChecked: boolean;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    roleId: number,
    extraData?: Record<string, any>
  ) => Promise<void>;
  getUserRole: () => 'admin' | 'teacher' | 'student';
  setUserRole: (role: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  const initAttempts = useRef(0);
  const profileFetchedRef = useRef<boolean>(false);

  useEffect(() => {
    const persistedAuth = sessionStorage.getItem('authState');

    if (persistedAuth) {
      try {
        const authData = JSON.parse(persistedAuth);

        if (authData.isAuthenticated && authData.user && authData.profile) {
          console.log('🔄 Restoring auth state from session storage');
          setIsAuthenticated(true);
          setUser(authData.user);
          setProfile(authData.profile);
        }
      } catch (e) {
        console.error('Failed to parse persisted auth state', e);
        sessionStorage.removeItem('authState');
      }
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (profileFetchedRef.current) return;

    try {
      console.log('👤 Fetching profile for user ID:', userId);
      profileFetchedRef.current = true;

      // Use the new profiles_with_roles view to get both profile and role data in one query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_with_roles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("❌ Error fetching profile with role:", profileError);
        throw profileError;
      }

      if (profileData) {
        console.log('✅ Profile fetched successfully with role:', profileData.role_name);
        
        // Store the role_name from the direct query
        const roleName = profileData.role_name || 
                        (profileData.role_id === 1 ? 'admin' : 
                         profileData.role_id === 2 ? 'teacher' : 'student');
        
        localStorage.setItem('userRole', roleName);
        console.log('👑 Role set from database:', roleName);
        
        // Set the profile with all the data we got
        setProfile(profileData);
        
        // Store in session storage
        sessionStorage.setItem('authState', JSON.stringify({
          isAuthenticated: true,
          user,
          profile: profileData
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      profileFetchedRef.current = false;
      
      // Fallback logic for when the profile query fails
      if (user) {
        // Try to get role from user metadata as a fallback
        const roleId = user.user_metadata?.role_id || 3;
        const roleName = roleId === 1 ? 'admin' : 
                        roleId === 2 ? 'teacher' : 'student';
        
        const minimalProfile = {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          role_id: roleId,
        };

        setProfile(minimalProfile as Profile);
        localStorage.setItem('userRole', roleName);
        console.log('🆘 Using emergency fallback role:', roleName);
        
        sessionStorage.setItem('authState', JSON.stringify({
          isAuthenticated: true,
          user,
          profile: minimalProfile
        }));
      }
    }
  }, [user, profile]);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('authState');
    profileFetchedRef.current = false;
  }, []); 

  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      if (initAttempts.current > 2) {
        console.error('Too many initialization attempts, stopping to prevent infinite loop');
        setIsLoading(false);
        setSessionChecked(true);
        return;
      }

      initAttempts.current += 1;

      try {
        setIsLoading(true);
        console.log('🔑 Checking auth session...');

        // Increase timeout to 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.log('⏱️ Session check timeout - checking for stored session');
            reject(new Error('Session check timeout'));
          }, 10000)
        );

        let session = null;
        let sessionError = null;
        
        try {
          const sessionPromise = Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
          ]);

          const result = await sessionPromise as any;
          session = result.data?.session;
          sessionError = result.error;
        } catch (err) {
          console.warn('⚠️ Session fetch failed, checking local storage:', err);
          sessionError = err;
        }

        if (!isMounted) return;

        if (sessionError) {
          // Check for stored auth state before giving up
          const authFromStorage = sessionStorage.getItem('authState');
          if (authFromStorage) {
            try {
              const parsed = JSON.parse(authFromStorage);
              if (parsed.isAuthenticated && parsed.user) {
                console.log('🔄 Using persisted auth due to session error');
                setUser(parsed.user);
                setProfile(parsed.profile);
                setIsAuthenticated(true);
                
                // Ensure role is set
                if (parsed.profile?.role_id) {
                  const roleId = parsed.profile.role_id;
                  const roleName = roleId === 1 ? 'admin' : 
                                  roleId === 2 ? 'teacher' : 'student';
                  localStorage.setItem('userRole', roleName);
                }
                
                setIsLoading(false);
                setSessionChecked(true);
                return;
              }
            } catch (e) {
              console.error('Failed to parse stored auth state:', e);
            }
          }
          throw sessionError;
        }

        if (session) { // Check for stored auth state before giving up
          console.log('✅ Valid session found');
          setUser(session.user);
          setIsAuthenticated(true);
          await fetchProfile(session.user.id);
        } else {
          console.log('❌ No active session');
          clearAuthState();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setSessionChecked(true);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          profileFetchedRef.current = false;
          sessionStorage.removeItem('authState');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user);
          setIsAuthenticated(true);
          profileFetchedRef.current = false;
          await fetchProfile(session.user.id);
        }
      }
    );

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchProfile, clearAuthState, isAuthenticated, profile, sessionChecked]); 

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setUser(data.user);
      setIsAuthenticated(true);
      profileFetchedRef.current = false;
      await fetchProfile(data.user.id);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    clearAuthState();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const signUp = useCallback(async (email: string, password: string, username: string, fullName: string, roleId: number, extraData?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role_id: roleId,
            ...extraData
          }
        }
      });

      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username,
          full_name: fullName,
          role_id: roleId,
          email: data.user.email,
          ...extraData
        });

      if (profileError) throw profileError;

      const roleName = roleId === 1 ? 'admin' : roleId === 2 ? 'teacher' : 'student';
      localStorage.setItem('userRole', roleName);
      setUser(data.user);
      setIsAuthenticated(true);
      setProfile({
        id: data.user.id,
        username,
        full_name: fullName,
        role_id: roleId,
        email: data.user.email,
      } as Profile);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a function to force refresh the role
  const refreshUserRole = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles_with_roles')
        .select('role_name, role_id')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        const roleName = data.role_name || 
                        (data.role_id === 1 ? 'admin' : 
                         data.role_id === 2 ? 'teacher' : 'student');
        
        localStorage.setItem('userRole', roleName);
        console.log('🔄 User role refreshed:', roleName);
        return roleName;
      }
    } catch (error) {
      console.error('Error refreshing user role:', error);
    }
    
    return getUserRole();
  }, [user?.id]);

  // Update getUserRole to also check the database when needed
  const getUserRole = useCallback((): 'admin' | 'teacher' | 'student' => {
    const role = localStorage.getItem('userRole');
    
    if (role === 'admin' || role === 'teacher' || role === 'student') {
      return role as 'admin' | 'teacher' | 'student';
    }
    
    // If we don't have a role, trigger a refresh but return a default for now
    if (user?.id) {
      refreshUserRole();
    }
    
    return 'student';
  }, [user?.id, refreshUserRole]);

  const setUserRole = useCallback((role: string) => {
    if (role === 'admin' || role === 'teacher' || role === 'student') {
      localStorage.setItem('userRole', role);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    profileFetchedRef.current = false;
    if (!user) return;
    try {
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, [user, fetchProfile]);

  const contextValue = {
    isAuthenticated,
    isLoading,
    sessionChecked,
    user,
    profile,
    signIn,
    signOut,
    signUp,
    getUserRole,
    setUserRole,
    refreshUserRole, // Add the new function
    refreshProfile
  };

  useEffect(() => {
    console.log('Auth state updated:', { 
      isAuthenticated, 
      isLoading,
      sessionChecked,
      hasUser: !!user,
      hasProfile: !!profile,
      role: localStorage.getItem('userRole') || 'none'
    });
  }, [isAuthenticated, isLoading, sessionChecked, user, profile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
