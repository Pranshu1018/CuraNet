import { realtimeDB } from '@/lib/firebase-services'
import { useEffect, useState } from 'react'

export function useResourceDecay() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resourceData = await realtimeDB.readData('resourceUsage');
        
        let resourceArray = [];
        if (resourceData && typeof resourceData === 'object') {
          resourceArray = Object.entries(resourceData).map(([id, resource]: [string, any]) => ({
            id,
            ...resource
          }));
        }
        
        // Sort by created_at descending
        resourceArray.sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        });
        
        setData(resourceArray);
      } catch (error) {
        console.error('Error fetching resource usage:', error);
        setData([]);
      }
      setLoading(false);
    }

    fetchData()
  }, [])

  return { data, loading }
}
