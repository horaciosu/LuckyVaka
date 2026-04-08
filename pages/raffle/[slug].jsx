import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import PropertyMap from '../../components/PropertyMap'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

const AMENITY_ICONS = { wifi:'📶',ac:'❄️',pool:'🏊',parking:'🚗',kitchen:'🍳',washer:'👕',tv:'📺',ocean:'🌊',beach:'🏖',bbq:'🔥',jacuzzi:'♨️',gym:'💪',security:'🔒',pets:'🐾',balcony:'🌅',garden:'🌿' }
const AMENITY_LABELS_ES = { wifi:'Wi-Fi',ac:'A/C',pool:'Alberca',parking:'Estacionamiento',kitchen:'Cocina equipada',washer:'Lavadora',tv:'Smart TV',ocean:'Vista al mar',beach:'Acceso playa',bbq:'Asador',jacuzzi:'Jacuzzi',gym:'Gimnasio',security:'Seguridad',pets:'Mascotas OK',balcony:'Balcón',garden:'Jardín' }
const AMENITY_LABELS_EN = { wifi:'Wi-Fi',ac:'A/C',pool:'Pool',parking:'Parking',kitchen:'Full kitchen',washer:'Washer',tv:'Smart TV',ocean:'Ocean view',beach:'Beach access',bbq:'BBQ',jacuzzi:'Jacuzzi',gym:'Gym',security:'Security',pets:'Pet friendly',balcony:'Balcony',garden:'Garden' }

function PhotoModal({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  useEffect(() => {
    const h = (e) => { if(e.key==='Escape')onClose(); if(e.key==='ArrowRight')setCurrent(c=>Math.min(images.length-1,c+1)); if(e.key==='ArrowLeft')setCurrent(c=>Math.max(0,c-1)) }
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)
  },[images.length,onClose])
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.93)',zIndex:1000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{position:'absolute',top:20,right:24,display:'flex',gap:12,alignItems:'center'}}>
        <span style={{color:'#fff',fontSize:13,opacity:0.7}}>{current+1} / {images.length}</span>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:36,height:36,borderRadius:'50%',cursor:'pointer',fontSize:18}}>✕</button>
      </div>
      <div style={{position:'relative',maxWidth:'90vw',maxHeight:'80vh'}} onClick={e=>e.stopPropagation()}>
        <img src={images[current]} alt="" style={{maxWidth:'90vw',maxHeight:'80vh',objectFit:'contain',borderRadius:8}}/>
        {current>0&&<button onClick={()=>setCurrent(c=>c-1)} style={{position:'absolute',left:-52,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:40,height:40,borderRadius:'50%',cursor:'pointer',fontSize:20}}>‹</button>}
        {current<images.length-1&&<button onClick={()=>setCurrent(c=>c+1)} style={{position:'absolute',right:-52,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:40,height:40,borderRadius:'50%',cursor:'pointer',fontSize:20}}>›</button>}
      </div>
      <div style={{display:'flex',gap:6,marginTop:16,overflowX:'auto',maxWidth:'90vw',padding:'4px 0'}} onClick={e=>e.stopPropagation()}>
        {images.map((img,i)=><img key={i} src={img} onClick={()=>setCurrent(i)} style={{width:56,height:44,objectFit:'cover',borderRadius:4,cursor:'pointer',flexShrink:0,opacity:i===current?1:0.45,border:i===current?'2px solid #fff':'2px solid transparent'}}/>)}
      </div>
    </div>
  )
}

function PropertyGallery({ images, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStart, setModalStart] = useState(0)
  const open = (i) => { setModalStart(i); setModalOpen(true) }
  if (!images.length) return <div style={{height:400,borderRadius:16,background:'#F4F3EF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:64,marginBottom:24}}>🏡</div>
  const thumbs = images.slice(1,5)
  return (
    <>
      {modalOpen&&<PhotoModal images={images} startIndex={modalStart} onClose={()=>setModalOpen(false)}/>}
      <div style={{position:'relative',marginBottom:24}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'200px 200px',gap:4,borderRadius:16,overflow:'hidden'}}>
          <div style={{gridRow:'1/3',cursor:'pointer',overflow:'hidden'}} onClick={()=>open(0)}>
            <img src={images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.2s'}} onMouseEnter={e=>e.target.style.transform='scale(1.03)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
          </div>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{cursor:'pointer',overflow:'hidden',position:'relative'}} onClick={()=>open(i+1)}>
              {thumbs[i]?<img src={thumbs[i]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.2s'}} onMouseEnter={e=>e.target.style.transform='scale(1.04)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>:<div style={{width:'100%',height:'100%',background:'#ede8e0'}}/>}
              {i===3&&images.length>5&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:4}}><span style={{color:'#fff',fontSize:22,fontWeight:700}}>+{images.length-5}</span><span style={{color:'#fff',fontSize:11,opacity:0.8}}>{t('photos','fotos')}</span></div>}
            </div>
          ))}
        </div>
        <button onClick={()=>open(0)} style={{position:'absolute',bottom:12,right:12,background:'rgba(255,255,255,0.95)',border:'1px solid rgba(0,0,0,0.15)',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',color:'#1a1a1a',backdropFilter:'blur(4px)',boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
          ⊞ {t('See all photos','Ver todas las fotos')} ({images.length})
        </button>
      </div>
    </>
  )
}

