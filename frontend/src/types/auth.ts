export type UserRole = 'admin' | 'hospital_staff' | 'doctor' | 'nurse' | 'patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hospitalId?: string;
  department?: string;
  licenseNumber?: string;
  patientId?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canManagePatients: boolean;
  canManageStaff: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canManageBeds: boolean;
  canManageBloodBank: boolean;
  canManageOPD: boolean;
  canManageAmbulance: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewDashboard: true,
    canManagePatients: true,
    canManageStaff: true,
    canViewReports: true,
    canManageInventory: true,
    canManageBeds: true,
    canManageBloodBank: true,
    canManageOPD: true,
    canManageAmbulance: true,
    canViewAnalytics: true,
    canManageSystem: true,
  },
  hospital_staff: {
    canViewDashboard: true,
    canManagePatients: true,
    canManageStaff: false,
    canViewReports: true,
    canManageInventory: true,
    canManageBeds: true,
    canManageBloodBank: true,
    canManageOPD: true,
    canManageAmbulance: true,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  doctor: {
    canViewDashboard: true,
    canManagePatients: true,
    canManageStaff: false,
    canViewReports: true,
    canManageInventory: false,
    canManageBeds: false,
    canManageBloodBank: false,
    canManageOPD: true,
    canManageAmbulance: false,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  nurse: {
    canViewDashboard: true,
    canManagePatients: true,
    canManageStaff: false,
    canViewReports: false,
    canManageInventory: false,
    canManageBeds: true,
    canManageBloodBank: false,
    canManageOPD: true,
    canManageAmbulance: false,
    canViewAnalytics: false,
    canManageSystem: false,
  },
  patient: {
    canViewDashboard: false,
    canManagePatients: false,
    canManageStaff: false,
    canViewReports: false,
    canManageInventory: false,
    canManageBeds: false,
    canManageBloodBank: false,
    canManageOPD: false,
    canManageAmbulance: false,
    canViewAnalytics: false,
    canManageSystem: false,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'System Administrator',
  hospital_staff: 'Hospital Staff',
  doctor: 'Doctor',
  nurse: 'Nurse',
  patient: 'Patient',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  admin: '👨‍💼',
  hospital_staff: '🏥',
  doctor: '👨‍⚕️',
  nurse: '👩‍⚕️',
  patient: '👤',
};
