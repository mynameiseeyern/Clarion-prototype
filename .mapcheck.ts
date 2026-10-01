import { geoMercator, geoPath } from "d3-geo"
import { feature, mesh } from "topojson-client"
declare const TOPO: any
const w=1400,h=300
const p=geoMercator().scale(w/(2*Math.PI)).translate([w/2,0])
const yT=p([0,78])![1], yB=p([0,-56])![1]; p.translate([w/2,h/2-(yT+yB)/2])
const geoms={...TOPO.objects.countries,geometries:TOPO.objects.countries.geometries.filter((g:any)=>String(g.id)!=="010")}
const path=geoPath(p)
const land=path(feature(TOPO,geoms) as any), borders=path(mesh(TOPO,geoms,(a:any,b:any)=>a!==b))
const pins=[[54,-2.5],[1.35,103.8],[-25.5,134]].map(([la,ln])=>p([ln,la])!)
function svg(k:number,cx:number,cy:number){const tx=w/2-k*cx,ty=h/2-k*cy
 return `<svg width="${w}" height="${h}" style="background:#b8d5e6;border-radius:6px;display:block;margin:12px"><g transform="translate(${tx},${ty}) scale(${k})"><path d="${land}" fill="#f7f4ef" stroke="#c6ccd4" stroke-width="0.6" vector-effect="non-scaling-stroke"/><path d="${borders}" fill="none" stroke="#c6ccd4" stroke-width="0.8" vector-effect="non-scaling-stroke"/></g>
 ${pins.map(([x,y],i)=>`<g transform="translate(${tx+k*x},${ty+k*y})"><rect x="-22" y="-12" width="44" height="24" rx="12" fill="#fff" stroke="#D92D20" stroke-width="2"/><circle cx="-10" cy="0" r="4" fill="#D92D20"/><text x="4" y="4" font-size="12" font-weight="600" text-anchor="middle" font-family="monospace">${[12,11,9][i]}</text></g>`).join("")}</svg>`}
const au=p([134,-25.5])!
document.body.innerHTML=`<div style="font-family:sans-serif">${svg(1,w/2,h/2)}${svg(5,au[0],au[1]+10)}</div>`
