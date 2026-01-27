import { useState } from "react";
import { useResourceDecay } from "@/hooks/useResourceDecay";
import { 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  Clock,
  Calendar,
  BarChart3,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper function to format time ago
function formatTimeAgo(date: string | null | undefined): string {
  if (!date) return "Unknown";
  
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return "Unknown";
    
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  } catch (error) {
    return "Unknown";
  }
}

// Calculate risk level based on remaining percentage and expiry
function calculateRisk(resource: any): string {
  const totalUnits = resource.total_units || 0;
  const usedUnits = resource.used_units || 0;
  const remainingUnits = totalUnits - usedUnits;
  const remainingPercentage = totalUnits > 0 ? (remainingUnits / totalUnits) * 100 : 0;
  
  // Calculate days to expiry
  const today = new Date();
  const expiryDate = resource.expiry_date ? new Date(resource.expiry_date) : null;
  const daysToExpiry = expiryDate && !isNaN(expiryDate.getTime()) 
    ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  
  // CRITICAL: remaining ≤ 10% OR expiry < 7 days
  if (remainingPercentage <= 10 || daysToExpiry < 7) {
    return "critical";
  }
  // HIGH: remaining ≤ 25% OR expiry < 30 days
  if (remainingPercentage <= 25 || daysToExpiry < 30) {
    return "high";
  }
  // MEDIUM: otherwise
  return "medium";
}

// Calculate usage velocity based on days since creation
function calculateUsageVelocity(resource: any): number {
  const usedUnits = resource.used_units || 0;
  const createdAt = resource.created_at ? new Date(resource.created_at) : new Date();
  const today = new Date();
  const daysSinceCreated = Math.max(1, Math.ceil((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  
  return usedUnits / daysSinceCreated;
}

// Calculate estimated monthly waste
function calculateMonthlyWaste(resource: any): number {
  const totalUnits = resource.total_units || 0;
  const usedUnits = resource.used_units || 0;
  const remainingUnits = totalUnits - usedUnits;
  const costPerUnit = resource.cost_per_unit || 0;
  
  if (!costPerUnit || remainingUnits <= 0) return 0;
  
  // Calculate days to expiry
  const today = new Date();
  const expiryDate = resource.expiry_date ? new Date(resource.expiry_date) : null;
  const daysToExpiry = expiryDate && !isNaN(expiryDate.getTime()) 
    ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  
  // Estimate waste as percentage of remaining value for items expiring within 30 days
  if (daysToExpiry > 30) return 0;
  
  const wastePercentage = daysToExpiry < 7 ? 0.5 : 0.2;
  return remainingUnits * costPerUnit * wastePercentage;
}

// Helper functions for risk colors
const getRiskColor = (risk: string) => {
  switch (risk) {
    case "low": return "text-green-600 bg-green-100";
    case "medium": return "text-yellow-600 bg-yellow-100";
    case "high": return "text-orange-600 bg-orange-100";
    case "critical": return "text-red-600 bg-red-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

const getRiskBorder = (risk: string) => {
  switch (risk) {
    case "low": return "border-l-green-500";
    case "medium": return "border-l-yellow-500";
    case "high": return "border-l-orange-500";
    case "critical": return "border-l-red-500";
    default: return "border-l-gray-500";
  }
};

const ResourceDecay = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: resources = [], loading } = useResourceDecay();

  // Transform data to match UI expectations
  const transformedResources = Array.isArray(resources) ? resources.map((resource, index) => {
    const riskLevel = calculateRisk(resource);
    const usageVelocity = calculateUsageVelocity(resource);
    const monthlyWaste = calculateMonthlyWaste(resource);
    const remainingUnits = (resource.total_units || 0) - (resource.used_units || 0);
    
    return {
      id: `resource-${index}-${resource.resource_name || 'unknown'}-${resource.hospital_id || 'unknown'}`,
      name: resource.resource_name || 'Unknown',
      category: resource.category || 'Unknown',
      currentStock: remainingUnits, // Computed from total_units - used_units
      usageVelocity: usageVelocity, // Computed from used_units / days_since_created
      expiryDate: resource.expiry_date || 'Unknown',
      wasteRisk: riskLevel,
      lastUpdated: formatTimeAgo(resource.created_at), // Use created_at
      location: resource.hospital_id || 'Unknown',
      monthlyWaste: monthlyWaste
    };
  }) : [];

  const filteredResources = Array.isArray(transformedResources) && transformedResources.filter(resource => {
    const matchesSearch = (resource?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "Medicine", "Equipment", "Supplies", "Blood"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resource Decay & Waste Predictor</h1>
              <p className="text-gray-600">Predicts unused or expiring resources by tracking usage velocity</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Risk Items</p>
                  <p className="text-2xl font-bold text-red-600">{Array.isArray(transformedResources) && transformedResources.filter(r => r.wasteRisk === 'critical').length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Risk Items</p>
                  <p className="text-2xl font-bold text-orange-600">{Array.isArray(transformedResources) && transformedResources.filter(r => r.wasteRisk === 'high').length}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-blue-600">{Array.isArray(transformedResources) ? transformedResources.length : 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Est. Monthly Waste</p>
                  <p className="text-2xl font-bold text-gray-600">${Array.isArray(transformedResources) ? (transformedResources.reduce((sum, r) => sum + (r.currentStock * 10), 0) / 1000).toFixed(1) : 0}K</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-500" />
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
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Resources List */}
        <div className="space-y-4">
          {Array.isArray(transformedResources) && transformedResources.map((resource) => (
            <Card key={resource.id} className={`border-l-4 ${getRiskBorder(resource.wasteRisk)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(resource.wasteRisk)}`}>
                        {resource.wasteRisk.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-2 font-medium">{resource.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="ml-2 font-medium">{resource.currentStock} units</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Usage Velocity:</span>
                        <span className="ml-2 font-medium">{resource.usageVelocity}/day</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">{resource.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">{resource.expiryDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Updated:</span>
                        <span>{resource.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {resource.wasteRisk === "critical" && (
                      <Button variant="destructive" size="sm">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {(!Array.isArray(transformedResources) || transformedResources.length === 0) && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceDecay;
