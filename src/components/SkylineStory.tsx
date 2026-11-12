import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Hero, HERO_VIDEO } from './Hero'
import { SiteLink } from './SiteLink'
import {
  SKYLINE,
  along,
  avenueAt,
  avenueLength,
  clamp,
  ease,
  lerp,
  project,
  span,
  towersPath,
  waterlineY,
  zoomAbout,
  zoomBetween,
  type Avenue,
  type Point,
  type Tower,
  type View,
} from './skylineMotion'
import { loanLinks, site, toolLinks } from '../site'

type Beat = 'purchase' | 'refinance' | 'loans' | 'tools'

const BEATS: readonly Beat[] = ['purchase', 'refinance', 'loans', 'tools']

const BEAT_LABELS: Record<Beat, string> = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  loans: 'Loan options',
  tools: 'Free tools',
}

/** Whether the downtown clip is in view while that beat sits still. */
function showsSkyline(beat: Beat): boolean {
  switch (beat) {
    case 'purchase':
    case 'refinance':
      return false
    case 'loans':
    case 'tools':
      return true
    default: {
      const unhandled: never = beat
      return unhandled
    }
  }
}

const MEDIA = {
  /** One frame of the downtown clip, 7.6 seconds in, where the drone is closest to the avenue. */
  avenue: '/media/avenue.jpg',
  purchase: '/media/purchase.jpg',
  refinance: '/media/refinance.mp4',
  loans: '/media/loans.mp4',
} as const

/*
 * The story is timed in screens: 1 is one viewport of scrolling past the top of the page.
 * Each pair is where a movement starts and where it has settled.
 */
const AT = {
  heroOut: [0.1, 0.75],
  /** The shot drops from the aerial until the headlight avenue fills the stage. */
  dive: [0.25, 1.05],
  /** Further down the same avenue. Still the night street from the hero, with no house in it yet. */
  drive: [1.05, 1.9],
  /** The end of the street opens into the suburb. */
  open: [1.85, 2.65],
  /** The suburb settles on the house. */
  houseIn: [2.5, 3.05],
  /** The room replaces the house across the whole frame. */
  inside: [3.55, 4.3],
  split: [4.85, 5.75],
  towerLabels: [5.4, 5.75],
  towerLabelsOut: [6.4, 6.6],
  sink: [6.45, 6.9],
  lightsOn: [6.8, 7.02],
  lightsOpen: [7.06, 7.4],
  /** The rail waits until the suburb is open and the house is the shot. */
  railIn: [2.55, 2.9],
} as const satisfies Record<string, readonly [number, number]>

const END = 8

/** Where each beat sits still. Reduced motion and short screens show these and nothing in between. */
const SETTLED: Record<Beat, number> = { purchase: 3.2, refinance: 4.6, loans: 6.15, tools: 7.8 }

/**
 * The avenue on the still frame, in clip pixels: where the headlights disappear between the towers,
 * and where the avenue meets the cross street above the trees.
 */
const STREET: Avenue = { far: [662, 505], near: [806, 880] }
/** How far down the stage the far end of the avenue sits, so the towers behind it stay in view above. */
const STREET_HORIZON = 0.3
/** How much of the stage height the avenue runs from there. Its near end is just off the bottom edge. */
const STREET_SPAN = 0.78
/** The least the downtown frame is enlarged for the street, which is what a very wide stage gets. */
const STREET_ZOOM = 1.5
/** Where the street opens, a little down the headlights from where they disappear. */
const ON_ROAD = 0.16
/** How far into the dive the moving clip has been lined up with the still frame. */
const STREET_MATCH = 0.2
/** The part of the dive over which the still frame fades in over the moving clip. */
const STREET_TAKES = [0.1, 0.42] as const
/** How much closer the drive gets once the avenue already fills the stage. */
const DRIVE_PUSH = 1.35
/** How much further the street is pushed past the shot while the suburb opens out of its far end. */
const OPEN_PUSH = 1.7
/** How much of the opening's radius shows the suburb whole. The rest is a long soft edge, so it reads as a dissolve and not a porthole. */
const OPEN_CORE = 0.3
/** Daylight glows out of the end of the street as it opens. This is how far past the opening's edge the glow reaches. */
const GLOW_REACH = 1.2
/** The colour of that daylight, as red, green, blue. */
const DAYLIGHT = '255, 251, 242'
/** How the glow falls away from its middle, as [percent of its radius, strength]. No step in it, so it never has an edge. */
const GLOW_FALLOFF = [
  [0, 1],
  [20, 0.88],
  [40, 0.6],
  [60, 0.3],
  [80, 0.09],
  [100, 0],
] as const
/** The parts of the opening over which the glow comes up and then clears. */
const GLOW_CUE: Cue = [0, 0.22, 0.3, 0.8]
/** How out of focus the suburb is when the light first opens, as a share of the stage's short side, and the part of the opening over which it sharpens. */
const OPEN_BLUR = 0.028
const OPEN_SHARPENS = [0.35, 0.95] as const
/** A blurred photo goes clear at its edges. It is enlarged by this many blur radii so those edges stay off the stage. */
const BLUR_OVERSCAN = 5
/** How much closer the suburb shot starts than it ends. It eases back to show the whole house as it settles. */
const SETTLE_PULL = 0.04

