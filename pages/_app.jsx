import { useState } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const [lang, setLang] = useState('es')

  return <Component {...pageProps} lang={lang} setLang={setLang} />
}
