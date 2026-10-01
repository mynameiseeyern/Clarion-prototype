import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Home, Plus, Minus } from "lucide-react"
import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

/* Offline geographic basemap: Natural Earth 1:50m country polygons (public domain),
   bundled in /public and drawn as a Leaflet vector layer — no tile server, no API key.
   Pins are rendered by the caller as React nodes: we hand back a `project`
   function and re-render on every pan/zoom so they track the map. */

export interface GeoPoint { lat: number; lng: number }

const WORLD_URL = `${import.meta.env.BASE_URL}world-countries-50m.json`
const ATTRIBUTION = '<a href="https://www.naturalearthdata.com/">Natural Earth</a>'
const OCEAN = "#b8d5e6"
const LAND_STYLE: L.PathOptions = { fillColor: "#f7f4ef", fillOpacity: 1, color: "#c6ccd4", weight: 0.8, interactive: false }

let worldPromise: Promise<GeoJSON.FeatureCollection> | null = null
const loadWorld = () => {
  worldPromise ??= fetch(WORLD_URL).then((r) => r.json()).then((topo: Topology) =>
    feature(topo, topo.objects.countries as GeometryCollection) as GeoJSON.FeatureCollection)
  return worldPromise
}

/** padding (px) kept clear around the fitted points so pills + tooltips stay inside */
const FIT_PAD: L.PointExpression = [56, 56]

export function GeoMap({
  points, fitKey, singleZoom = 6, className, style, children,
}: {
  /** points the "home" view fits to */
  points: GeoPoint[]
  /** change this to re-fit (e.g. when switching world ↔ country) */
  fitKey: string
  /** zoom used when there is exactly one point */
  singleZoom?: number
  className?: string
  style?: CSSProperties
  children: (project: (p: GeoPoint) => { x: number; y: number }) => ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [, bump] = useState(0)

  // create once
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    const map = L.map(hostRef.current, {
      zoomControl: false, attributionControl: true, preferCanvas: true,
      minZoom: 1, maxZoom: 8, zoomSnap: 0.25, scrollWheelZoom: false,
      maxBounds: [[-85, -200], [85, 200]], maxBoundsViscosity: 0.8,
    })
    map.attributionControl.setPrefix(false)
    map.attributionControl.addAttribution(ATTRIBUTION)
    let cancelled = false
    loadWorld().then((world) => { if (!cancelled) L.geoJSON(world, { style: LAND_STYLE }).addTo(map) })
    const rerender = () => bump((n) => n + 1)
    map.on("move zoom viewreset resize", rerender)
    mapRef.current = map
    return () => { cancelled = true; map.off(); map.remove(); mapRef.current = null }
  }, [])

  const home = () => {
    const map = mapRef.current
    if (!map || points.length === 0) return
    if (points.length === 1) { map.setView([points[0].lat, points[0].lng], singleZoom, { animate: false }); return }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: FIT_PAD, animate: false })
  }
  // re-fit whenever the view scope changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.invalidateSize()
    home()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  const project = (p: GeoPoint) => {
    const map = mapRef.current
    if (!map) return { x: -9999, y: -9999 }
    const pt = map.latLngToContainerPoint([p.lat, p.lng])
    return { x: pt.x, y: pt.y }
  }

  const ctl = "flex size-8 items-center justify-center transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={style}>
      <div ref={hostRef} className="absolute inset-0 geo-map" style={{ background: OCEAN }} />
      {/* pin overlay: the layer ignores pointer events so the map still drags; pins opt back in */}
      <div className="pointer-events-none absolute inset-0 z-[500]">
        {mapRef.current && children(project)}
      </div>
      {/* controls */}
      <div className="absolute right-3 top-3 z-[600] flex flex-col gap-2">
        <button type="button" onClick={home} aria-label="Reset view" className={`${ctl} rounded-md`}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--fg-neutral-emphasis)" }}>
          <Home className="size-4" />
        </button>
        <div className="flex flex-col overflow-hidden rounded-md" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--fg-neutral-emphasis)" }}>
          <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" className={ctl}><Plus className="size-4" /></button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out" className={`${ctl}`} style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}><Minus className="size-4" /></button>
        </div>
      </div>
    </div>
  )
}
