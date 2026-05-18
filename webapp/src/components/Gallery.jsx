import React, {useEffect, useRef, useState} from 'react'

const base = [
  { image: '/images/teamphotos/Screenshot 2026-05-09 at 9.39.50\u202fPM.png', title: 'Team Portrait', caption: 'The crew together before the next round.' },
  { image: '/images/teamphotos/Screenshot 2026-05-10 at 3.26.25\u202fPM.png', title: 'Build Session', caption: 'Hands-on planning around the next build pass.' },
  { image: '/images/teamphotos/Screenshot 2026-05-10 at 3.27.07\u202fPM.png', title: 'Field Crew', caption: 'The team gathered around the rocket and gear.' },
  { image: '/images/teamphotos/Screenshot 2026-05-10 at 3.27.17\u202fPM.png', title: 'Launch Prep', caption: 'Getting everything ready before the next flight window.' },
  { image: '/images/teamphotos/Screenshot 2026-05-10 at 3.27.28\u202fPM.png', title: 'Final Check', caption: 'One last look at the setup before heading out.' }
]

export default function Gallery(){
  const [items, setItems] = useState([])
  const indexRef = useRef(0)
  useEffect(()=>{
    appendBatch()
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) appendBatch() })
    }, { rootMargin: '600px 0px' })
    const sentinel = document.querySelector('#gallery-sentinel')
    if(sentinel) observer.observe(sentinel)
    return ()=> observer.disconnect()
  }, [])

  function appendBatch(){
    const next = new Array(6).fill(0).map((_,i)=>{
      const idx = (indexRef.current + i) % base.length
      return { ...base[idx], title: `${base[idx].title} ${Math.floor((indexRef.current + i) / base.length) + 1}` }
    })
    indexRef.current += next.length
    setItems((s)=>[...s, ...next])
  }

  return (
    <div className="gallery-feed grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((it, i)=> (
        <article key={i} className="bg-white/5 rounded-lg overflow-hidden">
          <figure>
            <img src={it.image} alt={it.title} className="w-full h-56 object-cover" />
            <figcaption className="p-4">
              <strong className="block text-white uppercase">{it.title}</strong>
              <span className="text-sm text-slate-300">{it.caption}</span>
            </figcaption>
          </figure>
        </article>
      ))}
      <div id="gallery-sentinel" className="col-span-full h-6" />
    </div>
  )
}
