import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Heart,
  FileText,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedPatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: any[];
  onRegisterPatient: (patientData: any) => void;
}

export const EnhancedPatientRegistrationModal: React.FC<EnhancedPatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onRegisterPatient
}) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
    medicalHistory: "",
    allergies: "",
    medications: "",
    symptoms: "",
    priority: "normal",
    doctorId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const commonAllergies = [
    "Penicillin", "Aspirin", "NSAIDs", "Sulfa drugs", "Latex", 
    "Dust mites", "Pollen", "Pet dander", "Mold", "Food allergies"
  ];

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
        bloodGroup: "",
        medicalHistory: "",
        allergies: "",
        medications: "",
        symptoms: "",
        priority: "normal",
        doctorId: ""
      });
      
      setCurrentStep(1);
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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Medical Details";
      case 3: return "Symptoms & Priority";
      default: return "Registration";
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return User;
      case 2: return Heart;
      case 3: return AlertTriangle;
      default: return User;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.age && formData.phone && formData.email;
      case 2:
        return formData.bloodGroup && formData.medicalHistory;
      case 3:
        return formData.symptoms && formData.doctorId;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Enhanced Patient Registration
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-2 rounded-full transition-all",
                    i + 1 <= currentStep ? "bg-primary" : "bg-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="text-sm font-medium text-primary">
            {getStepTitle()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {React.createElement(getStepIcon(), { className: "w-6 h-6 text-primary" })}
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                
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
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Email address"
                      required
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
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Patient address"
                      rows={2}
                    />
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
              </CardContent>
            </Card>
          )}

          {/* Step 2: Medical Details */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold">Medical Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group *</Label>
                    <Select 
                      value={formData.bloodGroup} 
                      onValueChange={(value) => handleInputChange("bloodGroup", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map(group => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                      placeholder="Previous medical conditions, surgeries, chronic illnesses..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange("allergies", e.target.value)}
                      placeholder="List any known allergies (medications, food, environmental)..."
                      rows={3}
                    />
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Common allergies:</p>
                      <div className="flex flex-wrap gap-2">
                        {commonAllergies.map(allergy => (
                          <Button
                            key={allergy}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentAllergies = formData.allergies ? formData.allergies + ', ' + allergy : allergy;
                              handleInputChange("allergies", currentAllergies);
                            }}
                            className="text-xs"
                          >
                            {allergy}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      value={formData.medications}
                      onChange={(e) => handleInputChange("medications", e.target.value)}
                      placeholder="List current medications (name, dosage, frequency)..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Symptoms & Priority */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <h3 className="text-lg font-semibold">Symptoms & Priority</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="symptoms">Current Symptoms/Complaint *</Label>
                    <Textarea
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange("symptoms", e.target.value)}
                      placeholder="Describe current symptoms, when they started, severity..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level *</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => handleInputChange("priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">
                          <div className="flex flex-col">
                            <span>Normal</span>
                            <span className="text-xs text-muted-foreground">Routine check-up</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex flex-col">
                            <span>High Priority</span>
                            <span className="text-xs text-muted-foreground">Urgent but not life-threatening</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex flex-col">
                            <span>Urgent</span>
                            <span className="text-xs text-muted-foreground">Requires immediate attention</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="emergency">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-600">Emergency</span>
                            <span className="text-xs text-muted-foreground">Life-threatening condition</span>
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.priority === "emergency" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Emergency case will be prioritized immediately and directed to emergency care
                      </div>
                    </div>
                  )}

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
                              <span className="text-xs text-muted-foreground">
                                {doctor.specialization} • {doctor.department} • Room {doctor.room}
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
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < totalSteps && (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                >
                  Next
                </Button>
              )}

              {currentStep === totalSteps && (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isStepValid()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Registering..." : "Register Patient & Generate Token"}
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
