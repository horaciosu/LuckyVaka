import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import RaffleCard from '../components/RaffleCard'
import { supabase } from '../lib/supabase'

const SUBS = {
  en: [
    'Get a chance to stay in premium properties with just a little luck. Real homes, real winners, every draw.',
    'Enter from $1. Premium properties, real winners, every single raffle.',
    'Your next luxury vacation could cost less than you think. Real homes, real winners, every draw.',
    'Access premium stays thanks to your luck. Real homes, real winners, every raffle.',
  ],
  es: [
    'Accede a propiedades premium gracias a tu suerte. Casas reales, ganadores reales, cada sorteo.',
    'Tu próxima vacación de lujo podría costarte menos de lo que imaginas. Ganadores reales, cada rifa.',
    'Entra al sorteo desde solo un boleto. Propiedades reales, ganadores garantizados, siempre.',
    'La suerte es tuya. Propiedades premium reales, ganadores reales, cada sorteo.',
  ],
}

const copy = {
  en: {
    tag: 'Win your next vacation for less',
    h1a: 'Luxury stays.',
    h1b: 'Lucky prices.',
    searchPlaceholder: 'Search destination...',
    search: 'Search',
    stat1: 'Active raffles',
    stat2: 'Starting ticket price',
    stat3: 'Guaranteed winner',
    stat4: 'Countries',
    activeTitle: 'Active raffles',
    seeAll: 'See all →',
    howTitle: 'How it works',
    steps: [
      { t: 'Choose a stay', d: 'Browse available properties and pick the one you want' },
      { t: 'Buy tickets', d: 'Get as many as you like. More tickets = more chances' },
      { t: 'Live draw', d: 'Watch it live. A guaranteed winner every time' },
      { t: 'Pack your bags', d: 'Winner confirmed and enjoys their stay' },
    ],
    ctaH: 'Ready to get lucky?',
    ctaP: "Join travelers winning vacations they couldn't otherwise afford.",
    ctaBtn: 'Browse raffles',
    ctaHost: 'List my property',
    loading: 'Loading active raffles...',
    noRaffles: 'No active raffles at the moment.',
  },
  es: {
    tag: 'Gana tus próximas vacaciones por menos',
    h1a: 'Estancias de lujo.',
    h1b: 'Precios con suerte.',
    searchPlaceholder: 'Buscar destino...',
    search: 'Buscar',
    stat1: 'Rifas activas',
    stat2: 'Precio mínimo',
    stat3: 'Ganador garantizado',
    stat4: 'Países',
    activeTitle: 'Rifas activas',
    seeAll: 'Ver todas →',
    howTitle: '¿Cómo funciona?',
    steps: [
      { t: 'Elige una estancia', d: 'Navega las propiedades y elige la que quieras' },
      { t: 'Compra boletos', d: 'Los que quieras. Más boletos = más probabilidades' },
      { t: 'Sorteo en vivo', d: 'Ve el sorteo en vivo. Siempre hay ganador' },
      { t: 'Haz tus maletas', d: 'El ganador confirma y disfruta su estancia' },
    ],
    ctaH: '¿Listo para tener suerte?',
    ctaP: 'Únete a viajeros que ganan vacaciones que de otra forma no podrían costear.',
    ctaBtn: 'Ver rifas',
    ctaHost: 'Listar mi propiedad',
    loading: 'Cargando rifas activas...',
    noRaffles: 'No hay rifas activas en este momento.',
  },
}

export default function Home({ lang, setLang }) {
  const [search, setSearch] = useState('')
  const [subIndex, setSubIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ activeRaffles: 0, minTicketPrice: 1, countries: 0 })
  const t = copy[lang] || copy.es

  useEffect(() => {
    const fetchRaffles = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('raffles')
          .select('id, slug, status, ticket_price, currency, total_tickets, tickets_sold, draw_date, stay_date, property_id')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6)

        if (error) { console.error('Raffles error:', error); setLoading(false); return }

        if (data && data.length > 0) {
          const propertyIds = data.map(r => r.property_id)
          const { data: props } = await supabase
            .from('properties')
            .select('id, name, city, country, images')
            .in('id', propertyIds)

          const normalized = data.map(r => {
            const p = props?.find(p => p.id === r.property_id) || {}
            return {
              ...r,
              title: p.name || 'Property',
              title_es: p.name || 'Propiedad',
              location: [p.city, p.country].filter(Boolean).join(', '),
              images: p.images || [],
            }
          })
          setRaffles(normalized)
          const countries = new Set(props?.map(p => p.country).filter(Boolean)).size
          setStats({ activeRaffles: data.length, minTicketPrice: Math.min(...data.map(r => r.ticket_price)), countries: countries || 1 })
        }
      } catch(e) { console.error(e) }
      setLoading(false)
    }
    fetchRaffles()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setSubIndex(i => (i + 1) % SUBS[lang === 'es' ? 'es' : 'en'].length)
        setFade(true)
      }, 400)
    }, 7000)
    return () => clearInterval(interval)
  }, [lang])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <section style={{ padding: '56px 24px 48px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'var(--brand-light)', color: 'var(--brand-dark)', fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>
          {t.tag}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 600, lineHeight: 1.15, color: 'var(--text)', marginBottom: 18 }}>
          {t.h1a}<br />
          <span style={{ fontStyle: 'italic', color: 'var(--brand)' }}>{t.h1b}</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px', transition: 'opacity 0.4s ease', opacity: fade ? 1 : 0 }}>
          {SUBS[lang === 'es' ? 'es' : 'en'][subIndex]}
        </p>
        <div style={{ display: 'flex', gap: 8, maxWidth: 500, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder}
            style={{ flex: 1, minWidth: 200, padding: '11px 16px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
          <Link href="/raffles" className="btn-primary">{t.search}</Link>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '20px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexWrap: 'wrap' }}>
        {[
          { val: stats.activeRaffles, label: t.stat1 },
          { val: `$${stats.minTicketPrice}`, label: t.stat2 },
          { val: '100%', label: t.stat3 },
          { val: stats.countries, label: t.stat4 },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{t.activeTitle}</h2>
          <Link href="/raffles" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none' }}>{t.seeAll}</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>⏳ {t.loading}</div>
          ) : raffles.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>{t.noRaffles}</div>
          ) : raffles.map(r => <RaffleCard key={r.id} raffle={r} lang={lang} />)}
        </div>
      </section>

      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 24, textAlign: 'center' }}>{t.howTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {t.steps.map((step, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, margin: '0 auto 12px' }}>{i + 1}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{step.t}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '56px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{t.ctaH}</h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>{t.ctaP}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/raffles" className="btn-primary">{t.ctaBtn}</Link>
          <Link href="/host" className="btn-secondary">{t.ctaHost}</Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--subtle)' }}>
        © 2025 Lucky Vacations · Powered by transparency and good luck
      </footer>
    </div>
  )
}
