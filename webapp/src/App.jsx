import React from 'react'
import Hero from './components/Hero'
import Gallery from './components/Gallery'
import CADViewer from './components/CADViewer'
import Projects from './pages/Projects'
import Crew from './pages/Crew'
import Newsroom from './pages/Newsroom'
import Contact from './pages/Contact'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
    <div className="min-h-screen bg-black text-white">
      <header className="fixed w-full z-30">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between uppercase text-sm">
          <div className="flex items-center gap-4">
            <img src="/images/logo.png" alt="logo" className="w-12 h-12 object-contain" />
            <span className="font-black text-lg">DNHS Rocketry Club</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link to="/">Home</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/crew">Crew</Link>
            <Link to="/newsroom">Newsroom</Link>
            <Link to="/contact" className="bg-white text-black px-4 py-2 rounded-full">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="pt-28">
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <section className="max-w-6xl mx-auto py-24"><Gallery /></section>
              <section className="max-w-6xl mx-auto py-24"><CADViewer /></section>
            </>
          } />
          <Route path="/projects" element={<Projects/>} />
          <Route path="/crew" element={<Crew/>} />
          <Route path="/newsroom" element={<Newsroom/>} />
          <Route path="/contact" element={<Contact/>} />
        </Routes>
      </main>
    </div>
    </BrowserRouter>
  )
}
