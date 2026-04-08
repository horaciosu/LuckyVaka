// pages/draw/[slug].jsx
// Página en vivo del sorteo — animación, countdown, ganador

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function DrawLivePage({ lang, setLang }) {
  const router = useRouter()
  const { slug } = router.query
  const { user } = useAuth()
  const t = (en, es) => lang === 'es' ? es : en

  const [raffle, setRaffle] = useState(null)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('waiting') // waiting | countdown | spinning | result
  const [countdown, setCountdown] = useState(10)
  const [spinNumber, setSpinNumber] = useState('??')
  const [winner, setWinner] = useState(null) // { ticket, name }
  const [executing, setExecuting] = useState(false)
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 40) + 12) // simulado
  const spinInterval = useRef(null)
  const isAdmin = user?.email === 'horaciosoriau@gmail.com'

  useEffect(() => {
    if (!slug) return
    loadRaffle()
  }, [slug])

  // Polling cada 3 segundos para detectar si ya hay ganador (otros usuarios en vivo)
  useEffect(() => {
    if (!slug) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('raffles')
        .select('status, winner_ticket, winner_user_id')
        .eq('slug', slug)
        .single()
      if (data?.status === 'completed' && data.winner_ticket && phase !== 'result') {
        setWinner({ ticket: data.winner_ticket })
        setPhase('result')
      }
      // Simular viewers fluctuando
      setViewers(v => v + Math.floor(Math.random() * 3) - 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [slug, phase])

  const loadRaffle = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('raffles')
      .select('*, properties(name, city, country, images)')
      .eq('slug', slug)
      .single()
    if (error || !data) { setLoading(false); return }
    setRaffle(data)
    setProperty(data.properties)
    // Si ya está completada mostrar resultado directo
    if (data.status === 'completed' && data.winner_ticket) {
      setWinner({ ticket: data.winner_ticket })
      setPhase('result')
    }
    setLoading(false)
  }

  const startCountdown = () => {
    setPhase('countdown')
    let c = 10
    setCountdown(c)
    const id = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        clearInterval(id)
        startSpin()
      }
    }, 1000)
  }

  const startSpin = () => {
    setPhase('spinning')
    const totalTickets = raffle?.total_tickets || 100
    let speed = 50
    let iterations = 0
    const maxIterations = 40

    spinInterval.current = setInterval(() => {
      const rnd = Math.floor(Math.random() * totalTickets) + 1
      setSpinNumber(rnd)
      iterations++
      // Ir desacelerando
      if (iterations > 25) speed = 150
      if (iterations > 32) speed = 300
      if (iterations >= maxIterations) {
        clearInterval(spinInterval.current)
        executeDraw()
      }
    }, speed)
  }

  const executeDraw = async () => {
    setExecuting(true)
    try {
      const res = await fetch('/api/execute-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffleId: raffle.id })
      })
      const data = await res.json()
      if (data.success) {
        setSpinNumber(data.winnerTicket)
        setWinner({ ticket: data.winnerTicket, name: data.winnerName })
        setTimeout(() => setPhase('result'), 1000)
      } else {
        alert('Error: ' + data.error)
        setPhase('waiting')
      }
    } catch (e) {
      console.error(e)
      setPhase('waiting')
    }
    setExecuting(false)
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#fff', fontSize: 13 }}>⏳ Cargando...</div>
    </div>
  )

  if (!raffle) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <p>{t('Raffle not found', 'Rifa no encontrada')}</p>
        <Link href="/raffles" style={{ color: '#4ade80', textDecoration: 'none' }}>← {t('Back to raffles', 'Ver rifas')}</Link>
      </div>
    </div>
  )

  const coverImage = property?.images?.[0]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      <Navbar lang={lang} setLang={setLang} />

      {/* CSS animations */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin-number { 0%{transform:translateY(-10px);opacity:0} 50%{transform:translateY(0);opacity:1} 100%{transform:translateY(10px);opacity:0} }
        @keyframes winner-appear { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(74,222,128,0.3)} 50%{box-shadow:0 0 60px rgba(74,222,128,0.8)} }
        .confetti-piece { position:fixed; width:8px; height:8px; top:-10px; animation:confetti-fall 3s ease-in forwards; }
        .spin-digit { animation:spin-number 0.1s ease-in-out infinite; }
        .winner-card { animation:winner-appear 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .glow-effect { animation:glow 2s ease-in-out infinite; }
      `}</style>

      {/* Confetti cuando hay ganador */}
      {phase === 'result' && Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          background: ['#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'][i % 5],
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
        }} />
      ))}

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header de la rifa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {coverImage && (
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
              <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {t('Live draw', 'Sorteo en vivo')} · {formatDate(raffle.draw_date)}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#fff' }}>
              {property?.name || raffle.slug}
            </h1>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
              📍 {property?.city}, {property?.country}
            </div>
          </div>
          {/* Viewers en vivo */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '6px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FCA5A5' }}>
              {t('LIVE', 'EN VIVO')} · {Math.max(viewers, 1)} {t('watching', 'viendo')}
            </span>
          </div>
        </div>

        {/* ── FASE: WAITING ── */}
        {phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 52 }}>
              🎟
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>
              {raffle.status === 'completed'
                ? t('Draw completed', 'Sorteo completado')
                : t('Ready to draw', 'Listo para sortear')}
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              {raffle.status === 'completed'
                ? t('This raffle has already been drawn.', 'Este sorteo ya fue realizado.')
                : t('The raffle will start shortly. Stay tuned!', 'El sorteo comenzará en breve. ¡No te vayas!')}
            </p>

            {/* Info de la rifa */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 500, margin: '0 auto 40px' }}>
              {[
                { label: t('Total tickets', 'Total boletos'), val: raffle.total_tickets },
                { label: t('Sold', 'Vendidos'), val: raffle.tickets_sold || 0 },
                { label: t('Stay date', 'Fecha estancia'), val: formatDate(raffle.stay_date) },
              ].map(d => (
                <div key={d.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{d.val}</div>
                </div>
              ))}
            </div>

            {/* Botón solo para admin */}
            {isAdmin && raffle.status !== 'completed' && (
              <button onClick={startCountdown} style={{
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                border: 'none', borderRadius: 14, padding: '16px 48px',
                fontSize: 16, fontWeight: 800, color: '#0a0a0f',
                cursor: 'pointer', letterSpacing: '-0.01em',
                boxShadow: '0 8px 32px rgba(74,222,128,0.3)'
              }}>
                🎯 {t('Start draw now', 'Iniciar sorteo ahora')}
              </button>
            )}

            {!isAdmin && raffle.status !== 'completed' && (
              <div style={{ color: '#6B7280', fontSize: 13 }}>
                {t('Waiting for the draw to begin...', 'Esperando que comience el sorteo...')}
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s ease infinite', animationDelay: `${i * 0.3}s` }} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FASE: COUNTDOWN ── */}
        {phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 16, color: '#9CA3AF', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('Draw starts in', 'El sorteo comienza en')}
            </div>
            <div style={{
              fontSize: 120, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 32
            }}>
              {countdown}
            </div>
            <div style={{ color: '#6B7280', fontSize: 14 }}>
              {t('Get ready!', '¡Prepárate!')}
            </div>
          </div>
        )}

        {/* ── FASE: SPINNING ── */}
        {phase === 'spinning' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.1em', animation: 'pulse 0.5s ease infinite' }}>
              🎰 {t('Selecting winner...', 'Seleccionando ganador...')}
            </div>
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.05))',
              border: '3px solid rgba(74,222,128,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px',
              animation: 'glow 0.5s ease-in-out infinite',
            }}>
              <div style={{
                fontSize: 72, fontWeight: 900,
                background: 'linear-gradient(135deg, #4ade80, #fff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                minWidth: 100, textAlign: 'center',
              }} className="spin-digit">
                {spinNumber}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 0.4s ease infinite', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── FASE: RESULT ── */}
        {phase === 'result' && winner && (
          <div style={{ textAlign: 'center', padding: '32px 24px' }} className="winner-card">
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {t('We have a winner!', '¡Tenemos ganador!')}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px' }}>
              {t('Ticket', 'Boleto')} #{winner.ticket}
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 40 }}>
              {t('The lucky winner has been notified.', 'El afortunado ganador ha sido notificado.')}
            </p>

            {/* Ticket ganador visual */}
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #1A6B3C, #2E8B57)',
              borderRadius: 20, padding: '32px 48px', marginBottom: 40,
              boxShadow: '0 20px 60px rgba(26,107,60,0.4)',
              position: 'relative', overflow: 'hidden'
            }} className="glow-effect">
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                LuckyVaka · {t('Winner ticket', 'Boleto ganador')}
              </div>
              <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 8 }}>
                #{winner.ticket}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {property?.name || raffle.slug}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                📍 {property?.city}, {property?.country}
              </div>
            </div>

            {/* Info de la estancia ganada */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, maxWidth: 400, margin: '0 auto 40px' }}>
              {[
                { label: t('Stay date', 'Fecha estancia'), val: formatDate(raffle.stay_date) },
              ].map(d => (
                <div key={d.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{d.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/raffles" style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', textDecoration: 'none', padding: '12px 24px',
                borderRadius: 10, fontSize: 13, fontWeight: 600
              }}>
                {t('Browse more raffles', 'Ver más rifas')}
              </Link>
              {user && (
                <Link href="/dashboard?tab=won" style={{
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  color: '#0a0a0f', textDecoration: 'none', padding: '12px 24px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700
                }}>
                  {t('My won stays', 'Mis estancias ganadas')}
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
