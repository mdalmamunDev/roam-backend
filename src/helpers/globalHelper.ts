import haversineDistance from "haversine-distance";

export const getDistanceInKm = (coordinates_a: [number, number], coordinates_b: [number, number]) : number | null => {
    if(!coordinates_a || !coordinates_b || coordinates_a.length < 2 || coordinates_b.length < 2) {
        return null;
    }

    const distanceInMeters = haversineDistance(
          { lat: coordinates_a[1], lng: coordinates_a[0] },
          { lat: coordinates_b[1], lng: coordinates_b[0] },
        );
    
    return distanceInMeters / 1000;
}


export const getAddressFromCoordinates = async (coordinates: [number, number]): Promise<string | null> => {
  const apiKey = process.env.MAP_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates[1]},${coordinates[0]}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      // Find first result with non-empty formatted_address
      for (const result of data.results) {
        if (result.formatted_address && result.formatted_address.trim() !== "") {
          return result.formatted_address;
        }
      }

      // fallback: try plus_code.compound_code if available
      if (data.plus_code && data.plus_code.compound_code) {
        return data.plus_code.compound_code;
      }

      console.warn("No formatted_address found in any result.");
      return null;
    } else {
      console.error(`Google Maps API returned status: ${data.status}`, data.error_message || "");
      return null;
    }
  } catch (error) {
    console.error("Error fetching address from Google Maps API:", error);
    return null;
  }
};
