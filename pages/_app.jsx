import { useState } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const [lang, setLang] = useState('en')

  return <Component {...pageProps} lang={lang} setLang={setLang} />
}
