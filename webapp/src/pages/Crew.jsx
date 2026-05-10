import React from 'react'

const members = [
  {first:'Tanav', last:'Kambhampati', role:'Co-President', img:'/images/team-headshots/tanav.png'},
  {first:'Cadence', last:'(Cadence?)', role:'Co-President', img:'/images/team-headshots/cadence.png'},
  {first:'Trevor', last:'Huang', role:'Member', img:'/images/team-headshots/trevor.png'},
  {first:'Hithin', last:'Pulamarasetty', role:'Member', img:'/images/team-headshots/hithin.png'},
  {first:'Pranav', last:'Santhosh', role:'Member', img:'/images/team-headshots/pranav.png'},
  {first:'Tanay', last:'Paranjpe', role:'Member', img:'/images/team-headshots/tanay.png'},
  {first:'Aarav', last:'Lohiya', role:'Member', img:'/images/team-headshots/aaravl.png'},
  {first:'Aarav', last:'Wadhwani', role:'Member', img:'/images/team-headshots/aaravw.png'},
  {first:'Jason', last:'Wang', role:'Member', img:'/images/team-headshots/jason.png'},
  {first:'Aditya', last:'Desai', role:'Member', img:'/images/team-headshots/aditya.png'}
]

export default function Crew(){
  return (
    <div className="max-w-6xl mx-auto py-24">
      <div className="section-copy">
        <p className="eyebrow">Engineering Crew</p>
        <h1 className="uppercase font-black text-4xl">The people behind the flight.</h1>
        <p className="mt-4 text-slate-300">A student team split by subsystem so every rocket gets design depth and real test ownership.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
        {members.map((m, i)=> (
          <article key={i} className="relative overflow-hidden min-h-[320px] flex items-end p-5 bg-white/5 rounded-lg">
            <img src={m.img} alt={m.first+' '+m.last} className="absolute inset-0 w-full h-full object-cover"/>
            <div className="relative z-10">
              <p className="text-xs font-mono text-slate-300 uppercase">{m.role}</p>
              <h2 className="text-2xl font-black leading-tight">{m.first} {m.last}</h2>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
