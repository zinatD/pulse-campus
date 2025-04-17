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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      );

      const profilePromise = Promise.race([
        supabase
          .from('user_roles')
          .select('*')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]);

      const { data: userData, error: userError } = await profilePromise as any;

      if (userError || !userData) {
        console.error('Error getting user profile from view:', userError);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(profileData);

        const roleId = profileData?.role_id || 3;
        const roleName = roleId === 1 ? 'admin' : roleId === 2 ? 'teacher' : 'student';
        localStorage.setItem('userRole', roleName);

        sessionStorage.setItem('authState', JSON.stringify({
          isAuthenticated: true,
          user,
          profile: profileData
        }));

      } else {
        setProfile(userData);
        const roleName = userData.role_name || 'student';
        localStorage.setItem('userRole', roleName);

        sessionStorage.setItem('authState', JSON.stringify({
          isAuthenticated: true,
          user,
          profile: userData
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      profileFetchedRef.current = false;

      if (user && !profile) {
        const minimalProfile = {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          role_id: user.user_metadata?.role_id || 3,
        };

        setProfile(minimalProfile as Profile);
        const role = localStorage.getItem('userRole') || 'student';
        localStorage.setItem('userRole', role);
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

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const sessionPromise = Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);

        const { data: { session }, error: sessionError } = await sessionPromise as any;

        if (!isMounted) return;

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          console.log('✅ Valid session found');
          setUser(session.user);
          setIsAuthenticated(true);

          if (!profile || profile.id !== session.user.id) {
            await fetchProfile(session.user.id);
          }
        } else {
          console.log('❌ No active session');
          clearAuthState();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);

        const authFromStorage = sessionStorage.getItem('authState');
        if (authFromStorage && !isAuthenticated) {
          try {
            const parsed = JSON.parse(authFromStorage);
            if (parsed.isAuthenticated && parsed.user) {
              console.log('🔄 Using persisted auth as fallback');
              setUser(parsed.user);
              setProfile(parsed.profile);
              setIsAuthenticated(true);
            } else {
              clearAuthState();
            }
          } catch {
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setSessionChecked(true);
        }
      }
    };

    if (!sessionChecked) {
      initializeAuth();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);

        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          profileFetchedRef.current = false;
          sessionStorage.removeItem('authState');
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setUser(session.user);
          setIsAuthenticated(true);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearAuthState();
        }

        setIsLoading(false);
        setSessionChecked(true);
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      clearAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    username: string, 
    fullName: string, 
    roleId: number,
    extraData?: Record<string, any>
  ) => {
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

      if (!data.user) {
        throw new Error('User creation failed');
      }

      const profileData = {
        id: data.user.id,
        username,
        full_name: fullName,
        email: data.user.email,
        role_id: roleId,
        ...extraData
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      setUser(data.user);
      setProfile(profileData as Profile);
      setIsAuthenticated(true);

      const roleName = roleId === 1 ? 'admin' : roleId === 2 ? 'teacher' : 'student';
      localStorage.setItem('userRole', roleName);

    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserRole = useCallback((): 'admin' | 'teacher' | 'student' => {
    const role = localStorage.getItem('userRole');
    if (role === 'admin' || role === 'teacher' || role === 'student') {
      return role;
    }
    return 'student';
  }, []);

  const setUserRole = useCallback((role: string) => {
    if (role === 'admin' || role === 'teacher' || role === 'student') {
      localStorage.setItem('userRole', role);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    profileFetchedRef.current = false;
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
