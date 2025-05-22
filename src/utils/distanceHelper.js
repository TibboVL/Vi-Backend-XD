export function getDistanceFromLatLonInKm(
  latUser,
  lonUser,
  latActivity,
  lonActivity
) {
  const R = 6371; // Radius of earth in km
  const dLat = ((latActivity - latUser) * Math.PI) / 180;
  const dLon = ((lonActivity - lonUser) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latUser * Math.PI) / 180) *
      Math.cos((latActivity * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getCoordinateBoundingBox(lat, lon, distanceKm) {
  const R = 111; // km per degree latitude
  const latDelta = distanceKm / R;
  const lonDelta = distanceKm / (R * Math.cos((lat * Math.PI) / 180));

  return { deltaLon: lonDelta, deltaLat: latDelta };
}
