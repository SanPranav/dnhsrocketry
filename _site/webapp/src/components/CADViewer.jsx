import React, {useEffect, useRef} from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

export default function CADViewer(){
  const mountRef = useRef(null)
  const autoRotateRef = useRef(true)
  const modelRef = useRef(null)
  useEffect(()=>{
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020203)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000)
    camera.position.set(0, 0.6, 2.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    container.appendChild(renderer.domElement)

    const hemi = new THREE.HemisphereLight(0xffffff, 0x080820, 0.9)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 10, 7)
    scene.add(dir)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 0.6
    controls.maxDistance = 6

    const loaderObj = new OBJLoader()
    const loaderStl = new STLLoader()
    const modelUrl = '/assets/models/Assembly_1.obj'
    let model = null
    function addModel(obj){
      // normalize: ensure it's a Group
      const group = obj.type === 'Group' || obj.type === 'Object3D' ? obj : new THREE.Group().add(obj)
      // center and scale
      const box = new THREE.Box3().setFromObject(group)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 1.0 / (maxDim || 1) * 1.2
      group.scale.setScalar(scale)
      const center = new THREE.Vector3()
      box.getCenter(center)
      group.position.copy(center).multiplyScalar(-1)
      // apply material to meshes if needed
      group.traverse((n)=>{
        if(n.isMesh){
          n.material = new THREE.MeshStandardMaterial({ color: 0x8fc7ff, metalness: 0.12, roughness: 0.45 })
        }
      })
      scene.add(group)
      modelRef.current = group
    }

    loaderObj.load(modelUrl, (obj) => addModel(obj), undefined, (err) => {
      console.warn('OBJ load error', err)
      // try STL fallback
      loaderStl.load('/assets/models/Assembly_1.stl', (geom) => {
        const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x8fc7ff }))
        addModel(mesh)
      }, undefined, ()=>{/* ignore */})
    })

    function onResize(){
      if(!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('resize', onResize)

    let raf = null
    function animate(){
      controls.update()
      if(autoRotateRef.current && modelRef.current){
        modelRef.current.rotation.y += 0.004
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return ()=>{
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      if (container && renderer.domElement) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <div className="p-6">
        <p className="eyebrow font-mono uppercase text-sm">Rendered CAD Model</p>
        <h2 className="text-2xl font-black uppercase">Live model preview</h2>
        <p className="text-slate-300 mt-2">Interactive OBJ/STL preview (client-side). Use orbit to rotate and zoom.</p>
        <div className="mt-3 flex gap-3">
          <label className="flex items-center gap-2"><input id="auto-rotate" type="checkbox" defaultChecked onChange={(e)=>{autoRotateRef.current = e.target.checked}}/> Auto-rotate</label>
          <button className="border px-3 py-1 rounded" onClick={()=>{
            if(modelRef.current) modelRef.current.rotation.set(0,0,0)
          }}>Reset</button>
          <button className="border px-3 py-1 rounded" onClick={()=>{
            if(!modelRef.current) return
            modelRef.current.traverse(n=>{ if(n.isMesh){ n.material.wireframe = !n.material.wireframe } })
          }}>Toggle Wireframe</button>
          <label className="border px-3 py-1 rounded cursor-pointer">
            Load file
            <input type="file" accept=".obj,.stl" style={{display:'none'}} onChange={(e)=>{
              const file = e.target.files && e.target.files[0];
              if(!file) return;
              const reader = new FileReader();
              reader.onload = (ev)=>{
                const data = ev.target.result;
                const name = file.name.toLowerCase();
                // remove previous model
                if(modelRef.current){ scene.remove(modelRef.current); modelRef.current = null }
                if(name.endsWith('.obj')){
                  try{ const text = new TextDecoder().decode(data); const obj = loaderObj.parse(text); addModel(obj); }catch(err){ console.warn(err) }
                } else if(name.endsWith('.stl')){
                  try{ const geom = loaderStl.parse(data); const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color:0x8fc7ff})); addModel(mesh);}catch(err){ console.warn(err) }
                }
              }
              if(file.name.toLowerCase().endsWith('.obj')) reader.readAsArrayBuffer(file); else reader.readAsArrayBuffer(file);
            }}/>
          </label>
        </div>
      </div>
      <div ref={mountRef} style={{height: '520px'}} className="w-full bg-black" />
    </div>
  )
}
