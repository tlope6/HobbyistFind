export const getUserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000 }
    )
  })
export const FALLBACK_LOCATION = { lat: 41.8781, lng: -87.6298 }
