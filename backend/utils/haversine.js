/**
 * Haversine Formula Implementation
 * Calculates the great-circle distance between two points on Earth
 * given their latitude and longitude coordinates
 * 
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lon1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lon2 - Longitude of second point in degrees
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Calculate using Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Create a location-based ambulance assignment key for consistency
 * @param {number} lat - Latitude 
 * @param {number} lon - Longitude
 * @returns {string} Location-based key
 */
function createLocationKey(lat, lon) {
  // Round to 3 decimal places (~100m precision) for grouping nearby locations
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;
  return `${roundedLat},${roundedLon}`;
}

/**
 * Find the nearest ambulance to a given location with consistent assignment
 * 
 * @param {Array} ambulances - Array of ambulance objects with latitude, longitude, and status
 * @param {number} targetLat - Target latitude
 * @param {number} targetLon - Target longitude
 * @returns {Object|null} Nearest available ambulance or null
 */
function findNearestAmbulance(ambulances, targetLat, targetLon) {
  // Filter only available ambulances
  const availableAmbulances = ambulances.filter(amb => amb.status === 'AVAILABLE');

  if (availableAmbulances.length === 0) {
    return null;
  }

  // Create location key for consistent assignment
  const locationKey = createLocationKey(targetLat, targetLon);
  console.log(`🔑 Location key: ${locationKey}`);

  // Calculate distance for each ambulance and find minimum
  let nearestAmbulance = null;
  let minDistance = Infinity;

  availableAmbulances.forEach(ambulance => {
    const distance = haversineDistance(
      targetLat,
      targetLon,
      ambulance.latitude,
      ambulance.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestAmbulance = {
        ...ambulance.toObject ? ambulance.toObject() : ambulance,
        distance: distance
      };
    }
  });

  // Add consistent assignment: Use ambulance ID as tiebreaker for same location
  if (nearestAmbulance) {
    // Sort by ID for consistent selection when distances are similar
    const sameLocationAmbulances = availableAmbulances
      .filter(amb => {
        const ambDistance = haversineDistance(targetLat, targetLon, amb.latitude, amb.longitude);
        return Math.abs(ambDistance - minDistance) < 0.1; // Within 100m
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    
    if (sameLocationAmbulances.length > 0) {
      const consistentAmbulance = sameLocationAmbulances[0];
      console.log(`🎯 Consistent assignment: ${consistentAmbulance.id} (distance: ${minDistance.toFixed(3)}km)`);
      return {
        ...consistentAmbulance.toObject ? consistentAmbulance.toObject() : consistentAmbulance,
        distance: minDistance
      };
    }
  }

  console.log(`🚑 Selected: ${nearestAmbulance.id} (${nearestAmbulance.distance?.toFixed(3)}km)`);
  return nearestAmbulance;
}

module.exports = {
  haversineDistance,
  findNearestAmbulance,
  createLocationKey
};
