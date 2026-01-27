import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { mediSyncServices } from '@/lib/firebase-services';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HospitalRegistration = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    location: { lat: '', lng: '' },
    totalBeds: '',
    contactEmail: '',
    contactPhone: '',
    emergencyContact: '',
    licenseNumber: '',
    registrationNumber: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.address || !formData.contactEmail || !formData.contactPhone) {
        toast.error('Please fill all required fields');
        setSubmitting(false);
        return;
      }

      // Submit registration
      await mediSyncServices.hospitals.createRegistration({
        ...formData,
        totalBeds: parseInt(formData.totalBeds) || 0,
        location: {
          lat: parseFloat(formData.location.lat) || 0,
          lng: parseFloat(formData.location.lng) || 0
        }
      });

      toast.success('Registration submitted successfully!', {
        description: 'Your registration is pending admin approval. You will be notified once verified.',
        duration: 5000
      });

      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        location: { lat: '', lng: '' },
        totalBeds: '',
        contactEmail: '',
        contactPhone: '',
        emergencyContact: '',
        licenseNumber: '',
        registrationNumber: '',
        description: ''
      });

      // Navigate after delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude.toString(),
              lng: position.coords.longitude.toString()
            }
          }));
          toast.success('Location detected automatically');
        },
        () => {
          toast.error('Could not detect location. Please enter manually.');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Hospital Registration</h1>
          <p className="text-muted-foreground">
            Register your hospital to join the City Health Sync network
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
            <CardDescription>
              Fill in the details below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Hospital Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="City General Hospital"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="totalBeds">Total Beds *</Label>
                    <Input
                      id="totalBeds"
                      type="number"
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({...formData, totalBeds: e.target.value})}
                      required
                      placeholder="200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Mumbai"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="Maharashtra"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      placeholder="400001"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label>Location Coordinates</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Latitude"
                      value={formData.location.lat}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, lat: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Longitude"
                      value={formData.location.lng}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, lng: e.target.value }
                      })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Auto
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      required
                      placeholder="admin@hospital.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone">Phone *</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      required
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Legal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Legal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      placeholder="LIC-123456"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      placeholder="REG-789012"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Hospital Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of your hospital, specialties, and services..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your registration will be reviewed by our admin team.</p>
          <p>You will receive an email notification once your hospital is verified.</p>
        </div>
      </div>
    </div>
  );
};
