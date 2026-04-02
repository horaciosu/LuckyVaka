import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { RAFFLES } from '../lib/data'

export default function DrawPage({ lang, setLang }) {
  const router = useRouter()
  const { raffle: raffleSlug } = router.query
  const raffle = RAFFLES.find(r => r.slug === raffleSlug) || RAFFLES[0]

  const WINNER = 203
  const [phase, setPhase] = useState('ready') // ready | spinning | winner
  const [display, setDisplay] = useState('—')
  const [viewers, setViewers] = useState(142)
  const [messages, setMessages] = useState([
    { user: 'Ana R.', text: 'Good luck everyone! 🤞', system: false },
    { user: 'Carlos M.', text: '¡Suerte a todos!', system: false },
    { user: 'Sarah T.', text: 'Come on #7!!', system: false },
    { user: 'System', text: 'Draw starting soon...', system: true },
  ])
  const [chatInput, setChatInput] = useState('')
  const [highlighted, setHighlighted] = useState(null)
  const [winnerNum, setWinnerNum] = useState(null)
  const [timestamp, setTimestamp] = useState('')
  const chatRef = useRef(null)

  // Random viewers count
  useEffect(() => {
    const id = setInterval(() => setViewers(v => Math.max(100, v + Math.floor(Math.random() * 7) - 3)), 3000)
    return () => clearInterval(id)
  }, [])

  // Scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const addMsg = (user, text, system = false) => {
    setMessages(m => [...m, { user, text, system }])
  }

  const startDraw = () => {
    if (phase !== 'ready') return
    setPhase('spinning')
    addMsg('System', '🎯 Draw started! Selecting winner...', true)

    let count = 0
    const maxCount = 60
    let current = null

    const spin = () => {
      const rand = Math.floor(Math.random() * raffle.total_tickets) + 1
      setDisplay(String(rand).padStart(3, '0'))
      setHighlighted(rand)
      if (current) setHighlighted(rand)
      current = rand
      count++

      const delay = count < maxCount * 0.6 ? 60 : count < maxCount * 0.8 ? 120 : 200
      if (count < maxCount) {
        setTimeout(spin, delay)
      } else {
        // Reveal winner
        setTimeout(() => {
          setDisplay(String(WINNER).padStart(3, '0'))
          setHighlighted(null)
          setWinnerNum(WINNER)
          setPhase('winner')
          setTimestamp(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
          addMsg('System', `🎉 Winner: Ticket #${WINNER} — Carlos M.! Congratulations!`, true)
          setTimeout(() => addMsg('Ana R.', 'Congrats Carlos!! 🎉🎉'), 800)
          setTimeout(() => addMsg('Sarah T.', 'Nooo #7 😂 congrats!!'), 1400)
          setTimeout(() => addMsg('Miguel S.', '¡Felicidades! 🏆'), 2000)
        }, 400)
      }
    }
    spin()
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    addMsg('You', chatInput)
    setChatInput('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>👁 {viewers} watching</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FCEBEB', color: '#A32D2D', fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 20 }}>
          <div className="live-dot" />
          LIVE DRAW
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* MAIN */}
        <div>
          {/* Property banner */}
          <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 64, height: 52, borderRadius: 8, background: raffle.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              {raffle.emoji}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{raffle.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>📍 {raffle.location} · Stay: {raffle.stay_date}</div>
              <div style={{ fontSize: 11, color: 'var(--brand)' }}>Prize: ${raffle.stay_value.toLocaleString()} · {raffle.total_tickets} tickets · 1 winner</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { val: raffle.total_tickets, label: 'Tickets sold' },
              { val: '100%', label: 'Sold out' },
              { val: viewers, label: 'Watching' },
              { val: 1, label: 'Winner' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Draw stage */}
          {phase !== 'winner' ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                {phase === 'ready' ? (lang === 'es' ? 'Listo para sortear' : 'Ready to draw') : (lang === 'es' ? 'Sorteando...' : 'Drawing...')}
              </div>
              <div className="drum-number" style={{ marginBottom: 12, color: phase === 'spinning' ? 'var(--brand)' : 'var(--text)' }}>
                {display}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
                {phase === 'ready'
                  ? (lang === 'es' ? 'Presiona el botón para iniciar el sorteo en vivo' : 'Press the button to start the live draw')
                  : (lang === 'es' ? 'Seleccionando número ganador aleatoriamente...' : 'Randomly selecting winner from ticket pool...')
                }
              </div>
              {phase === 'ready' && (
                <button onClick={startDraw} className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
                  🎯 {lang === 'es' ? 'Iniciar sorteo' : 'Start draw'}
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: 16, border: '1.5px solid var(--brand)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                {lang === 'es' ? '¡Tenemos un ganador!' : 'We have a winner!'}
              </div>
              <div style={{
                width: 72, height: 72, borderRadius: 12,
                background: 'var(--brand)', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '16px auto',
              }}>
                {String(winnerNum).padStart(3, '0')}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Carlos M. — Hermosillo, Sonora</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>3 tickets purchased · Won with ticket #{winnerNum}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" style={{ fontSize: 12 }}>📧 Notify winner</button>
                <button className="btn-secondary" style={{ fontSize: 12 }}>🔐 Verify draw</button>
                <button className="btn-secondary" style={{ fontSize: 12 }}>📤 Share result</button>
              </div>
            </div>
          )}

          {/* Verification */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>🔐 {lang === 'es' ? 'Verificación del sorteo' : 'Draw verification'}</div>
            {[
              ['Draw method', phase === 'winner' ? 'Cryptographic RNG + seed hash' : 'Pending draw'],
              ['Seed hash (pre-draw)', 'a3f7c2e1d8b94f2e...'],
              ['Timestamp', phase === 'winner' ? timestamp : 'Waiting...'],
              ['Winning ticket', phase === 'winner' ? `#${winnerNum} — verified ✓` : '—'],
              ['Status', phase === 'winner' ? '✓ Verified & immutable' : 'Awaiting draw'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: phase === 'winner' && k !== 'Seed hash (pre-draw)' ? 'var(--brand)' : 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Ticket pool */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              {lang === 'es' ? 'Todos los boletos vendidos' : 'All sold tickets — ticket pool'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
              {Array.from({ length: raffle.total_tickets }, (_, i) => i + 1).map(n => (
                <div key={n} style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: winnerNum === n ? 'var(--brand)' : highlighted === n ? '#FAEEDA' : '#F4F3EF',
                  color: winnerNum === n ? '#fff' : highlighted === n ? '#633806' : 'var(--muted)',
                  fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${winnerNum === n ? 'var(--brand)' : highlighted === n ? '#EF9F27' : 'var(--border)'}`,
                  transition: 'all 0.1s',
                  fontWeight: winnerNum === n ? 600 : 400,
                }}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Participants */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>🎟 Participants</div>
            <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
              <div>Carlos M. · #47, #112, #203</div>
              <div>Ana R. · #15, #88, #166, #244, #299</div>
              <div>Sarah T. · #7</div>
              <div>Miguel S. · #33, #34, #35</div>
              <div>Luisa P. · #100, #200</div>
              <div>John D. · #250–#253</div>
              <div>Fernanda G. · #77, #78</div>
              <div>Roberto K. · #1–#5</div>
              <div style={{ color: 'var(--subtle)' }}>...and 127 more</div>
            </div>
          </div>

          {/* Chat */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>💬 Live chat</div>
            <div ref={chatRef} style={{ height: 200, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: m.system ? 'var(--brand)' : 'var(--muted)', fontStyle: m.system ? 'italic' : 'normal' }}>
                  {!m.system && <strong style={{ color: 'var(--text)' }}>{m.user}: </strong>}
                  {m.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Say something..."
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
              />
              <button onClick={sendChat} className="btn-primary" style={{ padding: '6px 10px', fontSize: 11 }}>→</button>
            </div>
          </div>

          {/* Your tickets */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Your tickets</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {[47, 112, 203].map(n => (
                <div key={n} style={{
                  width: 30, height: 30, borderRadius: 5,
                  background: winnerNum === n ? 'var(--brand)' : '#E6F1FB',
                  color: winnerNum === n ? '#fff' : '#185FA5',
                  fontSize: 11, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{n}</div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>3 of {raffle.total_tickets} · 1% chance</div>
          </div>
        </div>
      </div>
    </div>
  )
}
