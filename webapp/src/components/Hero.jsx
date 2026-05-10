import React from 'react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=8b3d0de6c7f6b8b6f3b1e0c0b4b2f7f6')] bg-cover bg-center mix-blend-screen opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/90"></div>
      <div className="relative max-w-6xl mx-auto p-8">
        <p className="eyebrow font-mono tracking-widest text-orange-300">DNHS Rocketry Club</p>
        <h1 className="text-5xl md:text-7xl font-extrabold uppercase">Taking flight.</h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl">We build rockets the hard way: sketch, simulate, prototype, test, and iterate until the data agrees.</p>
        <div className="mt-8 flex gap-4">
          <a className="bg-white text-black px-6 py-3 rounded-full uppercase text-xs font-semibold" href="/projects.html">View Projects</a>
          <a className="border border-white/30 px-6 py-3 rounded-full uppercase text-xs" href="/newsroom.html">Team Updates</a>
        </div>
      </div>
    </section>
  )
}
