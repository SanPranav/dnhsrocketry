import React, {useEffect, useRef, useState} from 'react'

const base = [
  { image: '/images/team-1.png', title: 'Workshop', caption: 'Behind the bench.' },
  { image: '/images/team-2.png', title: 'Build Table', caption: 'Parts and tools.' },
  { image: '/images/team-3.png', title: 'Range Day', caption: 'Launch prep.' }
]

export default function Gallery(){
  const [items, setItems] = useState([])
  const indexRef = useRef(0)
  useEffect(()=>{
    // initial batch
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
