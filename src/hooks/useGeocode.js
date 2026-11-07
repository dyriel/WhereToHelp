const cache = new Map()

export async function geocodeAddress(address) {
  if (cache.has(address)) return cache.get(address)

  const encoded = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'VolunteerApp/1.0 (your@email.com)'
    }
  })

  const data = await res.json()

  if (!data || data.length === 0) {
    throw new Error('Address not found')
  }

  const result = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name
  }

  cache.set(address, result)
  return result
}