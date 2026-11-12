import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Hero, HERO_VIDEO } from './Hero'
import { SiteLink } from './SiteLink'
import {
  SKYLINE,
  avenueAt,
  clamp01,
  coverFit,
  ease,
  lerp,
  span,
  towersPath,
  waterlineY,
  type Point,
  type Tower,
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

const CLIPS = {
  purchase: '/media/purchase.mp4',
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
  /** Down the avenue to the house standing on it, until the house is the whole view. */
  drive: [0.7, 2.4],
  /** The garage door lifts and the shot goes through it into the room. */
  garage: [3.2, 4.35],
  split: [4.85, 5.75],
  towerLabels: [5.4, 5.75],
  towerLabelsOut: [6.4, 6.6],
  sink: [6.45, 6.9],
  lightsOn: [6.8, 7.02],
  lightsOpen: [7.06, 7.4],
  /** The rail waits until the house is what the shot is about. */
  railIn: [1.5, 1.9],
} as const satisfies Record<string, readonly [number, number]>

const END = 8

/** Where each beat sits still. Reduced motion and short screens show these and nothing in between. */
const SETTLED: Record<Beat, number> = { purchase: 2.8, refinance: 4.6, loans: 6.15, tools: 7.8 }

/** How much of the stage the avenue spans, end to end, once the dive has settled on it. */
const STREET_FILL = 0.9
/** The most the downtown clip is enlarged for that, and then for the drive. Past this it stops reading as a street. */
const STREET_ZOOM = 4.2
const DRIVE_ZOOM = 5
/** How much closer the drive gets than the dive. */
const DRIVE_PUSH = 1.75
/**
 * The avenue's far point is the horizon, up in the gap between the towers. A house on the street
 * stands this far in front of that, toward the camera, and the offset closes as the house fills the view.
 */
const ON_ROAD = 0.42
/**
 * The downtown clip is held on this second while the shot is in the street. The avenue points
 * were measured here, and letting the drone play on slides the zoom off that street.
 */
const STREET_FRAME = 2

/** The purchase clip is a 1080x1920 pan across a house. This is the moment the gable is centred. */
const HOUSE_CLIP = { width: 1080, height: 1920 }
const HOUSE_FRAME = 4.7

/** The house on that frame, in clip pixels. */
const HOUSE = {
  /** Apex, then clockwise: the two eaves, garage canopy and footing on the right, then back up the left. */
  outline: [
    [541, 534],
    [884, 750],
    [818, 796],
    [864, 822],
    [826, 850],
    [826, 872],
    [874, 906],
    [838, 914],
    [832, 1062],
    [256, 1062],
    [256, 900],
    [228, 880],
    [246, 864],
    [246, 792],
    [218, 756],
  ],
  /** The middle of the garage threshold. This point rides on the far end of the avenue. */
  doorstep: [544, 1062],
  middle: 798,
  /** The right-hand garage door. The room opens here. */
  garage: { left: 506, top: 928, right: 686, bottom: 1060 },
} as const satisfies Record<string, unknown>

/** The house is this fraction of its full size when it first shows at the far end of the avenue. */
const HOUSE_START = 0.1
/**
 * Down the street only the building shows, cut out along its roofline. Between these sizes the
 * daylight of its own clip spreads out around it, until it is the whole frame.
 */
const HOUSE_DAWN = [0.2, 0.92] as const
/** The thin light edge that picks the building out of the night fades over these sizes. */
const HOUSE_EDGE = [0.18, 0.34] as const
/** How bright the daylight house is while it is still a small building on a night street. */
const HOUSE_DUSK = 0.7
/** The house stays small at the end of the avenue, then the photo takes the frame. */
const HOUSE_RUSH = 0.38

/** Fade in from, fade in to, fade out from, fade out to. */
type Cue = readonly [number, number, number, number]

/** The purchase copy is gone before AT.garage starts, so the door never opens under the button. */
const COPY_CUES: Record<Beat, Cue> = {
  purchase: [2.38, 2.66, 2.95, 3.15],
  refinance: [4.0, 4.4, 4.85, 5.1],
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
const PRIMARY =
  'rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand'
const SECONDARY = 'text-sm font-medium text-white underline-offset-4 transition-colors hover:text-brand'

type Box = { left: number; top: number; right: number; bottom: number }

type Layout = {
  w: number
  h: number
  river: number
  /** Stage pixels per pixel of the downtown clip. */
  skyScale: number
  /** The house of the purchase clip, in stage pixels, once it fills the stage. `cutout` is a clip-path along its outline. */
  home: { doorstep: Point; cutout: string; garage: Box }
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

/** Keeps the purchase clip paused on the frame the house was measured on. */
function holdFrame(video: HTMLVideoElement | null) {
  if (!video) return
  if (video.readyState >= 1 && Math.abs(video.currentTime - HOUSE_FRAME) > 0.07) video.currentTime = HOUSE_FRAME
  if (!video.paused) video.pause()
}

/** Seeks to that frame as soon as the clip can, so the house is drawn before the street reaches it. */
function primeFrame(video: HTMLVideoElement) {
  if (video.readyState >= 1) holdFrame(video)
  else video.addEventListener('loadedmetadata', () => holdFrame(video), { once: true })
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

function BeatCopy({
  beat,
  title,
  accent,
  body,
  children,
}: {
  beat: Beat
  title: string
  accent: string
  body: string
  children: ReactNode
}) {
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
  const glowRef = useRef<HTMLDivElement>(null)
  const skylineRef = useRef<HTMLDivElement>(null)
  const skylineVideoRef = useRef<HTMLVideoElement>(null)
  const houseRef = useRef<HTMLDivElement>(null)
  const houseMoveRef = useRef<HTMLDivElement>(null)
  const houseCutRef = useRef<HTMLDivElement>(null)
  const purchaseVideoRef = useRef<HTMLVideoElement>(null)
  const daylightVideoRef = useRef<HTMLVideoElement>(null)
  const tideRef = useRef<HTMLDivElement>(null)
  const refinanceVideoRef = useRef<HTMLVideoElement>(null)
  const loansVideoRef = useRef<HTMLVideoElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const copyRefs = useRef<Partial<Record<Beat, HTMLDivElement | null>>>({})
  const towerRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const pillRefs = useRef<(HTMLDivElement | null)[]>([])
  const lightRefs = useRef<(HTMLSpanElement | null)[]>([])

  const has = (candidate: Beat) => beat === undefined || beat === candidate

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const hero = heroRef.current
    const glow = glowRef.current
    const skyline = skylineRef.current
    const house = houseRef.current
    const houseMove = houseMoveRef.current
    const houseCut = houseCutRef.current
    const tideLayer = tideRef.current
    const rail = railRef.current
    const ticks = rail ? Array.from(rail.querySelectorAll('button')) : []
    const grid = gridRef.current
    const skylineVideo = skylineVideoRef.current
    const purchaseVideo = purchaseVideoRef.current
    const daylightVideo = daylightVideoRef.current
    const refinanceVideo = refinanceVideoRef.current
    const loansVideo = loansVideoRef.current
    /** The house and the daylight around it are the same clip, held on the same frame. */
    const houseVideos = [purchaseVideo, daylightVideo]
    const videos = [skylineVideo, ...houseVideos, refinanceVideo, loansVideo]

    const measure = (): Layout => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      const wide = w >= 1024
      const river = waterlineY(w, h)
      const skyScale = Math.max(w / SKYLINE.width, h / SKYLINE.height)

      // Frame the purchase clip on the house: centred top to bottom, with the garage threshold kept in view.
      const houseScale = Math.max(w / HOUSE_CLIP.width, h / HOUSE_CLIP.height)
      const slack = h - HOUSE_CLIP.height * houseScale
      const houseTop = Math.min(h / 2 - HOUSE.middle * houseScale, h * 0.96 - HOUSE.doorstep[1] * houseScale)
      const alignY = slack < -0.5 ? clamp01(houseTop / slack) : 0.5
      const houseFit = coverFit(w, h, HOUSE_CLIP.width, HOUSE_CLIP.height, 0.5, alignY)
      houseVideos.forEach((video) => {
        if (video) video.style.objectPosition = `50% ${(alignY * 100).toFixed(2)}%`
      })
      const onStage = ([x, y]: Point): Point => [houseFit.left + x * houseFit.scale, houseFit.top + y * houseFit.scale]
      const [garageLeft, garageTop] = onStage([HOUSE.garage.left, HOUSE.garage.top])
      const [garageRight, garageBottom] = onStage([HOUSE.garage.right, HOUSE.garage.bottom])
      const corners = HOUSE.outline.map((corner) => {
        const [x, y] = onStage(corner)
        return `${x.toFixed(1)}px ${y.toFixed(1)}px`
      })
      const home: Layout['home'] = {
        doorstep: onStage(HOUSE.doorstep),
        cutout: `polygon(${corners.join(',')})`,
        garage: { left: garageLeft, top: garageTop, right: garageRight, bottom: garageBottom },
      }

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

      return { w, h, river, skyScale, home, towers, pills }
    }

    let layout = measure()
    let mounted = true
    /** True while the downtown clip is moving under the street shot, so the shot has to follow it. */
    let following = false
    let followed = -1

    if (skylineVideo) skylineVideo.style.transformOrigin = '0 0'
    if (houseMove) houseMove.style.transformOrigin = '0 0'
    houseVideos.forEach((video) => video && primeFrame(video))

    /** Draws the story at scroll position x (in screens). */
    const paint = (x: number) => {
      const { w, h, river, skyScale, home } = layout
      const dive = ease(span(x, ...AT.dive))
      const driven = span(x, ...AT.drive)
      const drive = ease(driven)
      const garage = span(x, ...AT.garage)
      const split = span(x, ...AT.split)
      const sink = ease(span(x, ...AT.sink))
      const onStreet = dive > 0 && driven < 1
      const houseStands = driven > 0 && garage < 1
      // The house, and then the room, cover the city. It comes back between the loan towers.
      const cityCovered = driven >= 1 && split <= 0

      // Opening: the hero copy drifts up and the shot starts down toward the avenue.
      if (hero) {
        const out = ease(span(x, ...AT.heroOut))
        fade(hero, 1 - out)
        hero.style.setProperty('--hero-shift', `${(-Math.min(x, AT.heroOut[1]) * h * 0.7).toFixed(1)}px`)
      }

      // The street. `endX`, `endY` is where the far end of the avenue is on the stage: the spot the house stands on.
      const clock = skylineVideo ? skylineVideo.currentTime : 0
      let endX = home.doorstep[0]
      let endY = home.doorstep[1]
      let street = ''
      let alignX = 0.5
      let alignY = 0.5
      if (onStreet) {
        const { far, near } = avenueAt(clock)
        // A narrow or very wide stage crops the clip. Slide the crop over the avenue on the way down.
        const slackX = w - SKYLINE.width * skyScale
        const slackY = h - SKYLINE.height * skyScale
        if (slackX < -1) alignX = lerp(0.5, clamp01((w / 2 - ((far[0] + near[0]) / 2) * skyScale) / slackX), dive)
        if (slackY < -1) alignY = lerp(0.5, clamp01((h / 2 - ((far[1] + near[1]) / 2) * skyScale) / slackY), dive)
        const farX = slackX * alignX + far[0] * skyScale
        const farY = slackY * alignY + far[1] * skyScale
        const runX = (near[0] - far[0]) * skyScale
        const runY = (near[1] - far[1]) * skyScale
        // Enough zoom for the avenue to run most of the stage, however far out the drone is in this frame.
        const fill = Math.min(Math.max(STREET_FILL * Math.min(w / runX, h / runY), 1.5), STREET_ZOOM)
        const close = Math.min(fill * DRIVE_PUSH, DRIVE_ZOOM)
        // The dive zooms about the one point that leaves the avenue centred: headlights down the middle, towers either side.
        const pivotX = ((w - fill * runX) / 2 - fill * farX) / (1 - fill)
        const pivotY = ((h - fill * runY) / 2 - fill * farY) / (1 - fill)
        const dropped = Math.pow(fill, dive)
        // The drive keeps closing in while the far end comes down the stage to where the house stands.
        const zoom = dropped * Math.pow(close / fill, drive)
        endX = lerp(pivotX + dropped * (farX - pivotX), home.doorstep[0], drive)
        endY = lerp(pivotY + dropped * (farY - pivotY), home.doorstep[1], drive)
        street = `translate3d(${(endX - zoom * farX).toFixed(1)}px, ${(endY - zoom * farY).toFixed(1)}px, 0) scale(${zoom.toFixed(4)})`
        // Feet in front of the horizon, on the headlights, then back to the doorstep as the house arrives.
        const along = ON_ROAD * (1 - drive)
        endX += zoom * runX * along
        endY += zoom * runY * along
      }
      if (skylineVideo) {
        skylineVideo.style.transform = street
        skylineVideo.style.objectPosition = `${(alignX * 100).toFixed(2)}% ${(alignY * 100).toFixed(2)}%`
      }
      setVisible(skyline, !cityCovered)

      if (glow) {
        glow.style.opacity = '0'
      }

      // Beat 2: the garage door lifts and the shot goes through it. `opening` is the doorway on the stage.
      const door = home.garage
      const reach = Math.max(w / (door.right - door.left), h / (door.bottom - door.top))
      const through = (Math.pow(reach, ease(span(garage, 0.1, 1))) - 1) / (reach - 1)
      const opening = {
        left: lerp(door.left, 0, through),
        top: lerp(door.top, 0, through),
        right: lerp(door.right, w, through),
        bottom: lerp(door.bottom, h, through),
      }

      // Beat 1: the house stands at the far end of the avenue, small at first, and grows as the street runs under you.
      setVisible(house, houseStands)
      if (house && houseMove && houseCut && houseStands) {
        let move = ''
        let cut = 'none'
        let edge = 'none'
        let dusk = 1
        let dawn = 0
        if (driven < 1) {
          const held = ease(span(drive, 0, HOUSE_RUSH))
          const rush = ease(span(drive, HOUSE_RUSH, 1))
          const size = lerp(lerp(HOUSE_START, 0.16, held), 1, rush)
          move = `translate3d(${(endX - size * home.doorstep[0]).toFixed(1)}px, ${(endY - size * home.doorstep[1]).toFixed(1)}px, 0) scale(${size.toFixed(4)})`
          // A cutout only while it is a small building at the end of the street. After that, its own sky and driveway take over.
          cut = size < 0.28 ? home.cutout : 'none'
          const edged = 1 - ease(span(size, ...HOUSE_EDGE))
          if (edged > 0 && size < 0.28) edge = `drop-shadow(0 0 1px rgba(255,255,255,${(0.8 * edged).toFixed(3)}))`
          dusk = lerp(HOUSE_DUSK, 1, ease(span(size, 0.12, 0.4)))
          dawn = ease(span(size, ...HOUSE_DAWN))
        } else if (garage > 0) {
          // Through the garage: the doorway grows to the edges of the stage and takes the house with it.
          const scaleX = (opening.right - opening.left) / (door.right - door.left)
          const scaleY = (opening.bottom - opening.top) / (door.bottom - door.top)
          move = `translate3d(${(opening.left - scaleX * door.left).toFixed(1)}px, ${(opening.top - scaleY * door.top).toFixed(1)}px, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
        }
        house.style.opacity = ease(span(driven, 0, 0.08)).toFixed(3)
        house.style.filter = edge
        houseMove.style.transform = move
        houseMove.style.filter = dusk < 1 ? `brightness(${dusk.toFixed(3)})` : ''
        houseCut.style.clipPath = cut
        // The daylight is feathered at its edges until they meet the edges of the stage, so it never shows as a panel.
        setVisible(daylightVideo, dawn > 0)
        if (daylightVideo && dawn > 0) daylightVideo.style.setProperty('--feather', `${(50 * (1 - dawn)).toFixed(2)}%`)
      }

      // Beat 3: the room splits into five downtown blocks, which later drop back into the city.
      const loansIn = ease(span(split, 0.2, 0.75))
      if (tideLayer) {
        const shown = garage > 0 && sink < 1
        setVisible(tideLayer, shown)
        if (shown && garage < 1) {
          // The door rolls up from the threshold, so the room shows from the floor first.
          const lifted = ease(span(garage, 0, 0.3))
          const top = Math.max(0, lerp(opening.bottom, opening.top, lifted))
          tideLayer.style.clipPath = `inset(${top.toFixed(1)}px ${Math.max(0, w - opening.right).toFixed(1)}px ${Math.max(0, h - opening.bottom).toFixed(1)}px ${Math.max(0, opening.left).toFixed(1)}px)`
        } else if (shown && split <= 0) {
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
      if (refinanceVideo) {
        if (garage > 0 && garage < 1) {
          // The room is fitted to the doorway, so it is inside the garage until the doorway is the whole stage.
          const fit = Math.max((opening.right - opening.left) / w, (opening.bottom - opening.top) / h)
          const shiftX = (opening.left + opening.right - w) / 2
          const shiftY = (opening.top + opening.bottom - h) / 2
          refinanceVideo.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0) scale(${fit.toFixed(4)})`
        } else {
          refinanceVideo.style.transform = ''
        }
      }
      BEATS.forEach((name) => {
        const [inFrom, inTo, outFrom, outTo] = COPY_CUES[name]
        const arrived = ease(span(x, inFrom, inTo))
        const left = ease(span(x, outFrom, outTo))
        fade(copyRefs.current[name] ?? null, arrived * (1 - left), (1 - arrived - left) * COPY_LIFT)
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
        // Hold the measured street frame so the zoom stays on that avenue.
        const lockStreet = onStreet && skylineVideo !== null
        if (lockStreet && Math.abs(skylineVideo.currentTime - STREET_FRAME) > 0.08) {
          skylineVideo.currentTime = STREET_FRAME
          following = true
        }
        setPlaying(skylineVideo, !lockStreet && !cityCovered)
        houseVideos.forEach(holdFrame)
        // Clips start a little before they are seen so the first frame is ready.
        setPlaying(refinanceVideo, x > AT.garage[0] - 0.3 && loansIn < 1)
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
      if (still) videos.forEach((video) => video && !houseVideos.includes(video) && showStill(video))
      void document.fonts.ready.then(() => mounted && settle())
      const resize = new ResizeObserver(settle)
      resize.observe(stage)
      const watch = new IntersectionObserver((entries) => {
        const onScreen = entries.some((entry) => entry.isIntersecting)
        videos.forEach((video) => {
          if (houseVideos.includes(video)) holdFrame(video)
          else setPlaying(video, onScreen && !still)
        })
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

      {beat !== 'refinance' ? (
        <div ref={skylineRef} className="absolute inset-0">
          <video
            ref={skylineVideoRef}
            className={VIDEO}
            src={HERO_VIDEO}
            autoPlay={!beat}
            loop
            muted
            playsInline
            preload={beat ? 'metadata' : 'auto'}
            aria-hidden="true"
          />
        </div>
      ) : null}

      {has('purchase') ? <div ref={glowRef} className="story-glow" aria-hidden="true" /> : null}

      {has('purchase') ? (
        <div
          ref={houseRef}
          className="pointer-events-none absolute inset-0"
          role="img"
          aria-label="A two-story house with a gabled roof and a double garage, seen from the front"
        >
          {/* The outer layer carries the thin edge, this one the size and place, and the inner one the cutout. */}
          <div ref={houseMoveRef} className="absolute inset-0">
            {/* The rest of the frame: the sky and driveway that spread out around the building as it arrives. */}
            {beat ? null : (
              <video
                ref={daylightVideoRef}
                className={`${VIDEO} story-daylight`}
                src={CLIPS.purchase}
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            )}
            <div ref={houseCutRef} className="absolute inset-0 overflow-hidden">
              <video
                ref={purchaseVideoRef}
                className={VIDEO}
                src={CLIPS.purchase}
                loop
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      ) : null}

      {has('refinance') || has('loans') ? (
        <div ref={tideRef} className="absolute inset-0">
          {has('refinance') ? (
            <video
              ref={refinanceVideoRef}
              className={VIDEO}
              src={CLIPS.refinance}
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
              src={CLIPS.loans}
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

      {has('purchase') ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[9vh] md:px-12 lg:bottom-[18%] lg:flex lg:items-center lg:px-16 lg:pt-0">
          <div ref={copyRef('purchase')} data-at={SETTLED.purchase} className="hero-copy story-scrim pointer-events-auto max-w-md">
            <BeatCopy
              beat="purchase"
              title="Buy a home."
              accent="Start with the qualifier."
              body="Shop purchase options and use the home purchase qualifier to see what you qualify for."
            >
              <a href={site.purchaseQualifier} className={PRIMARY}>
                Purchase qualifier
              </a>
              <Link to="/purchase" className={SECONDARY}>
                More on buying →
              </Link>
            </BeatCopy>
          </div>
        </div>
      ) : null}

      {has('refinance') ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 md:px-12 md:pb-12 lg:px-16 lg:pb-16">
          <div
            ref={copyRef('refinance')}
            data-at={SETTLED.refinance}
            className="story-card pointer-events-auto max-w-lg rounded-[28px] p-7 md:p-9"
          >
            <BeatCopy
              beat="refinance"
              title="Refinance"
              accent="the home you have."
              body="Check whether a refinance fits, then review the numbers with the refinance rate checker."
            >
              <a href={site.refinanceChecker} className={PRIMARY}>
                Refinance checker
              </a>
              <Link to="/refinance" className={SECONDARY}>
                More on refinancing →
              </Link>
            </BeatCopy>
          </div>
        </div>
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
 * scrolling drops onto its headlight avenue, runs down it to the house at the far end (purchase),
 * goes through the garage into the room (refinance), parts the view into five blocks (loan options),
 * and turns the street lights into the free tools.
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