/** Fade in from, fade in to, fade out from, fade out to. */
type Cue = readonly [number, number, number, number]

/** The purchase copy leaves before the room replaces the house. */
const COPY_CUES: Record<Beat, Cue> = {
  purchase: [2.9, 3.15, 3.4, 3.65],
  refinance: [4.25, 4.55, 4.85, 5.1],
  loans: [5.3, 5.7, 6.4, 6.65],
  tools: [6.75, 7.1, END, END + 1],
}

/** The blocks rise at different times, the way this skyline is taller on the left and broken up on the right. */
const TOWER_DELAYS = [0.06, 0, 0.22, 0.12, 0.28]
const TOWER_HEIGHTS = [0.58, 0.72, 0.44, 0.63, 0.36]
const TOWER_LABEL_STAGGER = 0.04
const LIGHT_STAGGER = 0.035
const LIGHT_DOT = 12
const COPY_LIFT = 28

const STATIC_QUERY = '(prefers-reduced-motion: reduce), (max-height: 619px)'

const VIDEO = 'absolute inset-0 h-full w-full object-cover'
/** Media the story lays out whole, overhanging the stage: the downtown clip and its still frame. */
const WIDE = `${VIDEO} max-w-none`
/** The hero's short fade under the type. The picture above it is left as it is. */
const SHADE =
  'pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 via-black/10 to-transparent'
/** Where the hero sets its type: along the bottom edge, on the hero's margins. */
const COPY_FOOT = 'pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-7 md:px-12 lg:px-16 lg:pb-9'
/** The hero's two pills. */
const PRIMARY =
  'rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand'
const OUTLINE =
  'rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-brand'
const SECONDARY = 'text-sm font-medium text-white underline-offset-4 transition-colors hover:text-brand'

type Layout = {
  w: number
  h: number
  river: number
  /** The downtown clip at rest, covering the stage. */
  sky: View
  /** The same clip once the dive has settled on the avenue, and the spot on the stage where that avenue opens. */
  street: { view: View; stand: Point }
  towers: Tower[]
  pills: { cx: number; cy: number; w: number; h: number }[]
}

function setPlaying(video: HTMLVideoElement | null, on: boolean) {
  if (!video) return
  if (on) {
    if (video.paused) void video.play().catch(() => undefined)
  } else if (!video.paused) {
    video.pause()
  }
}

/** Reduced motion keeps clips paused. Seeking makes the browser draw a frame instead of an empty box. */
function showStill(video: HTMLVideoElement) {
  const seek = () => {
    video.currentTime = Math.min(1, video.duration / 2)
  }
  if (video.readyState >= 1) seek()
  else video.addEventListener('loadedmetadata', seek, { once: true })
}

/** Hides a layer outright. Shown layers inherit, so a hidden parent still hides them. */
function setVisible(element: HTMLElement | null, visible: boolean) {
  if (element) element.style.visibility = visible ? '' : 'hidden'
}

