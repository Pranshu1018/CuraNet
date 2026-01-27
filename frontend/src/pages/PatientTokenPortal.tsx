import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientTokenView } from "@/components/smart-opd/PatientTokenView";
import { toast } from "sonner";
import { User, Phone, Search } from "lucide-react";

const PatientTokenPortal = () => {
  const [patientId, setPatientId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showTokenView, setShowTokenView] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSearching(true);
    
    // Simulate patient lookup
    setTimeout(() => {
      setShowTokenView(true);
      setIsSearching(false);
      toast.success("Token information loaded");
    }, 1000);
  };

  const handleLogout = () => {
    setShowTokenView(false);
    setPatientId("");
    setPhoneNumber("");
  };

  if (showTokenView) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2 tracking-tight">My OPD Token</h1>
              <p className="text-muted-foreground">View your token status and consultation details</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
          
          <PatientTokenView 
            patientId={patientId} 
            phoneNumber={phoneNumber} 
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Patient Token Portal
              </CardTitle>
              <p className="text-muted-foreground">
                Enter your phone number to view your OPD token status
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      View My Token
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p>Don't have a token yet?</p>
                <p>Please visit the hospital reception to register.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientTokenPortal;
