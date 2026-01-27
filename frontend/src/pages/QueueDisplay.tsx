import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  Stethoscope,
  RefreshCw,
  Filter,
  Search,
  Bell,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  tokenNumber: string;
  name: string;
  positionInQueue: number;
  estimatedWaitTime: number;
  department: string;
  priority: string;
  status: string;
  checkInTime: string;
}

interface QueueData {
  department: string;
  totalPatients: number;
  queue: Patient[];
}

export const QueueDisplay = () => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const departments = [
    'all',
    'Cardiology',
    'General Medicine',
    'Pediatrics', 
    'Neurology',
    'Orthopedics',
    'Emergency'
  ];

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
    emergency: 'bg-red-600 text-white'
  };

  const statusColors = {
    registered: 'bg-blue-100 text-blue-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    'in-consultation': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const fetchQueueData = async (department?: string) => {
    setLoading(true);
    try {
      const dept = department === 'all' ? 'General Medicine' : department;
      const response = await fetch(`http://localhost:5001/api/patients/queue/${dept}`);
      
      if (response.ok) {
        const data = await response.json();
        setQueueData(data.data);
        setLastUpdate(new Date());
      } else {
        toast.error('Failed to fetch queue data');
      }
    } catch (error) {
      console.error('Queue fetch error:', error);
      toast.error('Network error while fetching queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData(selectedDepartment);
    
    // Setup WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:5001');
    
    ws.onopen = () => {
      console.log('Queue display WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'patient_registered' || data.type === 'status_updated') {
        // Refresh queue data
        fetchQueueData(selectedDepartment);
        
        // Show notification
        if (data.type === 'patient_registered') {
          toast.info('New patient registered', {
            description: `${data.patient.name} joined ${data.department} queue`
          });
        } else if (data.type === 'status_updated') {
          toast.info('Queue status updated', {
            description: `Token ${data.tokenNumber} status: ${data.status}`
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => {
        const ws = new WebSocket('ws://localhost:5001');
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [selectedDepartment]);

  const filteredQueue = queueData?.queue?.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const averageWaitTime = queueData?.queue?.length > 0 
    ? Math.round(queueData.queue.reduce((sum, p) => sum + p.estimatedWaitTime, 0) / queueData.queue.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                OPD Queue Management
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time queue status and patient management
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button
                onClick={() => fetchQueueData(selectedDepartment)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {queueData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{queueData.totalPatients}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Department</p>
                    <p className="text-lg font-bold text-gray-900">{queueData.department}</p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                    <p className="text-2xl font-bold text-gray-900">{averageWaitTime} min</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Now Serving</p>
                    <p className="text-lg font-bold text-green-600">
                      {filteredQueue.find(p => p.status === 'in-consultation')?.tokenNumber || 'None'}
                    </p>
                  </div>
                  <Bell className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Department:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-1 w-full md:w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Queue List - {selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                <p className="mt-2 text-gray-600">Loading queue data...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patients in queue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Token</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Position</th>
                      <th className="text-left p-3 font-medium">Wait Time</th>
                      <th className="text-left p-3 font-medium">Priority</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((patient, index) => (
                      <tr key={patient.tokenNumber} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-mono font-bold text-blue-600">
                            {patient.tokenNumber}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{patient.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-gray-500" />
                            {patient.department}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-lg">
                            #{patient.positionInQueue}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {patient.estimatedWaitTime} min
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={priorityColors[patient.priority as keyof typeof priorityColors]}>
                            {patient.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={statusColors[patient.status as keyof typeof statusColors]}>
                            {patient.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(patient.checkInTime).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Updates Alert */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Real-time Updates Active</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Queue updates automatically when patients register or status changes. 
            Patients receive live notifications about their queue position.
          </p>
        </div>
      </div>
    </div>
  );
};
