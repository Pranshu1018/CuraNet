import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mediSyncServices } from '@/lib/firebase-services';
import { 
  Bed, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Heart,
  Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { typographyClasses } from '@/lib/typography';

export const NurseDashboard = () => {
  const { user } = useAuth();
  const [bedStats, setBedStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0
  });

  useEffect(() => {
    const loadBedData = async () => {
      try {
        const beds = await mediSyncServices.beds.getAllBeds();
        if (beds) {
          const bedsArray = typeof beds === 'object' && !Array.isArray(beds)
            ? Object.values(beds)
            : Array.isArray(beds) ? beds : [];
          
          setBedStats({
            total: bedsArray.length,
            available: bedsArray.filter((b: any) => b.status === 'available').length,
            occupied: bedsArray.filter((b: any) => b.status === 'occupied').length,
            reserved: bedsArray.filter((b: any) => b.status === 'reserved').length
          });
        }
      } catch (error) {
        console.error('Error loading bed data:', error);
      }
    };

    loadBedData();
  }, []);

  return (
    <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nurse Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name} • {user?.department || 'General Ward'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bedStats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{bedStats.available}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{bedStats.occupied}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{bedStats.reserved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            role="link"
            tabIndex={0}
            onClick={() => {
              window.location.href = "/beds";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.location.href = "/beds";
              }
            }}
            className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-blue-600" />
                Bed Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage bed status and assignments
              </p>
              <Link to="/beds">
                <Button className="w-full">
                  Manage Beds <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            role="link"
            tabIndex={0}
            onClick={() => {
              window.location.href = "/admission";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.location.href = "/admission";
              }
            }}
            className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Patient Care
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View patient assignments and care plans
              </p>
              <Link to="/admission">
                <Button variant="outline" className="w-full">
                  View Patients <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            role="link"
            tabIndex={0}
            onClick={() => {
              window.location.href = "/smart-opd";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.location.href = "/smart-opd";
              }
            }}
            className={cn(typographyClasses.interactiveCard, "hover:shadow-lg")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                OPD Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor OPD patient flow
              </p>
              <Link to="/smart-opd">
                <Button variant="outline" className="w-full">
                  View Queue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};
