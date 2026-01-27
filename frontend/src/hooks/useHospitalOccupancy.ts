import { useEffect, useState, useCallback } from 'react'
import { mediSyncServices } from '@/lib/firebase-services'

export type HospitalOccupancy = {
  id: string
  name: string
  lat: number
  lng: number
  total_beds: number
  occupied_beds: number
  occupancy_ratio: number
}

export function useHospitalOccupancy() {
  const [data, setData] = useState<HospitalOccupancy[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      // Get hospital occupancy from Firebase
      const hospitals = await mediSyncServices.beds.getAll()
      const occupancyData = Object.entries(hospitals || {}).map(([id, hospital]: [string, any]) => ({
        id,
        name: hospital.name || `Hospital ${id}`,
        lat: hospital.lat || 0,
        lng: hospital.lng || 0,
        total_beds: hospital.totalBeds || 100,
        occupied_beds: hospital.occupiedBeds || 50,
        occupancy_ratio: hospital.occupancyRatio || 0.5
      }))
      setData(occupancyData)
    } catch (error) {
      console.error('Error fetching occupancy:', error)
      setData([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Listen for real-time updates
    const unsubscribe = mediSyncServices.beds.listen((beds) => {
      const occupancyData = Object.entries(beds || {}).map(([id, hospital]: [string, any]) => ({
        id,
        name: hospital.name || `Hospital ${id}`,
        lat: hospital.lat || 0,
        lng: hospital.lng || 0,
        total_beds: hospital.totalBeds || 100,
        occupied_beds: hospital.occupiedBeds || 50,
        occupancy_ratio: hospital.occupancyRatio || 0.5
      }))
      setData(occupancyData)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [fetchData])

  return { data, loading, refresh: fetchData }
}
