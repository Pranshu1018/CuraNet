import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { toast } from 'sonner';
import { mediSyncServices } from '@/lib/firebase-services';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS[UserRole]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@medsync.com',
    name: 'System Administrator',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'staff@hospital.com',
    name: 'John Smith',
    role: 'hospital_staff',
    hospitalId: 'hospital-1',
    department: 'Administration',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'doctor@hospital.com',
    name: 'Dr. Sarah Johnson',
    role: 'doctor',
    hospitalId: 'hospital-1',
    department: 'Emergency',
    licenseNumber: 'MD123456',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'nurse@hospital.com',
    name: 'Emily Davis',
    role: 'nurse',
    hospitalId: 'hospital-1',
    department: 'Emergency',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'patient@email.com',
    name: 'Michael Brown',
    role: 'patient',
    patientId: 'PAT-001',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  useEffect(() => {
    // Check for stored auth state on mount
    const storedUser = localStorage.getItem('medsync_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        localStorage.removeItem('medsync_user');
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // First check mock users for admin/staff/doctor roles
      let user = MOCK_USERS.find(
        u => u.email === credentials.email && u.role === credentials.role
      );

      // If not found in mock users and role is patient, check Firebase
      if (!user && credentials.role === 'patient') {
        try {
          // Check if patient exists in Firebase tokens/patients
          const tokensData = await mediSyncServices.smartOPD.getTokens();
          const patientsData = await mediSyncServices.patients.getAll();
          
          // Search in tokens first
          if (tokensData) {
            const patientToken = Object.values(tokensData).find((token: any) => 
              token.email === credentials.email
            );
            
            if (patientToken) {
              user = {
                id: (patientToken as any).patientId || `patient_${Date.now()}`,
                email: (patientToken as any).email,
                name: (patientToken as any).patientName,
                role: 'patient' as UserRole,
                patientId: (patientToken as any).patientId || `PAT-${Date.now()}`,
                createdAt: new Date().toISOString(),
              } as User;
            }
          }
          
          // If not found in tokens, check patients collection
          if (!user && patientsData) {
            const patientRecord = Object.values(patientsData).find((patient: any) => 
              patient.email === credentials.email
            );
            
            if (patientRecord) {
              user = {
                id: (patientRecord as any).id,
                email: (patientRecord as any).email,
                name: (patientRecord as any).name,
                role: 'patient' as UserRole,
                patientId: (patientRecord as any).patientId || (patientRecord as any).id,
                createdAt: (patientRecord as any).createdAt || new Date().toISOString(),
              } as User;
            }
          }
        } catch (error) {
          console.error('Error checking Firebase for patient:', error);
        }
      }

      if (!user) {
        throw new Error('Invalid credentials or role mismatch');
      }

      // In a real app, you would verify the password here
      // For demo purposes, we'll accept any password

      // Update last login
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem('medsync_user', JSON.stringify(updatedUser));

      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      
      toast.success(`Welcome back, ${updatedUser.name}!`, {
        description: `Logged in as ${updatedUser.role.replace('_', ' ')}`,
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error('Login failed', {
        description: error instanceof Error ? error.message : 'Please check your credentials',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('medsync_user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('medsync_user', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', payload: updates });
    }
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS[UserRole]) => {
    if (!state.user) return false;
    return ROLE_PERMISSIONS[state.user.role][permission];
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