/** Fades a block of copy or links. Faded blocks stay in the page for assistive tech but stop taking clicks. */
function fade(element: HTMLElement | null, opacity: number, lift = 0) {
  if (!element) return
  element.style.opacity = opacity.toFixed(3)
  element.style.pointerEvents = opacity > 0.5 ? '' : 'none'
  element.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0)`
}

type BeatCopyProps = {
  beat: Beat
  title: string
  accent: string
  body: string
  children: ReactNode
}

/** A beat set the way the hero is: eyebrow, two-line headline, a sentence, two pills, then the licence line. */
function HeroCopy({ beat, title, accent, body, children }: BeatCopyProps) {
  return (
    <>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-end lg:gap-16">
        <div className="hero-copy">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/80">{BEAT_LABELS[beat]}</p>
          <h2
            className="text-[2.5rem] font-normal leading-[1.05] sm:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {title}
            <span className="serif-em block">{accent}</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/90 md:text-base">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">{children}</div>
      </div>
      <div className="hero-copy mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/25 pt-4 text-xs text-white/85">
        <p>
          {site.nmls} <span className="mx-2 text-white/40">/</span> {site.licensedIn}
        </p>
        <a href={site.phoneHref} className="transition-colors hover:text-brand">
          {site.phoneDisplay}
        </a>
      </div>
    </>
  )
}

function BeatCopy({ beat, title, accent, body, children }: BeatCopyProps) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.14em] text-white/75">
        <span className="text-brand">0{BEATS.indexOf(beat) + 1}</span>
        <span className="mx-2 text-white/40">/</span>
        {BEAT_LABELS[beat]}
      </p>
      <h2 className="mt-3 text-3xl font-normal leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
        {title}
        <span className="serif-em block">{accent}</span>
      </h2>
      <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-white/85 md:text-base">{body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
    </>
  )
}

type StageProps = {
  /** Show one beat, settled, as an ordinary section. Leave it out for the pinned, scroll-driven stage. */
  beat?: Beat
  /** The opening laid over the pinned stage. */
  children?: ReactNode
}

function Stage({ beat, children }: StageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const skylineRef = useRef<HTMLDivElement>(null)
  const skylineVideoRef = useRef<HTMLVideoElement>(null)
  const avenueStillRef = useRef<HTMLImageElement>(null)
  const houseRef = useRef<HTMLDivElement>(null)
  const housePhotoRef = useRef<HTMLImageElement>(null)
  const daylightRef = useRef<HTMLDivElement>(null)
  const tideRef = useRef<HTMLDivElement>(null)
  const refinanceVideoRef = useRef<HTMLVideoElement>(null)
  const loansVideoRef = useRef<HTMLVideoElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const copyRefs = useRef<Partial<Record<Beat, HTMLDivElement | null>>>({})
  const shadeRefs = useRef<Partial<Record<Beat, HTMLDivElement | null>>>({})
  const towerRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const pillRefs = useRef<(HTMLDivElement | null)[]>([])
  const lightRefs = useRef<(HTMLSpanElement | null)[]>([])

  const has = (candidate: Beat) => beat === undefined || beat === candidate

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const hero = heroRef.current
    const skyline = skylineRef.current
    const house = houseRef.current
    const housePhoto = housePhotoRef.current
    const daylight = daylightRef.current
    const tideLayer = tideRef.current
    const rail = railRef.current
    const ticks = rail ? Array.from(rail.querySelectorAll('button')) : []
    const grid = gridRef.current
    const skylineVideo = skylineVideoRef.current
    const avenueStill = avenueStillRef.current
    const refinanceVideo = refinanceVideoRef.current
    const loansVideo = loansVideoRef.current
    const videos = [skylineVideo, refinanceVideo, loansVideo]

    const measure = (): Layout => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      const wide = w >= 1024
      const river = waterlineY(w, h)

      // The downtown clip is laid out whole, overhanging the stage, so a zoom can reach what a cover crop would cut off.
      const skyScale = Math.max(w / SKYLINE.width, h / SKYLINE.height)
      const sky: View = {
        scale: skyScale,
        x: (w - SKYLINE.width * skyScale) / 2,
        y: (h - SKYLINE.height * skyScale) / 2,
      }
      ;[skylineVideo, avenueStill].forEach((layer) => {
        if (!layer) return
        layer.style.left = `${sky.x}px`
        layer.style.top = `${sky.y}px`
        layer.style.width = `${SKYLINE.width * skyScale}px`
        layer.style.height = `${SKYLINE.height * skyScale}px`
      })

      // The street shot. The avenue runs down the middle of the stage, the same night picture as the hero.
      const runY = STREET.near[1] - STREET.far[1]
      const streetScale = Math.max((STREET_SPAN * h) / runY, skyScale * STREET_ZOOM)
      const horizon = h * STREET_HORIZON
      const streetView: View = {
        scale: streetScale,
        x: clamp(w * 0.5 - STREET.far[0] * streetScale, w - SKYLINE.width * streetScale, 0),
        y: clamp(horizon - STREET.far[1] * streetScale, h - SKYLINE.height * streetScale, 0),
      }
      const street: Layout['street'] = { view: streetView, stand: project(streetView, along(STREET, ON_ROAD)) }

      const margin = wide ? 64 : w >= 768 ? 48 : 16
      const gap = Math.min(22, Math.max(6, w * 0.014))
      const width = (w - margin * 2 - gap * 4) / TOWER_HEIGHTS.length
      const towers = TOWER_HEIGHTS.map((height, index) => ({
        x: margin + index * (width + gap),
        top: h * (1 - height),
        width,
        bulge: width * 0.07,
      }))
      towerRefs.current.forEach((link, index) => {
        const tower = towers[index]
        if (!link || !tower) return
        link.style.left = `${tower.x}px`
        link.style.top = `${tower.top}px`
        link.style.width = `${tower.width}px`
        link.style.height = `${h - tower.top}px`
      })

      // The tools float on the river, centred between the waterline and the bottom edge.
      let pills: Layout['pills'] = []
      if (grid) {
        const top = Math.min(river + Math.max(16, (h - river - grid.offsetHeight) / 2), h - grid.offsetHeight - 16)
        grid.style.top = `${top}px`
        pills = Array.from(grid.children, (item) => {
          const cell = item as HTMLElement
          return {
            cx: grid.offsetLeft + cell.offsetLeft + cell.offsetWidth / 2,
            cy: top + cell.offsetTop + cell.offsetHeight / 2,
            w: cell.offsetWidth,
            h: cell.offsetHeight,
          }
        })
      }

      return { w, h, river, sky, street, towers, pills }
    }

    let layout = measure()
    let mounted = true
    /** True while the downtown clip is still playing under the dive, so the shot has to follow the drone. */
    let following = false
    let followed = -1

    if (skylineVideo) skylineVideo.style.transformOrigin = '0 0'
    if (avenueStill) avenueStill.style.transformOrigin = '0 0'

    /** Shows a layer of the downtown clip through that view. */
    const place = (layer: HTMLElement, view: View) => {
      const { sky } = layout
      layer.style.transform = `translate3d(${(view.x - sky.x).toFixed(1)}px, ${(view.y - sky.y).toFixed(1)}px, 0) scale(${(view.scale / sky.scale).toFixed(4)})`
    }

    /** Draws the story at scroll position x (in screens). */
    const paint = (x: number) => {
      const { w, h, river, sky, street } = layout
      const diving = span(x, ...AT.dive)
      const dive = ease(diving)
      const drive = ease(span(x, ...AT.drive))
      const opening = span(x, ...AT.open)
      const opened = ease(opening)
      const houseIn = ease(span(x, ...AT.houseIn))
      const inside = ease(span(x, ...AT.inside))
      const split = span(x, ...AT.split)
      const sink = ease(span(x, ...AT.sink))
      // The night avenue stays up until the suburb has opened across it.
      const onStreet = diving > 0 && opened < 1
      const cityCovered = opened >= 1 && split <= 0

      // Opening: the hero copy drifts up and the shot starts down toward the avenue.
      if (hero) {
        const out = ease(span(x, ...AT.heroOut))
        fade(hero, 1 - out)
        hero.style.setProperty('--hero-shift', `${(-Math.min(x, AT.heroOut[1]) * h * 0.7).toFixed(1)}px`)
      }

      // The street, continuing the hero. `stand` is the end of the headlights, where the suburb opens.
      const clock = skylineVideo ? skylineVideo.currentTime : 0
      let stand = street.stand
      let taken = 0
      if (onStreet) {
        // The shot keeps moving down the street while the suburb opens, so the towers slide off past it.
        const push = lerp(1, DRIVE_PUSH, drive) * lerp(1, OPEN_PUSH, opened)
        const shot = zoomAbout(zoomBetween(sky, street.view, dive), street.stand, push)
        stand = project(shot, along(STREET, ON_ROAD))

        if (avenueStill && avenueStill.complete && avenueStill.naturalWidth > 0) {
          taken = ease(span(diving, ...STREET_TAKES))
          place(avenueStill, shot)
          avenueStill.style.opacity = taken.toFixed(3)
          avenueStill.style.filter = ''
        }
        if (skylineVideo && taken < 1) {
          // The moving clip is wherever the drone had got to. Slide and enlarge it until its avenue lies on the still's.
          const live = avenueAt(clock)
          const match = ease(span(diving, 0, STREET_MATCH))
          const scale = shot.scale * Math.pow(avenueLength(STREET) / avenueLength(live), match)
          const middle = along(live, 0.5)
          const from = project(shot, middle)
          const to = project(shot, along(STREET, 0.5))
          place(skylineVideo, {
            scale,
            x: lerp(from[0], to[0], match) - middle[0] * scale,
            y: lerp(from[1], to[1], match) - middle[1] * scale,
          })
          skylineVideo.style.filter = ''
        }
      } else if (skylineVideo) {
        skylineVideo.style.transform = ''
        skylineVideo.style.filter = ''
      }
      setVisible(avenueStill, taken > 0)
      setVisible(skylineVideo, taken < 1)
      setVisible(skyline, !cityCovered)

      // The whole suburb photo opens out of the end of the street, soft at the edge, until it is the frame.
      const showHouse = opened > 0 && inside < 1
      const isOpening = opened > 0 && opened < 1
      setVisible(house, showHouse)
      setVisible(daylight, isOpening)
      if (house && showHouse) {
        if (isOpening) {
          // Far enough to clear whichever corner of the stage is furthest from the end of the street.
          const reach = Math.hypot(Math.max(stand[0], w - stand[0]), Math.max(stand[1], h - stand[1]))
          const radius = (opened * reach) / OPEN_CORE
          const centre = `${stand[0].toFixed(1)}px ${stand[1].toFixed(1)}px`
          const iris = `radial-gradient(circle ${radius.toFixed(1)}px at ${centre}, #000 ${OPEN_CORE * 100}%, transparent)`
          house.style.setProperty('-webkit-mask-image', iris)
          house.style.setProperty('mask-image', iris)
          if (daylight) {
            // Daylight first: a glow where the headlights end, with the suburb coming up inside it out of focus.
            // The suburb is never a patch of house pasted on the night street.
            const [inFrom, inTo, outFrom, outTo] = GLOW_CUE
            const glow = ease(span(opening, inFrom, inTo)) * (1 - ease(span(opening, outFrom, outTo)))
            const stops = GLOW_FALLOFF.map(([at, strength]) => `rgba(${DAYLIGHT}, ${(glow * strength).toFixed(3)}) ${at}%`)
            daylight.style.background = `radial-gradient(circle ${(radius * GLOW_REACH).toFixed(1)}px at ${centre}, ${stops.join(', ')})`
          }
        } else {
          house.style.removeProperty('-webkit-mask-image')
          house.style.removeProperty('mask-image')
        }
        if (housePhoto) {
          // The suburb comes into focus as the light clears, and the shot eases back until the whole house is in it.
          const soft = OPEN_BLUR * (1 - ease(span(opening, ...OPEN_SHARPENS)))
          housePhoto.style.filter = soft > 0 ? `blur(${(soft * Math.min(w, h)).toFixed(1)}px)` : ''
          housePhoto.style.transform = `scale(${(1 + soft * BLUR_OVERSCAN + SETTLE_PULL * (1 - houseIn)).toFixed(4)})`
        }
      }

      // The room dissolves in over the house across the whole frame, then splits into five downtown blocks.
      const loansIn = ease(span(split, 0.2, 0.75))
      if (tideLayer) {
        const shown = inside > 0 && sink < 1
        setVisible(tideLayer, shown)
        tideLayer.style.opacity = (split > 0 ? 1 : inside).toFixed(3)
        if (shown && split <= 0) {
          tideLayer.style.clipPath = 'none'
        } else if (shown) {
          const columns = layout.towers.map((tower, index) => {
            const formed = ease(span(split, TOWER_DELAYS[index], TOWER_DELAYS[index] + 0.7))
            const slice = w / layout.towers.length
            return {
              // Slices start a hair wide so no seam shows between them before they part.
              x: lerp(index * slice - 0.5, tower.x, formed),
              width: lerp(slice + 1, tower.width, formed),
              top: lerp(-2, lerp(tower.top, h + 8, sink), formed),
              bulge: tower.bulge * formed * (1 - sink),
            }
          })
          tideLayer.style.clipPath = `path("${towersPath(columns, h)}")`
          if (loansVideo) {
            // The loans clip is fitted to the towers, so the house in it stays in their windows as they settle.
            const roof = Math.max(0, Math.min(...columns.map((column) => column.top)))
            loansVideo.style.top = `${roof.toFixed(1)}px`
            loansVideo.style.height = `${Math.max(0, h - roof).toFixed(1)}px`
          }
        }
      }
      if (loansVideo) loansVideo.style.opacity = loansIn.toFixed(3)
      setVisible(refinanceVideo, loansIn < 1)
      if (refinanceVideo) refinanceVideo.style.transform = ''
      BEATS.forEach((name) => {
        const [inFrom, inTo, outFrom, outTo] = COPY_CUES[name]
        const arrived = ease(span(x, inFrom, inTo))
        const left = ease(span(x, outFrom, outTo))
        fade(copyRefs.current[name] ?? null, arrived * (1 - left), (1 - arrived - left) * COPY_LIFT)
        // The fade under the type comes and goes with it, but stays on the bottom edge.
        const shade = shadeRefs.current[name]
        if (shade) shade.style.opacity = (arrived * (1 - left)).toFixed(3)
      })

      towerRefs.current.forEach((link, index) => {
        const delay = index * TOWER_LABEL_STAGGER
        const arrived = ease(span(x, AT.towerLabels[0] + delay, AT.towerLabels[1] + delay))
        fade(link, arrived * (1 - ease(span(x, ...AT.towerLabelsOut))), (1 - arrived) * COPY_LIFT)
      })

      // Beat 4: eight lights come on along the streets at the bottom, then each opens into a tool.
      pillRefs.current.forEach((pill, index) => {
        const spot = layout.pills[index]
        const light = lightRefs.current[index]
        if (!pill || !light || !spot) return
        const delay = index * LIGHT_STAGGER
        const lit = ease(span(x, AT.lightsOn[0] + delay, AT.lightsOn[1] + delay))
        const open = ease(span(x, AT.lightsOpen[0] + delay, AT.lightsOpen[1] + delay))
        const lightX = w * (0.1 + (0.8 * index) / Math.max(1, layout.pills.length - 1))
        const shift = `translate3d(${((lightX - spot.cx) * (1 - open)).toFixed(1)}px, ${((river - spot.cy) * (1 - open)).toFixed(1)}px, 0)`

        pill.style.transform = shift
        pill.style.opacity = lit.toFixed(3)
        pill.style.pointerEvents = open > 0.9 ? 'auto' : 'none'
        pill.style.clipPath =
          open >= 1
            ? 'none'
            : `inset(${(((spot.h - LIGHT_DOT) / 2) * (1 - open)).toFixed(1)}px ${(((spot.w - LIGHT_DOT) / 2) * (1 - open)).toFixed(1)}px round 999px)`
        pill.style.setProperty('--core', (1 - ease(span(open, 0.1, 0.8))).toFixed(3))
        pill.style.setProperty('--label', ease(span(open, 0.55, 1)).toFixed(3))
        light.style.transform = `${shift} scale(${lerp(0.4, 1, lit).toFixed(3)})`
        light.style.opacity = (lit * (1 - ease(span(open, 0.35, 1)))).toFixed(3)
      })

      if (rail) {
        const shown = ease(span(x, ...AT.railIn))
        rail.style.opacity = shown.toFixed(3)
        rail.style.pointerEvents = shown > 0.5 ? '' : 'none'
        // A beat is current until its copy starts to leave.
        const current = x < AT.railIn[1] ? null : (BEATS.find((name) => x < COPY_CUES[name][2]) ?? 'tools')
        ticks.forEach((tick) => {
          const isCurrent = tick.dataset.beat === current
          if (isCurrent !== tick.hasAttribute('aria-current')) tick.toggleAttribute('aria-current', isCurrent)
        })
      }

      following = false
      followed = clock
      if (!beat) {
        // The drone keeps flying into the start of the dive, then holds where it is while the still frame takes over.
        const flying = !onStreet || diving < STREET_TAKES[0]
        following = onStreet && flying
        setPlaying(skylineVideo, flying && !cityCovered)
        // Clips start a little before they are seen so the first frame is ready.
        setPlaying(refinanceVideo, x > AT.inside[0] - 0.3 && loansIn < 1)
        setPlaying(loansVideo, x > SETTLED.refinance - 0.15 && sink < 1)
      }
    }

    if (beat) {
      // One settled beat in the normal flow of the page. Its clips play only while it is on screen.
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const settle = () => {
        layout = measure()
        paint(SETTLED[beat])
      }
      settle()
      if (still) videos.forEach((video) => video && showStill(video))
      void document.fonts.ready.then(() => mounted && settle())
      const resize = new ResizeObserver(settle)
      resize.observe(stage)
      const watch = new IntersectionObserver((entries) => {
        const onScreen = entries.some((entry) => entry.isIntersecting)
        videos.forEach((video) => setPlaying(video, onScreen && !still))
      })
      watch.observe(stage)
      return () => {
        mounted = false
        resize.disconnect()
        watch.disconnect()
      }
    }

    const track = stage.parentElement
    if (!track) return

    let frame = 0
    let shown = -1
    let painted = -1

    const tick = () => {
      frame = window.requestAnimationFrame(tick)
      const target = Math.min(END, Math.max(0, -track.getBoundingClientRect().top / layout.h))
      // Ease toward the scroll position so wheel steps do not show as jumps.
      shown = shown < 0 || Math.abs(target - shown) < 0.0005 ? target : lerp(shown, target, 0.22)
      // Nothing moved, unless the downtown clip moved on under the street shot.
      if (shown === painted && !(following && skylineVideo && skylineVideo.currentTime !== followed)) return
      paint(shown)
      painted = shown
    }
    const repaint = () => {
      layout = measure()
      painted = -1
    }

    paint(Math.min(END, Math.max(0, -track.getBoundingClientRect().top / layout.h)))
    void document.fonts.ready.then(() => mounted && repaint())
    // The street is drawn from the moving clip until its still frame has loaded.
    avenueStill?.addEventListener('load', repaint, { once: true })
    const resize = new ResizeObserver(repaint)
    resize.observe(stage)
    const watch = new IntersectionObserver((entries) => {
      window.cancelAnimationFrame(frame)
      if (entries.some((entry) => entry.isIntersecting)) {
        shown = -1
        painted = -1
        frame = window.requestAnimationFrame(tick)
      } else {
        videos.forEach((video) => setPlaying(video, false))
      }
    })
    watch.observe(track)

    return () => {
      mounted = false
      window.cancelAnimationFrame(frame)
      avenueStill?.removeEventListener('load', repaint)
      resize.disconnect()
      watch.disconnect()
    }
  }, [beat])

  const jump = (screens: number) => {
    const stage = stageRef.current
    const track = stage?.parentElement
    if (!stage || !track) return
    window.scrollTo({
      top: track.getBoundingClientRect().top + window.scrollY + screens * stage.clientHeight,
      behavior: 'smooth',
    })
  }

  /** Tabbing to a link in a beat that has not played yet scrolls the story to that beat. */
  const followFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (beat || !event.target.matches(':focus-visible')) return
    const owner = event.target.closest<HTMLElement>('[data-at]')
    if (owner) jump(Number(owner.dataset.at))
  }

  const copyRef = (name: Beat) => (element: HTMLDivElement | null) => {
    copyRefs.current[name] = element
  }
  const shadeRef = (name: Beat) => (element: HTMLDivElement | null) => {
    shadeRefs.current[name] = element
  }

  return (
    <div
      ref={stageRef}
      onFocus={followFocus}
      className={`overflow-hidden bg-black text-white ${beat ? 'relative h-screen min-h-[620px]' : 'story-stage sticky top-0'}`}
    >
      {/* First in the page so it is read and tabbed to first; z-index keeps it on top. */}
      {children ? (
        <div ref={heroRef} data-at={0} className="absolute inset-0 z-30">
          {children}
        </div>
      ) : null}

      {beat === undefined || showsSkyline(beat) ? (
        <div ref={skylineRef} className="absolute inset-0">
          <video
            ref={skylineVideoRef}
            className={WIDE}
            src={HERO_VIDEO}
            autoPlay={!beat}
            loop
            muted
            playsInline
            preload={beat ? 'metadata' : 'auto'}
            aria-hidden="true"
          />
          {/* The avenue, held on one frame of the clip. It fades in over the moving clip on the way down. */}
          {beat ? null : <img ref={avenueStillRef} className={WIDE} src={MEDIA.avenue} alt="" aria-hidden="true" />}
        </div>
      ) : null}

      {has('purchase') ? (
        // The suburb, whole: the house, its lawn and driveway, the neighbours and the sky. This layer carries the opening.
        <div ref={houseRef} className="pointer-events-none absolute inset-0">
          <img
            ref={housePhotoRef}
            // A tall screen keeps the porch, the middle gable and the upstairs window. A wide one keeps the roof peak.
            className={`${VIDEO} object-[54%_24%]`}
            src={MEDIA.purchase}
            alt="A two-story suburban house with a stone front porch, a front lawn and a driveway, with neighbouring houses on both sides"
          />
        </div>
      ) : null}
      {/* The daylight that spills out of the end of the street while the suburb opens. */}
      {beat ? null : <div ref={daylightRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />}

      {has('refinance') || has('loans') ? (
        <div ref={tideRef} className="absolute inset-0">
          {has('refinance') ? (
            <video
              ref={refinanceVideoRef}
              className={VIDEO}
              src={MEDIA.refinance}
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="A bright open living room with wood floors and a staircase"
            />
          ) : null}
          {has('loans') ? (
            <video
              ref={loansVideoRef}
              className={VIDEO}
              src={MEDIA.loans}
              loop
              muted
              playsInline
              preload="metadata"
              style={{ objectPosition: '68% 58%' }}
              aria-label="A modern house with a patio and glass doors"
            />
          ) : null}
        </div>
      ) : null}

      {/* The house and the room are laid out the way the hero is: the picture whole, a short fade, type along the bottom. */}
      {has('purchase') ? (
        <>
          <div ref={shadeRef('purchase')} className={SHADE} aria-hidden="true" />
          <div className={COPY_FOOT}>
            <div ref={copyRef('purchase')} data-at={SETTLED.purchase} className="pointer-events-auto">
              <HeroCopy
                beat="purchase"
                title="Buy a home."
                accent="Start with the qualifier."
                body="Shop purchase options and use the home purchase qualifier to see what you qualify for."
              >
                <a href={site.purchaseQualifier} className={PRIMARY}>
                  Purchase qualifier
                </a>
                <Link to="/purchase" className={OUTLINE}>
                  More on buying
                </Link>
              </HeroCopy>
            </div>
          </div>
        </>
      ) : null}

      {has('refinance') ? (
        <>
          <div ref={shadeRef('refinance')} className={SHADE} aria-hidden="true" />
          <div className={COPY_FOOT}>
            <div ref={copyRef('refinance')} data-at={SETTLED.refinance} className="pointer-events-auto">
              <HeroCopy
                beat="refinance"
                title="Refinance"
                accent="the home you have."
                body="Check whether a refinance fits, then review the numbers with the refinance rate checker."
              >
                <a href={site.refinanceChecker} className={PRIMARY}>
                  Refinance checker
                </a>
                <Link to="/refinance" className={OUTLINE}>
                  More on refinancing
                </Link>
              </HeroCopy>
            </div>
          </div>
        </>
      ) : null}

      {has('loans') ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[9vh] md:px-12 lg:px-16">
            <div
              ref={copyRef('loans')}
              data-at={SETTLED.loans}
              className="hero-copy story-scrim pointer-events-auto max-w-md"
            >
              <BeatCopy
                beat="loans"
                title={`${loanLinks.length} loan options.`}
                accent="Fixed, ARM, FHA, VA."
                body="Pick a loan to read about it, or look at today’s rates."
              >
                <Link to="/loans" className={SECONDARY}>
                  See loan options →
                </Link>
                <Link to="/rates" className={SECONDARY}>
                  Today’s rates →
                </Link>
              </BeatCopy>
            </div>
          </div>
          <ul data-at={SETTLED.loans} aria-label="Loan options">
            {loanLinks.map((loan, index) => (
              <li key={loan.href}>
                <Link
                  ref={(element) => {
                    towerRefs.current[index] = element
                  }}
                  to={loan.href}
                  className="group absolute flex items-end overflow-hidden text-white max-md:justify-center"
                >
                  <span className="tower-shade" aria-hidden="true" />
                  <span className="relative flex items-center gap-2 max-md:mb-5 max-md:rotate-180 max-md:[writing-mode:vertical-rl] md:w-full md:flex-col md:items-start md:gap-1 md:px-5 md:pb-6">
                    <span className="text-xs font-medium text-brand">0{index + 1}</span>
                    <span className="text-sm font-medium md:text-lg lg:text-xl">{loan.label}</span>
                    <span className="hidden text-sm text-white/75 transition-transform group-hover:translate-x-1 md:inline">
                      View loan →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {has('tools') ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[9vh] md:px-12 lg:px-16">
            <div
              ref={copyRef('tools')}
              data-at={SETTLED.tools}
              className="hero-copy story-scrim pointer-events-auto max-w-md"
            >
              <BeatCopy
                beat="tools"
                title={`${toolLinks.length} free tools.`}
                accent="Qualifier to calculator."
                body="Online tools, from the purchase qualifier to the payment calculator."
              >
                <Link to="/tools" className={SECONDARY}>
                  All tools →
                </Link>
              </BeatCopy>
            </div>
          </div>
          <ul
            ref={gridRef}
            data-at={SETTLED.tools}
            aria-label="Free tools"
            className="pointer-events-none absolute inset-x-4 grid grid-cols-2 gap-2.5 md:inset-x-12 md:gap-3 lg:inset-x-16 lg:grid-cols-4"
          >
            {toolLinks.map((tool, index) => (
              <li key={tool.label} className="relative">
                <span
                  ref={(element) => {
                    lightRefs.current[index] = element
                  }}
                  className="river-light"
                  aria-hidden="true"
                />
                <div
                  ref={(element) => {
                    pillRefs.current[index] = element
                  }}
                  className="tool-pill h-full"
                >
                  <SiteLink
                    href={tool.href}
                    className="flex h-full min-h-[3.25rem] items-center gap-3 px-4 py-2 text-sm font-medium leading-tight text-white transition-colors hover:text-brand md:px-5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-brand shadow-[0_0_10px_2px_rgba(137,188,55,0.7)]"
                      aria-hidden="true"
                    />
                    <span className="tool-label">{tool.label}</span>
                  </SiteLink>
                  <span className="tool-core" aria-hidden="true" />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {beat ? null : (
        <nav
          ref={railRef}
          aria-label="Homepage sections"
          className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex"
        >
          {BEATS.map((name) => (
            <button
              key={name}
              type="button"
              data-beat={name}
              onClick={() => jump(SETTLED[name])}
              className="hero-copy group flex items-center gap-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white"
            >
              <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-[current]:opacity-100">
                {BEAT_LABELS[name]}
              </span>
              <span className="h-0.5 w-3.5 rounded-full bg-white/80 shadow-[0_0_5px_rgba(0,0,0,0.9)] transition-all group-aria-[current]:w-8 group-aria-[current]:bg-brand" />
            </button>
          ))}
        </nav>
      )}

    </div>
  )
}

function useStaticStory() {
  const [isStatic, setStatic] = useState(() => window.matchMedia(STATIC_QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(STATIC_QUERY)
    const update = () => setStatic(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isStatic
}

/**
 * The homepage from the hero down to the free tools. The downtown night clip stays pinned while
 * scrolling drops onto its headlight avenue and runs down it. The far end of that street opens into
 * a suburb, which settles on a house (purchase). A room dissolves in over the house (refinance),
 * the view parts into five blocks (loan options), and the street lights turn into the free tools.
 * The house and the room carry their copy the way the hero does.
 *
 * With reduced motion, or on a screen too short to pin, each beat is shown settled as its own section.
 */
export function SkylineStory() {
  const isStatic = useStaticStory()

  if (isStatic) {
    return (
      <>
        <Hero />
        {BEATS.map((beat) => (
          <section key={beat} aria-label={BEAT_LABELS[beat]}>
            <Stage beat={beat} />
          </section>
        ))}
      </>
    )
  }

  return (
    <section className="story-track relative bg-black" style={{ '--story-screens': END + 1 } as CSSProperties}>
      <Stage>
        <Hero pinned />
      </Stage>
    </section>
  )
}
