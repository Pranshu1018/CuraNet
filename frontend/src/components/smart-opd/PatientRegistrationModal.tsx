import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Phone, Calendar, MapPin, AlertTriangle } from "lucide-react";

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: any[];
  onRegisterPatient: (patientData: any) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onRegisterPatient
}) => {
  console.log('PatientRegistrationModal rendered, isOpen:', isOpen);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    gender: "",
    address: "",
    emergencyContact: "",
    medicalHistory: "",
    symptoms: "",
    priority: "normal",
    doctorId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.doctorId || !formData.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      
      const patientData = {
        ...formData,
        age: parseInt(formData.age),
        doctor: doctor,
        department: doctor?.department || "",
        registrationTime: new Date().toISOString(),
        status: "registered"
      };

      await onRegisterPatient(patientData);
      
      // Reset form
      setFormData({
        name: "",
        age: "",
        phone: "",
        email: "",
        gender: "",
        address: "",
        emergencyContact: "",
        medicalHistory: "",
        symptoms: "",
        priority: "normal",
        doctorId: ""
      });
      
      onClose();
    } catch (error) {
      toast.error("Failed to register patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Registration & Token Generation
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter patient full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="Age"
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Phone number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
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

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Patient address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symptoms">Current Symptoms/Complaint</Label>
                  <textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange("symptoms", e.target.value)}
                    placeholder="Describe current symptoms or reason for visit"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    placeholder="Previous medical conditions, allergies, medications..."
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OPD Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">OPD Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.priority === "emergency" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Emergency case will be prioritized immediately
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="doctor">Select Doctor *</Label>
                  <Select 
                    value={formData.doctorId} 
                    onValueChange={(value) => handleInputChange("doctorId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex flex-col">
                            <span>{doctor.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {doctor.specialization} • {doctor.department} • {doctor.room}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Registering..." : "Register Patient & Generate Token"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
