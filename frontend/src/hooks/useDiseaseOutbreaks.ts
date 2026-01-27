// TODO: Replace local data source with Firebase Firestore collection 'disease_outbreaks'
// This hook currently uses local data from src/data/diseaseOutbreaks.ts
// To integrate with Firebase, replace the local data imports and functions with Firebase calls

import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  diseaseOutbreaks, 
  getOutbreaksByDisease, 
  getOutbreaksBySeverity, 
  searchOutbreaks, 
  getCriticalOutbreaks,
  getSeverityCounts,
  type DiseaseOutbreak as LocalOutbreak 
} from '@/data/diseaseOutbreaks'

// TODO: Replace local data source with Firebase Firestore collection 'disease_outbreaks'

export type DiseaseOutbreak = LocalOutbreak

export function useDiseaseOutbreaks(filters?: { disease?: string; severity?: string; searchTerm?: string }) {
  const [outbreaks, setOutbreaks] = useState<DiseaseOutbreak[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate data fetching with local data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let data: DiseaseOutbreak[] = [];
      
      if (filters?.disease && filters.disease !== 'all') {
        data = getOutbreaksByDisease(filters.disease);
      } else if (filters?.severity === 'critical') {
        data = getCriticalOutbreaks();
      } else if (filters?.severity && filters.severity !== 'all') {
        data = getOutbreaksBySeverity(filters.severity);
      } else if (filters?.searchTerm) {
        data = searchOutbreaks(filters.searchTerm);
      } else {
        data = diseaseOutbreaks;
      }
      
      setOutbreaks(data)
    } catch (error) {
      console.error('Error fetching disease outbreaks:', error)
      setError('Failed to fetch outbreaks')
      setOutbreaks([])
    }

    setLoading(false)
  }, [filters])

  // Initial data load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered outbreaks based on current filters
  const filteredOutbreaks = useMemo(() => {
    if (!filters) return outbreaks;
    
    return outbreaks.filter(outbreak => {
      const matchesDisease = !filters.disease || filters.disease === 'all' || 
        outbreak.disease.toLowerCase() === filters.disease.toLowerCase();
      const matchesSeverity = !filters.severity || filters.severity === 'all' || 
        outbreak.severity === filters.severity;
      const matchesSearch = !filters.searchTerm || 
        outbreak.disease.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        outbreak.zone.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      return matchesDisease && matchesSeverity && matchesSearch;
    });
  }, [outbreaks, filters]);

  // Severity counts
  const severityCounts = useMemo(() => getSeverityCounts(), []);

  // Mark resolved (local state only)
  const markResolved = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Remove from local state
      setOutbreaks(prev => prev.filter(outbreak => outbreak.id !== id))
    } catch (error) {
      console.error('Error marking outbreak as resolved:', error)
      throw error
    }
  }

  // Refresh function (simulated re-fetch)
  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    outbreaks: filteredOutbreaks,
    allOutbreaks: outbreaks,
    loading,
    error,
    markResolved,
    refresh,
    severityCounts
  }
}
