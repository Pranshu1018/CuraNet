import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mediSyncServices } from '@/lib/firebase-services';
import { toast } from 'sonner';
import { 
  Building2, 
  CheckCircle, 
  X, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  AlertTriangle,
  Eye,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HospitalRegistration {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  totalBeds: number;
  contactEmail: string;
  contactPhone: string;
  licenseNumber?: string;
  registrationNumber?: string;
  location: { lat: number; lng: number };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export const AdminHospitalVerification = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<HospitalRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<HospitalRegistration | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      return;
    }

    loadRegistrations();
    
    const unsubscribe = mediSyncServices.hospitals.listenToRegistrations((data) => {
      if (data) {
        const regsArray = typeof data === 'object' && !Array.isArray(data)
          ? Object.entries(data).map(([id, reg]: [string, any]) => ({ ...reg, id }))
          : Array.isArray(data) ? data : [];
        setRegistrations(regsArray);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await mediSyncServices.hospitals.getRegistrations();
      
      if (data) {
        const regsArray = typeof data === 'object' && !Array.isArray(data)
          ? Object.entries(data).map(([id, reg]: [string, any]) => ({ ...reg, id }))
          : Array.isArray(data) ? data : [];
        setRegistrations(regsArray);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registration: HospitalRegistration) => {
    try {
      setProcessing(registration.id);
      
      // Update registration status
      await mediSyncServices.hospitals.updateRegistration(registration.id, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.id
      });

      // Create hospital in backend (you would call your API here)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_BASE_URL}/api/hospital/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registration.name,
          location: {
            lat: registration.location.lat,
            lng: registration.location.lng
          },
          totalBeds: registration.totalBeds,
          inventory: []
        })
      });

      toast.success(`Hospital ${registration.name} approved successfully!`);
      setSelectedRegistration(null);
      loadRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (registration: HospitalRegistration) => {
    try {
      setProcessing(registration.id);
      
      await mediSyncServices.hospitals.updateRegistration(registration.id, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.id
      });

      toast.success(`Registration for ${registration.name} rejected`);
      setSelectedRegistration(null);
      loadRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    } finally {
      setProcessing(null);
    }
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const approvedRegistrations = registrations.filter(r => r.status === 'approved');
  const rejectedRegistrations = registrations.filter(r => r.status === 'rejected');

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hospital Verification</h1>
          <p className="text-muted-foreground">
            Review and approve hospital registration requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingRegistrations.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedRegistrations.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedRegistrations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Registrations */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pendingRegistrations.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">Pending Registrations</h2>
            {pendingRegistrations.map((registration) => (
              <Card key={registration.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold">{registration.name}</h3>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Pending
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{registration.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{registration.contactPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{registration.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>{registration.totalBeds} beds</span>
                        </div>
                      </div>

                      {registration.licenseNumber && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          License: {registration.licenseNumber}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Submitted: {new Date(registration.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleApprove(registration)}
                        disabled={processing === registration.id}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {processing === registration.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(registration)}
                        disabled={processing === registration.id}
                        variant="destructive"
                        size="sm"
                      >
                        {processing === registration.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No pending registrations</p>
            </CardContent>
          </Card>
        )}
      </div>
  );
};
