import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, Eye, EyeOff, Hospital, User, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS, ROLE_ICONS } from '@/types/auth';
import { toast } from 'sonner';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' as UserRole,
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      // Redirect based on role
      const redirectMap: Record<UserRole, string> = {
        admin: '/dashboard',
        hospital_staff: '/dashboard',
        doctor: '/doctor-dashboard',
        nurse: '/nurse-dashboard',
        patient: '/patient-portal',
      };
      
      navigate(redirectMap[formData.role]);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <User className="w-4 h-4" />;
      case 'hospital_staff':
        return <Hospital className="w-4 h-4" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-sans text-[24px] font-[700] leading-[1.3] tracking-[-0.01em] text-gray-900">CuraNet</span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="font-sans text-[24px] font-[600] leading-[1.3] tracking-[-0.01em] text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="font-sans text-[14px] font-[400] leading-[1.5] text-gray-600">
              Sign in to your City Health Sync account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="font-sans text-[14px] font-[500] leading-[1.4] text-foreground">Select Your Role</Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <span>{ROLE_ICONS[role as UserRole]}</span>
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-[14px] font-[500] leading-[1.4] text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-sans text-[14px] font-[500] leading-[1.4] text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me for 30 days
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div><strong>Admin:</strong> admin@medsync.com</div>
                <div><strong>Staff:</strong> staff@hospital.com</div>
                <div><strong>Doctor:</strong> doctor@hospital.com</div>
                <div><strong>Nurse:</strong> nurse@hospital.com</div>
                <div><strong>Patient:</strong> patient@email.com</div>
                <div className="mt-2 text-gray-500">Password: Any password works for demo</div>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
              <p className="text-xs text-gray-500">
                Hospital? <Link to="/hospital-registration" className="text-blue-600 hover:text-blue-700 font-medium">Register Your Hospital</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