export default function RafflePage({ lang, setLang }) {
  const router = useRouter()
  const { slug } = router.query
  const [raffle, setRaffle] = useState(null)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [countdown, setCountdown] = useState({d:0,h:0,m:0,s:0})
  const { user } = useAuth()
  const t = (en,es) => lang==='es'?es:en
  useEffect(()=>{ if(!slug)return; loadRaffle() },[slug])
  const loadRaffle = async () => {
    setLoading(true)
    const {data,error} = await supabase.from('raffles').select('*, properties(*)').eq('slug',slug).single()
    if(error||!data){setNotFound(true);setLoading(false);return}
    setRaffle(data);setProperty(data.properties);setLoading(false)
  }
  useEffect(()=>{
    if(!raffle?.draw_date)return
    const target=new Date(raffle.draw_date+'T20:00:00')
    const tick=()=>{const diff=target-new Date();if(diff<=0){setCountdown({d:0,h:0,m:0,s:0});return};setCountdown({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)})}
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[raffle?.draw_date])
  const taken = new Set(raffle?.sold_tickets || [])
  const toggleNum=(n)=>{if(taken.has(n))return;const next=new Set(selected);if(next.has(n)){next.delete(n)}else{if(next.size>=qty){const first=[...next][0];next.delete(first)};next.add(n)};setSelected(next)}
  const pickRandom=()=>{if(!raffle)return;const avail=[];for(let i=1;i<=raffle.total_tickets;i++){if(!taken.has(i))avail.push(i)};avail.sort(()=>Math.random()-0.5);setSelected(new Set(avail.slice(0,qty)))}
  const pad=n=>String(n).padStart(2,'0')
  const formatDate=(d)=>{if(!d)return'—';return new Date(d+'T12:00:00').toLocaleDateString(lang==='es'?'es-MX':'en-US',{day:'numeric',month:'long',year:'numeric'})}
  if(loading)return(<div style={{minHeight:'100vh',background:'var(--bg)'}}><Navbar lang={lang} setLang={setLang}/><div style={{textAlign:'center',padding:'80px 0',fontSize:13,color:'var(--muted)'}}>⏳ {t('Loading raffle...','Cargando rifa...')}</div></div>)
  if(notFound)return(<div style={{minHeight:'100vh',background:'var(--bg)'}}><Navbar lang={lang} setLang={setLang}/><div style={{textAlign:'center',padding:'80px 24px'}}><div style={{fontSize:48,marginBottom:16}}>😕</div><h1 style={{fontFamily:'var(--font-display)',fontSize:22,color:'var(--text)',marginBottom:16}}>{t('Raffle not found','Rifa no encontrada')}</h1><Link href="/raffles" className="btn-primary">{t('Browse all raffles','Ver todas las rifas')}</Link></div></div>)
  const ticketsSold=raffle.tickets_sold||0
  const pct=Math.round((ticketsSold/raffle.total_tickets)*100)
  const remaining=raffle.total_tickets-ticketsSold
  const fee=+(qty*raffle.ticket_price*0.1).toFixed(2)
  const cleaningFee=raffle.cleaning_fee||0
  const subtotal=+(qty*raffle.ticket_price).toFixed(2)
  const total=+(subtotal+fee).toFixed(2)
  const images=property?.images||[]
  const amenities=property?.amenities||[]
  const amenityLabels=lang==='es'?AMENITY_LABELS_ES:AMENITY_LABELS_EN
  const prize=(raffle.ticket_price*raffle.total_tickets*0.77).toFixed(0)

  // Detectar si el sorteo es inminente (menos de 24 horas) o ya pasó
  const drawDateTime = raffle?.draw_date ? new Date(raffle.draw_date + 'T20:00:00') : null
  const now = new Date()
  const hoursUntilDraw = drawDateTime ? (drawDateTime - now) / 3600000 : null
  const isDrawSoon = hoursUntilDraw !== null && hoursUntilDraw <= 24 && hoursUntilDraw > 0
  const isDrawToday = hoursUntilDraw !== null && hoursUntilDraw <= 2 && hoursUntilDraw > 0
  const isCompleted = raffle?.status === 'completed'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar lang={lang} setLang={setLang}/>
      <style>{`.rp-grid{display:grid;grid-template-columns:1fr 340px;gap:32px;align-items:start}.rp-panel{position:sticky;top:80px}@media(max-width:900px){.rp-grid{grid-template-columns:1fr}.rp-panel{position:static}}`}</style>
      <div style={{maxWidth:1080,margin:'0 auto',padding:'20px 24px 48px'}}>
        <Link href="/raffles" style={{fontSize:13,color:'var(--muted)',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4,marginBottom:16}}>← {t('Back','Regresar')}</Link>
        <div style={{marginBottom:16}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:700,color:'var(--text)',margin:'0 0 6px'}}>{property?.name||slug}</h1>
          <div style={{display:'flex',gap:16,fontSize:13,color:'var(--muted)',flexWrap:'wrap'}}>
            <span>📍 {property?.city}{property?.state?`, ${property.state}`:''}, {property?.country}</span>
            {property?.beds&&<span>🛏 {property.beds} {t('bed','hab')}</span>}
            {property?.baths&&<span>🚿 {property.baths} {t('bath','baño')}</span>}
            {property?.guests&&<span>👥 {t('up to','hasta')} {property.guests} {t('guests','huéspedes')}</span>}
          </div>
        </div>

        {/* Banner sorteo en vivo / próximo */}
        {(isDrawSoon || isCompleted) && (
          <div style={{
            background: isCompleted ? 'linear-gradient(135deg, #1A6B3C, #2E8B57)' : isDrawToday ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'linear-gradient(135deg, #D97706, #F59E0B)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
          }}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#fff',opacity:isDrawToday||isCompleted?1:0.7,animation:isDrawToday?'pulse 1s ease infinite':undefined}} />
              <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>
                {isCompleted ? (lang==='es'?'🏆 ¡Ya tenemos ganador! Ver resultado':'🏆 We have a winner! See result') :
                 isDrawToday ? (lang==='es'?'🔴 ¡El sorteo es HOY! Entra a verlo en vivo':'🔴 Draw is TODAY! Watch it live') :
                 (lang==='es'?'⏰ Sorteo en menos de 24 horas':'⏰ Draw in less than 24 hours')}
              </span>
            </div>
            <a href={'/draw/' + slug} style={{
              background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)',
              color:'#fff', textDecoration:'none', padding:'7px 16px',
              borderRadius:8, fontSize:12, fontWeight:700, flexShrink:0
            }}>
              {isCompleted ? (lang==='es'?'Ver ganador →':'See winner →') : (lang==='es'?'Ver en vivo →':'Watch live →')}
            </a>
          </div>
        )}
        <PropertyGallery images={images} t={t}/>
        <div className="rp-grid">
          <div>
            <div style={{display:'flex',gap:12,fontSize:13,color:'var(--muted)',marginBottom:20,flexWrap:'wrap'}}>
              {property?.checkin_time&&<span>🕒 Check-in {property.checkin_time.replace(' hrs','')}</span>}
              {property?.checkout_time&&<span>🕙 Check-out {property.checkout_time.replace(' hrs','')}</span>}
            </div>
            {amenities.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>{amenities.map(a=><span key={a} style={{fontSize:11,background:'#F4F3EF',color:'var(--muted)',padding:'4px 10px',borderRadius:20,border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:4}}>{AMENITY_ICONS[a]||'✓'} {amenityLabels[a]||a}</span>)}</div>}
            <div className="card" style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:8}}>{t('About this stay','Sobre la estancia')}</div><p style={{fontSize:13,color:'var(--muted)',lineHeight:1.7,margin:0}}>{lang==='es'?(property?.description_es||'—'):(property?.description_en||property?.description_es||'—')}</p></div>
            <div className="card" style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:12}}>🗓 {t('Stay details','Detalles de la estancia')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[["🟢",t("Check-in","Entrada"),formatDate(raffle.stay_date)],["🔴",t("Check-out","Salida"),formatDate(raffle.checkout_date)],["🎯",t("Draw date","Fecha del sorteo"),formatDate(raffle.draw_date)]].map(([icon,label,val])=>(<div key={label} style={{background:"var(--bg)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>{icon} {label}</div><div style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{val}</div></div>))}
              </div>
            </div>
            {property?.house_rules&&<div className="card" style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:8}}>📋 {t('House rules','Reglas de la casa')}</div><p style={{fontSize:13,color:'var(--muted)',lineHeight:1.7,margin:0}}>{property.house_rules}</p></div>}
            <div className="card"><div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:12}}>📍 {t('Location & nearby','Ubicación y alrededores')}</div><PropertyMap location={`${property?.city||''}, ${property?.country||''}`} lang={lang} apiKey="AIzaSyCI5qOJqVrvT1HEhaaQ4vcUi5Lb01uOf70"/></div>
          </div>
          <div className="rp-panel">
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
              <div style={{textAlign:'center',marginBottom:16,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>{t('Draw in','Sorteo en')}</div>
                <div style={{display:'flex',justifyContent:'center',gap:8}}>
                  {[[countdown.d,t('days','días')],[countdown.h,'hrs'],[countdown.m,'min'],[countdown.s,'seg']].map(([val,label],i)=><div key={i} style={{textAlign:'center',background:'var(--bg)',borderRadius:8,padding:'8px 10px',minWidth:44}}><div className="countdown-digit" style={{fontSize:22}}>{pad(val)}</div><div style={{fontSize:9,color:'var(--muted)',marginTop:2}}>{label}</div></div>)}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span style={{fontWeight:600,color:'var(--text)'}}>{ticketsSold} {t('sold','vendidos')}</span><span style={{color:'var(--muted)'}}>{raffle.total_tickets} total</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
                <div style={{fontSize:10,color:'var(--muted)',marginTop:4}}>{pct}% {t('sold','vendido')} · {remaining} {t('remaining','restantes')}</div>
              </div>
              <div style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:6}}><span style={{fontSize:26,fontWeight:700,color:'var(--text)'}}>{raffle.ticket_price}</span><span style={{fontSize:14,color:'var(--muted)'}}>{raffle.currency}</span><span style={{fontSize:11,color:'var(--muted)'}}>{t('/ ticket','/ boleto')}</span></div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:'var(--muted)',marginBottom:8,fontWeight:500}}>{t('How many tickets?','¿Cuántos boletos?')}</div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'transparent',fontSize:18,cursor:'pointer',color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:18,fontWeight:700,minWidth:28,textAlign:'center'}}>{qty}</span>
                  <button onClick={()=>setQty(q=>Math.min(20,q+1))} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'transparent',fontSize:18,cursor:'pointer',color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{[1,3,5,10,20].map(n=><button key={n} onClick={()=>setQty(n)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,cursor:'pointer',border:'1px solid var(--border)',background:qty===n?'var(--brand)':'transparent',color:qty===n?'#fff':'var(--muted)',fontWeight:qty===n?600:400}}>×{n}</button>)}</div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:'var(--muted)',marginBottom:8,display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:500}}>{t('Pick your numbers','Elige tus números')}</span><span style={{color:'var(--brand)',fontSize:11,fontWeight:600}}>{selected.size}/{qty}</span></div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,maxHeight:110,overflowY:'auto'}}>
                  {Array.from({length:raffle.total_tickets},(_,i)=>i+1).map(n=><button key={n} onClick={()=>toggleNum(n)} className={`ticket-chip ${taken.has(n)?'taken':''} ${selected.has(n)?'selected':''}`}>{n}</button>)}
                </div>
              </div>
              <div style={{background:'var(--bg)',borderRadius:10,padding:'12px',marginBottom:14,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between',color:'var(--muted)',marginBottom:4}}><span>{qty} × {raffle.ticket_price} {raffle.currency}</span><span>{subtotal.toFixed(2)}</span></div>
                
                <div style={{display:'flex',justifyContent:'space-between',color:'var(--muted)',marginBottom:8}}><span>{t('Fee (10%)','Comisión (10%)')}</span><span>{fee}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:700,color:'var(--text)',borderTop:'1px solid var(--border)',paddingTop:8}}><span>Total</span><span>{total} {raffle.currency}</span></div>
              </div>
              <button onClick={pickRandom} style={{width:'100%',background:'transparent',border:'1px solid var(--border)',borderRadius:10,padding:'9px',fontSize:12,cursor:'pointer',color:'var(--muted)',marginBottom:10}}>🍀 {t('Pick for me','Elige por mí')}</button>
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = '/login?next=' + encodeURIComponent('/checkout?raffle=' + raffle.slug + '&qty=' + qty + '&tickets=' + [...selected].join(','))
                  } else {
                    window.location.href = '/checkout?raffle=' + raffle.slug + '&qty=' + qty + '&tickets=' + [...selected].join(',')
                  }
                }}
                className="btn-primary"
                style={{width:'100%',justifyContent:'center',marginBottom:8,fontSize:14,fontWeight:600,borderRadius:10,padding:'12px'}}
              >
                {lang==='es' ? `Comprar — ${total} ${raffle.currency}` : `Buy tickets — ${total} ${raffle.currency}`}
              </button>
              <div style={{fontSize:10,color:'var(--muted)',textAlign:'center',lineHeight:1.6}}>✓ {t('Guaranteed winner · Full refund if not funded','Ganador garantizado · Reembolso si no se activa')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
