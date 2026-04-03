import { useEffect, useRef, useState } from 'react'

const INTEREST_TYPES = [
  { type: 'beach', label: 'Beach', label_es: 'Playa', icon: '🏖', color: '#378ADD' },
  { type: 'restaurant', label: 'Restaurants', label_es: 'Restaurantes', icon: '🍽', color: '#E24B4A' },
  { type: 'airport', label: 'Airport', label_es: 'Aeropuerto', icon: '✈️', color: '#7F77DD' },
  { type: 'supermarket', label: 'Supermarket', label_es: 'Supermercado', icon: '🛒', color: '#1D9E75' },
  { type: 'hospital', label: 'Hospital', label_es: 'Hospital', icon: '🏥', color: '#EF9F27' },
  { type: 'tourist_attraction', label: 'Attractions', label_es: 'Atracciones', icon: '🎯', color: '#D4537E' },
]

export default function PropertyMap({ location, coordinates, lang = 'en', apiKey }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [activeFilter, setActiveFilter] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [nearby, setNearby] = useState([])

  // Default coordinates for our two pilot properties
  const getCoords = () => {
    if (coordinates) return coordinates
    if (location?.includes('San Carlos')) return { lat: 27.9353, lng: -111.0448 }
    if (location?.includes('Tucson')) return { lat: 32.2226, lng: -110.9747 }
    return { lat: 27.9353, lng: -111.0448 }
  }

  useEffect(() => {
    if (!apiKey || loaded) return

    const scriptId = 'google-maps-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initLuckyMap`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    window.initLuckyMap = () => setLoaded(true)

    if (window.google?.maps) setLoaded(true)
  }, [apiKey])

  useEffect(() => {
    if (!loaded || !mapRef.current) return

    const coords = getCoords()
    const map = new window.google.maps.Map(mapRef.current, {
      center: coords,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
      ],
    })

    mapInstanceRef.current = map

    // Main property marker
    const propertyMarker = new window.google.maps.Marker({
      position: coords,
      map,
      title: location || 'Property',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#1D9E75',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
      zIndex: 999,
    })

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family:sans-serif;padding:4px 2px;">
          <div style="font-weight:600;font-size:13px;color:#1A1916;margin-bottom:2px;">📍 ${location || 'Property'}</div>
          <div style="font-size:11px;color:#6B6860;">${lang === 'es' ? 'Tu propiedad' : 'Your property'}</div>
        </div>
      `,
    })

    propertyMarker.addListener('click', () => infoWindow.open(map, propertyMarker))

    // Search for nearby places
    const service = new window.google.maps.places.PlacesService(map)
    const allNearby = []

    const searchTypes = ['restaurant', 'supermarket', 'hospital', 'tourist_attraction']

    searchTypes.forEach(type => {
      service.nearbySearch({
        location: coords,
        radius: 3000,
        type,
      }, (results, status) => {
        if (status === 'OK' && results) {
          const top = results.slice(0, 3).map(r => ({
            name: r.name,
            type,
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
            rating: r.rating,
            vicinity: r.vicinity,
          }))
          allNearby.push(...top)
          setNearby(prev => [...prev, ...top])
        }
      })
    })

  }, [loaded, location])

  // Filter markers by type
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const coords = getCoords()
    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)
    const typeInfo = INTEREST_TYPES.find(t => t.type === activeFilter)
    if (!typeInfo || !activeFilter) return

    service.nearbySearch({
      location: coords,
      radius: 5000,
      type: activeFilter,
    }, (results, status) => {
      if (status !== 'OK' || !results) return
      results.slice(0, 8).forEach(place => {
        const marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: mapInstanceRef.current,
          title: place.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: typeInfo.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        })

        const iw = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:4px 2px;max-width:180px;">
              <div style="font-weight:600;font-size:12px;color:#1A1916;">${typeInfo.icon} ${place.name}</div>
              ${place.rating ? `<div style="font-size:11px;color:#6B6860;">⭐ ${place.rating}</div>` : ''}
              ${place.vicinity ? `<div style="font-size:10px;color:#9B9890;margin-top:2px;">${place.vicinity}</div>` : ''}
            </div>
          `,
        })
        marker.addListener('click', () => iw.open(mapInstanceRef.current, marker))
        markersRef.current.push(marker)
      })
    })
  }, [activeFilter, loaded])

  const coords = getCoords()

  return (
    <div>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {INTEREST_TYPES.map(t => (
          <button
            key={t.type}
            onClick={() => setActiveFilter(activeFilter === t.type ? null : t.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 11px', borderRadius: 20, fontSize: 11,
              cursor: 'pointer', border: '1px solid',
              borderColor: activeFilter === t.type ? t.color : 'var(--border)',
              background: activeFilter === t.type ? t.color + '18' : 'var(--surface)',
              color: activeFilter === t.type ? t.color : 'var(--muted)',
              fontWeight: activeFilter === t.type ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            {lang === 'es' ? t.label_es : t.label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 28 }}>🗺️</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {lang === 'es' ? 'Cargando mapa...' : 'Loading map...'}
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height: 320, width: '100%' }} />
      </div>

      {/* Coordinates note */}
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>📍</span>
        <span>{lang === 'es' ? 'Ubicación aproximada de la zona — dirección exacta solo para ganadores' : 'Approximate area location — exact address shared with winners only'}</span>
      </div>
    </div>
  )
}
