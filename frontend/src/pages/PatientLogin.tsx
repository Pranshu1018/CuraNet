import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Users,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PatientData {
  id: string;
  name: string;
  email: string;
  tokenNumber: string;
  department: string;
  positionInQueue: number;
  estimatedWaitTime: number;
  status: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const PatientLogin = () => {
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('patientToken');
    if (token) {
      fetchPatientStatus(token);
    }
  }, []);

  const fetchPatientStatus = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/patients/my-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data.data);
        localStorage.setItem('patientToken', token);
        localStorage.setItem('patientData', JSON.stringify(data.data));
      } else {
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientData');
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/patients/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!', {
          description: `Welcome back! Your token: ${data.data.patient.tokenNumber}`
        });

        // Store token and patient data
        localStorage.setItem('patientToken', data.data.token);
        localStorage.setItem('patientData', JSON.stringify(data.data.patient));
        setPatientData(data.data.patient);

        // Setup WebSocket for real-time updates
        setupWebSocket(data.data.token);

      } else {
        setError(data.error || 'Login failed');
        toast.error('Login failed', {
          description: data.error || 'Please check your credentials'
        });
      }
    } catch (error) {
      setError('Network error. Please try again.');
      toast.error('Network error', {
        description: 'Please check your connection'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (token: string) => {
    const ws = new WebSocket('ws://localhost:5001');
    
    ws.onopen = () => {
      console.log('WebSocket connected for real-time updates');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status_updated' || data.type === 'patient_registered') {
        // Refresh patient status
        fetchPatientStatus(token);
        
        // Show notification
        if (data.type === 'status_updated') {
          toast.info('Queue status updated', {
            description: `Your status is now: ${data.status}`
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => setupWebSocket(token), 5000);
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
    setPatientData(null);
    toast.info('Logged out successfully');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  if (patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Token Display Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Your Queue Token
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-6xl font-bold mb-2">
                  {patientData.tokenNumber}
                </div>
                <div className="text-blue-100">
                  Department: {patientData.department}
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Position in Queue:</span>
                  <span className="text-2xl font-bold text-green-600">
                    #{patientData.positionInQueue}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Estimated Wait Time:</span>
                  <span className="text-xl font-semibold text-blue-600">
                    {patientData.estimatedWaitTime} min
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    patientData.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                    patientData.status === 'in-consultation' ? 'bg-blue-100 text-blue-800' :
                    patientData.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {patientData.status.charAt(0).toUpperCase() + patientData.status.slice(1)}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    {patientData.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {patientData.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Updates Alert */}
          <Alert className="mt-6">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Real-time Updates Active:</strong> You will receive live notifications 
              when your queue position changes or when it's your turn for consultation.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <User className="w-6 h-6" />
            Patient Login
          </CardTitle>
          <p className="text-gray-600">
            Login to view your queue position and get real-time updates
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to View Queue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/patient-register')}
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
