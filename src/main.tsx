import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import logoWhite from './assets/newave/logo.png'

const setFavicon = (url: string, type = 'image/png') => {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = type
  link.href = url
}
setFavicon(logoWhite);

createRoot(document.getElementById("root")!).render(<App />);
