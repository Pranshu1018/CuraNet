import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Stethoscope,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  department: string;
  priority: string;
  password: string;
  confirmPassword: string;
}

export const PatientRegister = () => {
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    department: '',
    priority: 'medium',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const navigate = useNavigate();

  const departments = [
    'Cardiology',
    'General Medicine', 
    'Pediatrics',
    'Neurology',
    'Orthopedics',
    'Emergency'
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-600 text-white' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!registrationData.name || !registrationData.email || !registrationData.phone ||
        !registrationData.age || !registrationData.gender || !registrationData.department ||
        !registrationData.password || !registrationData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (registrationData.password !== registrationData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (registrationData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    const ageNum = parseInt(registrationData.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setError('Please enter a valid age');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          age: parseInt(registrationData.age),
          gender: registrationData.gender,
          department: registrationData.department,
          priority: registrationData.priority,
          password: registrationData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTokenData(data.data);
        
        toast.success('Registration successful!', {
          description: `Your token is: ${data.data.tokenNumber}`,
          duration: 8000
        });

        // Store token for auto-login
        localStorage.setItem('patientToken', data.token);
        localStorage.setItem('patientData', JSON.stringify({
          id: data.data.id,
          name: registrationData.name,
          email: registrationData.email,
          tokenNumber: data.data.tokenNumber,
          department: data.data.department,
          positionInQueue: data.data.positionInQueue,
          estimatedWaitTime: data.data.estimatedWaitTime,
          status: 'registered'
        }));

      } else {
        setError(data.error || 'Registration failed');
        toast.error('Registration failed', {
          description: data.error || 'Please try again'
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

  if (success && tokenData) {
    const priorityInfo = priorities.find(p => p.value === registrationData.priority);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-white p-6 rounded-lg border-2 border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-2">
                {tokenData.tokenNumber}
              </div>
              <div className="text-gray-600">
                Your Queue Token
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{registrationData.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                <span>{registrationData.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Position: #{tokenData.positionInQueue} in queue</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Est. wait: {tokenData.estimatedWaitTime} minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${priorityInfo?.color}`} />
                <span>Priority: {priorityInfo?.label}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please arrive at the {registrationData.department} department 
                10 minutes before your estimated consultation time. You will receive real-time updates 
                about your queue position.
              </p>
            </div>

            <Button 
              onClick={() => navigate('/patient-login')}
              className="w-full"
            >
              View My Queue Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <User className="w-6 h-6" />
            Patient Registration
          </CardTitle>
          <p className="text-gray-600">
            Register for OPD queue and get your token number
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={registrationData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={registrationData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={registrationData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="Enter your age"
                  value={registrationData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="150"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select name="gender" value={registrationData.gender} onValueChange={(value) => 
                  setRegistrationData({...registrationData, gender: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" value={registrationData.department} onValueChange={(value) => 
                  setRegistrationData({...registrationData, department: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          {dept}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select name="priority" value={registrationData.priority} onValueChange={(value) => 
                  setRegistrationData({...registrationData, priority: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={registrationData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={registrationData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register & Get Token'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/patient-login')}
              className="text-blue-600 hover:underline font-medium"
            >
              Login here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
