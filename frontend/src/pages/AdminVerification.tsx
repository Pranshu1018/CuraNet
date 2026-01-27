import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { 
  Users, CheckCircle, XCircle, Clock, Mail, Phone, Building2, 
  Stethoscope, User, AlertCircle, Search, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User as UserType } from '@/types/auth';
import { toast } from 'sonner';

interface PendingUser extends UserType {
  registrationDate: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

const AdminVerification = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [pendingUsers, searchTerm, roleFilter]);

  const loadPendingUsers = () => {
    try {
      const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
      setPendingUsers(registrations.map((user: any) => ({
        ...user,
        registrationDate: user.createdAt,
        status: 'pending'
      })));
    } catch (error) {
      console.error('Error loading pending users:', error);
      toast.error('Failed to load pending registrations');
    }
  };

  const filterUsers = () => {
    let filtered = pendingUsers;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleApprove = async (user: PendingUser) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user status to active
      const updatedUser = {
        ...user,
        status: 'active' as const,
        verifiedAt: new Date().toISOString(),
        hospitalId: `hospital-${Math.floor(Math.random() * 1000)}`,
      };

      // Move from pending to approved users
      const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
      const updatedRegistrations = registrations.filter((u: any) => u.id !== user.id);
      localStorage.setItem('pending_registrations', JSON.stringify(updatedRegistrations));

      // Add to mock users (in real app, this would be API call)
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      mockUsers.push(updatedUser);
      localStorage.setItem('mock_users', JSON.stringify(mockUsers));

      setPendingUsers(updatedRegistrations);
      
      toast.success(`User ${user.name} approved successfully!`, {
        description: 'Account is now active and can login.',
      });
    } catch (error) {
      toast.error('Failed to approve user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (user: PendingUser, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user status to rejected
      const updatedUser = {
        ...user,
        status: 'suspended' as const,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
      };

      // Move from pending to rejected users
      const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
      const updatedRegistrations = registrations.filter((u: any) => u.id !== user.id);
      
      const rejectedUsers = JSON.parse(localStorage.getItem('rejected_registrations') || '[]');
      rejectedUsers.push(updatedUser);
      localStorage.setItem('rejected_registrations', JSON.stringify(rejectedUsers));
      localStorage.setItem('pending_registrations', JSON.stringify(updatedRegistrations));

      setPendingUsers(updatedRegistrations);
      
      toast.success(`User ${user.name} rejected`, {
        description: `Reason: ${reason}`,
      });
    } catch (error) {
      toast.error('Failed to reject user');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <User className="w-4 h-4" />;
      case 'hospital_staff':
        return <Building2 className="w-4 h-4" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4" />;
      case 'nurse':
        return <Users className="w-4 h-4" />;
      case 'patient':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStats = () => {
    const total = pendingUsers.length;
    const doctors = pendingUsers.filter(u => u.role === 'doctor').length;
    const nurses = pendingUsers.filter(u => u.role === 'nurse').length;
    const staff = pendingUsers.filter(u => u.role === 'hospital_staff').length;
    const patients = pendingUsers.filter(u => u.role === 'patient').length;

    return { total, doctors, nurses, staff, patients };
  };

  const stats = getStats();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-sans text-3xl font-bold text-foreground tracking-tight mb-2">
              Admin Verification Center
            </h1>
            <p className="text-muted-foreground">
              Review and approve pending user registrations for CuraNet Healthcare Network
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <StatusBadge 
              status="warning" 
              label={`${stats.total} Pending`} 
              size="md"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Pending</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.doctors}</div>
                <div className="text-sm text-muted-foreground">Doctors</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.nurses}</div>
                <div className="text-sm text-muted-foreground">Nurses</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.staff}</div>
                <div className="text-sm text-muted-foreground">Staff</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.patients}</div>
                <div className="text-sm text-muted-foreground">Patients</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full lg:w-48">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="hospital_staff">Staff</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {pendingUsers.length === 0 ? 'No Pending Registrations' : 'No Matching Results'}
                </h3>
                <p className="text-muted-foreground">
                  {pendingUsers.length === 0 
                    ? 'All user registrations have been processed.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground text-lg">
                              {user.name}
                            </h3>
                            <StatusBadge status="warning" label="Pending" size="sm" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{user.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Registered {new Date(user.registrationDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {user.licenseNumber && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-amber-800">License Number:</span>
                                <span className="text-amber-700">{user.licenseNumber}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Please provide reason for rejection:');
                          if (reason) handleReject(user, reason);
                        }}
                        disabled={isLoading}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user)}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminVerification;
