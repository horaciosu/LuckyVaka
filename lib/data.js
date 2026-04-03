// Mock data — replace with real Supabase queries when ready

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'MXN', symbol: '$', label: 'MXN — Peso Mexicano' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
]

export const formatPrice = (amount, currency = 'USD') => {
  const symbols = { USD: '$', MXN: '$', EUR: '€' }
  const sym = symbols[currency] || '$'
  return `${sym}${Number(amount).toLocaleString()} ${currency}`
}

export const RAFFLES = [
  {
    id: 'san-carlos-01',
    slug: 'beach-house-san-carlos',
    currency: 'USD',
    title: 'Beach House — San Carlos',
    title_es: 'Casa de Playa — San Carlos',
    location: 'San Carlos, Sonora, MX',
    type: 'Beach house',
    beds: 2, baths: 2, guests: 4,
    description_en: 'A beautiful beachfront home steps away from the Sea of Cortez. Wake up to the sound of waves and enjoy stunning sunsets from your private terrace. Perfect for couples or small families looking for a premium coastal escape.',
    description_es: 'Casa frente al mar a pasos del Mar de Cortés. Despierta con el sonido de las olas y disfruta atardeceres desde tu terraza privada. Ideal para parejas o familias pequeñas.',
    ticket_price: 5,
    total_tickets: 300,
    tickets_sold: 187,
    min_tickets: 150,
    stay_value: 1200,
    draw_date: '2025-07-08',
    stay_date: '2025-07-15',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #b3e0f7, #81c8f0)',
    amenities: ['Ocean view terrace', 'High-speed Wi-Fi', 'Full A/C', 'Fully equipped kitchen', 'Private parking', 'Washer / dryer', 'Smart TV', 'Beach chairs'],
    images: [],
    status: 'active',
  },
  {
    id: 'tucson-01',
    slug: 'modern-home-tucson',
    currency: 'USD',
    title: 'Modern Home — Tucson',
    title_es: 'Casa Moderna — Tucson',
    location: 'Tucson, Arizona, USA',
    type: 'House',
    beds: 3, baths: 2, guests: 6,
    description_en: 'A stunning modern home in the heart of Tucson with a private pool. Surrounded by the Sonoran Desert, this property offers a unique blend of luxury and natural beauty. Minutes from Saguaro National Park.',
    description_es: 'Hermosa casa moderna en el corazón de Tucson con alberca privada. Rodeada del Desierto de Sonora, esta propiedad ofrece una mezcla única de lujo y belleza natural.',
    ticket_price: 10,
    total_tickets: 400,
    tickets_sold: 312,
    min_tickets: 200,
    stay_value: 2500,
    draw_date: '2025-04-15',
    stay_date: '2025-04-22',
    emoji: '🏡',
    gradient: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
    amenities: ['Private pool', 'Desert views', 'High-speed Wi-Fi', 'Full A/C', 'BBQ grill', 'Smart TV', 'Washer / dryer', 'Parking x2'],
    images: [],
    status: 'active',
  },
]

export const PAST_WINNERS = [
  { name: 'Ana R.', city: 'CDMX', date: 'Feb 2025', tickets: 3, raffle: 'San Carlos' },
  { name: 'Carlos M.', city: 'Hermosillo', date: 'Mar 2025', tickets: 5, raffle: 'San Carlos' },
  { name: 'Sarah T.', city: 'Phoenix AZ', date: 'Mar 2025', tickets: 1, raffle: 'Tucson' },
]

export const STATS = {
  activeRaffles: 2,
  minTicketPrice: 1,
  winnersToDate: 3,
  countries: 2,
}
