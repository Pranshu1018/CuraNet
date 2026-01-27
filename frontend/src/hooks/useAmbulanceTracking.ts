import { useEffect, useState, useCallback } from 'react'
import { realtimeDB } from '@/lib/firebase-services'

export function useAmbulanceTracking(statusFilter?: string) {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const data = await realtimeDB.readData('ambulancePositions');
      
      let ambulanceArray = [];
      if (data && typeof data === 'object') {
        ambulanceArray = Object.entries(data).map(([id, position]: [string, any]) => ({
          id,
          ...position
        }));
      }
      
      // Apply status filter if provided
      let filteredData = ambulanceArray;
      if (statusFilter && statusFilter !== 'all') {
        filteredData = ambulanceArray.filter((ambulance: any) => ambulance.status === statusFilter);
      }
      
      // Sort by updated_at descending
      filteredData.sort((a: any, b: any) => {
        const timeA = new Date(a.updated_at || 0).getTime();
        const timeB = new Date(b.updated_at || 0).getTime();
        return timeB - timeA;
      });
      
      setAmbulances(Array.isArray(filteredData) ? filteredData : []);
    } catch (error) {
      console.error('Error fetching ambulance positions:', error);
      setAmbulances([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const trackAmbulance = async (ambulanceId: string) => {
    try {
      await realtimeDB.updateData(`ambulancePositions/${ambulanceId}`, { 
        updated_at: new Date().toISOString() 
      });
      
      // Refresh data after update
      await fetchData();
    } catch (error) {
      console.error('Error tracking ambulance:', error);
    }
  };

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ambulances: Array.isArray(ambulances) ? ambulances : [],
    loading,
    trackAmbulance,
    refetch: fetchData
  };
}
