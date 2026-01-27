import { useState, useRef } from "react";
import { useDiseaseOutbreaks, type DiseaseOutbreak } from "@/hooks/useDiseaseOutbreaks";
import { outbreakUtils } from "@/lib/firestore-services";
import { 
  Bug, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  Shield,
  X,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DiseaseOutbreakMap from "@/components/DiseaseOutbreakMap";

interface TransformedOutbreak extends DiseaseOutbreak {
  reportedCases: number;
  trend: string;
  seasonality: string;
  detectionDate: string;
  predictedPeak: string;
  riskFactors: string[];
  recommendations: string[];
  lastUpdated: string;
}

const safeDate = (value?: string | null) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "N/A" : d.toISOString().split("T")[0];
};

const OutbreakDetection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedOutbreak, setSelectedOutbreak] = useState<TransformedOutbreak | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const filters = {
    disease: selectedDisease !== 'all' ? selectedDisease : undefined,
    severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
    searchTerm: searchTerm || undefined
  };
  
  const { outbreaks = [], loading, markResolved, refresh } = useDiseaseOutbreaks(
    (filters.disease || filters.severity || filters.searchTerm) ? filters : undefined
  );

  // Transform data to match UI expectations
  const transformedOutbreaks = Array.isArray(outbreaks) ? outbreaks.map((outbreak) => ({
    id: outbreak.id || `${outbreak.disease}-${outbreak.zone}`,
    disease: outbreak.disease,
    severity: outbreak.severity,
    affectedAreas: [outbreak.zone],
    reportedCases: outbreak.active_cases,
    trend: 'stable', // Default trend
    seasonality: "seasonal", // Default value
    detectionDate: outbreak.reported_at ? outbreakUtils.formatTimestamp(outbreak.reported_at) : "N/A",
    predictedPeak: outbreak.last_updated ? outbreakUtils.formatTimestamp(outbreak.last_updated) : "N/A",
    riskFactors: ["Community transmission", "Local spread"], // Default values
    recommendations: ["Monitor situation", "Prepare response"], // Default values
    lat: outbreak.lat,
    lng: outbreak.lng,
    zone: outbreak.zone,
    lastUpdated: outbreak.last_updated ? outbreakUtils.getRelativeTime(outbreak.last_updated) : "Unknown"
  })) : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "text-green-600 bg-green-100 border-green-500";
      case "medium": return "text-yellow-600 bg-yellow-100 border-yellow-500";
      case "high": return "text-orange-600 bg-orange-100 border-orange-500";
      case "critical": return "text-red-600 bg-red-100 border-red-500";
      default: return "text-gray-600 bg-gray-100 border-gray-500";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "stable": return <Activity className="w-4 h-4 text-yellow-500" />;
      case "decreasing": return <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredOutbreaks = Array.isArray(transformedOutbreaks) ? transformedOutbreaks.filter(outbreak => {
    const matchesSearch = outbreak?.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outbreak?.affectedAreas?.some(area => area?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = selectedSeverity === "all" || outbreak?.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  }) : [];

  const severities = ["all", "low", "medium", "high", "critical"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Bug className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Disease Outbreak Detection</h1>
              <p className="text-gray-600">Annual and seasonal disease pattern analysis to predict and prepare for potential health outbreaks</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Outbreaks</p>
                  <p className="text-2xl font-bold text-red-600">{Array.isArray(transformedOutbreaks) ? transformedOutbreaks.length : 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold text-orange-600">{Array.isArray(transformedOutbreaks) ? transformedOutbreaks.reduce((sum, o) => sum + (o?.reportedCases || 0), 0) : 0}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{Array.isArray(transformedOutbreaks) ? transformedOutbreaks.filter(o => o?.severity === 'critical').length : 0}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Areas Affected</p>
                  <p className="text-2xl font-bold text-blue-600">{Array.isArray(transformedOutbreaks) ? transformedOutbreaks.reduce((sum, o) => sum + (o?.affectedAreas?.length || 0), 0) : 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by disease name or affected area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {severities.map(severity => (
                <Button
                  key={severity}
                  variant={selectedSeverity === severity ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSeverity(severity)}
                  className="capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Outbreaks List */}
        <div className="space-y-6">
          {filteredOutbreaks.map((outbreak, index) => (
            <Card key={outbreak?.id || index} className={`border-l-4 ${getSeverityColor(outbreak?.severity || 'unknown').split(' ')[2]}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{outbreak?.disease || 'Unknown'}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(outbreak?.severity || 'unknown')}`}>
                        {(outbreak?.severity || 'unknown').toUpperCase()} SEVERITY
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(outbreak?.trend || 'unknown')}
                        <span className="text-sm text-gray-600">{outbreak?.trend || 'unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Reported Cases:</span>
                        <span className="ml-2 font-semibold text-lg">{outbreak?.reportedCases || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Seasonality:</span>
                        <span className="ml-2 font-medium capitalize">{outbreak?.seasonality || 'unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Detected:</span>
                        <span className="ml-2 font-medium">{outbreak?.detectionDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Peak Prediction:</span>
                        <span className="ml-2 font-medium">{outbreak?.predictedPeak || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        Affected Areas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(outbreak?.affectedAreas || []).map((area, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {area || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </div>
                        <ul className="text-sm space-y-1">
                          {(outbreak?.riskFactors || []).map((factor, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Shield className="w-4 h-4" />
                          Recommendations
                        </div>
                        <ul className="text-sm space-y-1">
                          {(outbreak?.recommendations || []).map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {outbreak?.severity === "critical" && (
                      <Button variant="destructive" size="sm">
                        Emergency Response
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredOutbreaks.length === 0 && (
          <div className="text-center py-12">
            <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No outbreaks found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutbreakDetection;
