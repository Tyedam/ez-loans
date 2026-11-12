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
  /** The purchase photo with its edges carried on outward for a photo's width and height on every side, all out of focus. */
  purchaseHaze: '/media/purchase-soft.jpg',
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
  /** Down the avenue to the house standing on it, until the house and its own street are the whole view. */
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
/** The house stands this far down the avenue from its far end, so the headlights run right up to it. */
const ON_ROAD = 0.1
/** How far into the dive the moving clip has been lined up with the still frame. */
const STREET_MATCH = 0.2
/** The part of the dive over which the still frame fades in over the moving clip. */
const STREET_TAKES = [0.1, 0.42] as const
/**
 * The street grows by the house's growth raised to this power. That is slower than the house,
 * so the towers slide past on both sides without the frame turning to mush.
 */
const DRIVE_PUSH = 0.3
/** How soft the street gets, in stage pixels, and the house sizes it goes out of focus between. */
const STREET_BLUR = 7
const STREET_SOFTENS = [0.12, 0.6] as const

/** The purchase photo: a two-story house with a stone porch and a double garage, seen from its lawn. */
const HOUSE_PHOTO = { width: 3200, height: 2133 }

/** The house in that photo, in photo pixels. */
const HOUSE = {
  /**
   * Apex of the tall gable, then clockwise: the porch gable, the dormer, the roof over the garage,
   * down the garage wall, along the threshold and the steps, then back up the porch column.
   */
  outline: [
    [1053, 135],
    [1422, 437],
    [1503, 400],
    [1834, 672],
    [1797, 515],
    [2100, 243],
    [2399, 500],
    [2328, 713],
    [2500, 721],
    [2868, 838],
    [2868, 855],
    [2765, 878],
    [2765, 1456],
    [1750, 1456],
    [1666, 1631],
    [1297, 1631],
    [1297, 1468],
    [1203, 1521],
    [391, 1521],
    [391, 1396],
    [400, 843],
    [306, 781],
  ],
  /** The box around the building, without the lawn or the sky. */
  bounds: { left: 306, top: 135, right: 2868, bottom: 1631 },
  /** How far down the photo the garage threshold is. The house stands on the avenue at this height. */
  threshold: 1456,
  /** The garage door. The room opens here. */
  garage: { left: 1779, top: 1036, right: 2607, bottom: 1451 },
} as const satisfies Record<string, unknown>

/** The house is this fraction of its full size when it first shows at the far end of the avenue. */
const HOUSE_START = 0.06
/** How far through the drive the house reaches full size. The rest clears the last of the night from the corners. */
const HOUSE_ARRIVES = 0.84
/**
 * Down the street only the building shows, cut out along its roofline. Between these sizes its own
 * lawn, driveway and sky spread out from it in a soft-edged oval, so it never has a hard frame.
 */
const HOUSE_HALO = [0.08, 0.6] as const
/**
 * Past the edges of the photo its sky, lawn and driveway carry on out of focus, in a second image
 * that reaches this many photo widths and heights beyond it. The night gives way to that daylight
 * between these sizes, so the house is never a hard shape on the dark.
 */
const HAZE_REACH = 1
const HOUSE_DAYLIGHT = [0.09, 0.3] as const
/** The oval starts inside the building, grows to just past the nearest edges of the photo, then opens to clear every corner. */
const HALO_TIGHT = 1.1
const HALO_FRAMED = 1.12
const HALO_OPEN = 4
/** How bright the daylight photo is while the house is a small building on a night street. */
const HOUSE_DUSK = 0.5
/** The sizes between which the photo comes up to full daylight. */
const HOUSE_DAWN = [0.12, 0.6] as const

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
/** Media the story lays out whole, overhanging the stage: the downtown clip, its still frame and the house photo. */
const WIDE = `${VIDEO} max-w-none`
const PRIMARY =
  'rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand'
const SECONDARY = 'text-sm font-medium text-white underline-offset-4 transition-colors hover:text-brand'

type Box = { left: number; top: number; right: number; bottom: number }

type Oval = { rx: number; ry: number }

type Layout = {
  w: number
  h: number
  river: number
  /** The downtown clip at rest, covering the stage. */
  sky: View
  /** The same clip once the dive has settled on the avenue, and the spot on the stage where the house stands in it. */
  street: { view: View; stand: Point }
  /**
   * The house of the purchase photo, in stage pixels, once it fills the stage. `cutout` is a clip-path
   * along its outline, and `halo` is the oval its surroundings show through on the way in.
   */
  home: {
    /** The foot of the building: the middle of the part in view, at the garage threshold. It rides on the avenue. */
    foot: Point
    cutout: string
    garage: Box
    /** Centre and sizes of the oval, measured from the top left corner of the photo. */
    halo: { x: number; y: number; tight: Oval; framed: Oval; open: Oval }
  }
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
  const skylineRef = useRef<HTMLDivElement>(null)
  const skylineVideoRef = useRef<HTMLVideoElement>(null)
  const avenueStillRef = useRef<HTMLImageElement>(null)
  const houseRef = useRef<HTMLDivElement>(null)
  const houseMoveRef = useRef<HTMLDivElement>(null)
  const houseCutRef = useRef<HTMLDivElement>(null)
  const housePhotoRef = useRef<HTMLImageElement>(null)
  const surroundsRef = useRef<HTMLImageElement>(null)
  const hazeRef = useRef<HTMLImageElement>(null)
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
    const skyline = skylineRef.current
    const house = houseRef.current
    const houseMove = houseMoveRef.current
    const houseCut = houseCutRef.current
    const tideLayer = tideRef.current
    const rail = railRef.current
    const ticks = rail ? Array.from(rail.querySelectorAll('button')) : []
    const grid = gridRef.current
    const skylineVideo = skylineVideoRef.current
    const avenueStill = avenueStillRef.current
    const surrounds = surroundsRef.current
    const haze = hazeRef.current
    const refinanceVideo = refinanceVideoRef.current
    const loansVideo = loansVideoRef.current
    /** The building and its surroundings are the same photo, laid out the same way. */
    const housePhotos = [housePhotoRef.current, surrounds]
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

      // Frame the purchase photo on the house. Centre the building, then slide over as far as it takes to keep the garage door in view.
      const { bounds, garage, threshold } = HOUSE
      const houseScale = Math.max(w / HOUSE_PHOTO.width, h / HOUSE_PHOTO.height)
      const slackX = w - HOUSE_PHOTO.width * houseScale
      const slackY = h - HOUSE_PHOTO.height * houseScale
      const houseLeft = clamp(
        Math.min(w / 2 - ((bounds.left + bounds.right) / 2) * houseScale, w * 0.96 - garage.right * houseScale),
        slackX,
        0,
      )
      // A little sky over the roof, unless that would push the garage threshold off the bottom.
      const houseTop = clamp(
        Math.min(h * 0.05 - bounds.top * houseScale, h * 0.94 - threshold * houseScale),
        slackY,
        0,
      )
      // The photo is laid out whole and overhangs the stage, so the rest of it is there to see while the house is still small.
      const photoWidth = HOUSE_PHOTO.width * houseScale
      const photoHeight = HOUSE_PHOTO.height * houseScale
      housePhotos.forEach((photo) => {
        if (!photo) return
        photo.style.left = `${houseLeft}px`
        photo.style.top = `${houseTop}px`
        photo.style.width = `${photoWidth}px`
        photo.style.height = `${photoHeight}px`
      })
      if (haze) {
        haze.style.left = `${houseLeft - HAZE_REACH * photoWidth}px`
        haze.style.top = `${houseTop - HAZE_REACH * photoHeight}px`
        haze.style.width = `${(1 + 2 * HAZE_REACH) * photoWidth}px`
        haze.style.height = `${(1 + 2 * HAZE_REACH) * photoHeight}px`
      }
      const onStage = ([x, y]: Point): Point => [houseLeft + x * houseScale, houseTop + y * houseScale]
      const [garageLeft, garageTop] = onStage([garage.left, garage.top])
      const [garageRight, garageBottom] = onStage([garage.right, garage.bottom])
      const corners = HOUSE.outline.map((corner) => {
        const [x, y] = onStage(corner)
        return `${x.toFixed(1)}px ${y.toFixed(1)}px`
      })
      // The oval is centred on the building, in the photo's own pixels as laid out.
      const haloX = ((bounds.left + bounds.right) / 2) * houseScale
      const haloY = ((bounds.top + bounds.bottom) / 2) * houseScale
      const home: Layout['home'] = {
        foot: [
          (Math.max(0, houseLeft + bounds.left * houseScale) + Math.min(w, houseLeft + bounds.right * houseScale)) / 2,
          houseTop + threshold * houseScale,
        ],
        cutout: `polygon(${corners.join(',')})`,
        garage: { left: garageLeft, top: garageTop, right: garageRight, bottom: garageBottom },
        halo: {
          x: haloX,
          y: haloY,
          tight: {
            rx: (HALO_TIGHT * (bounds.right - bounds.left) * houseScale) / 2,
            ry: (HALO_TIGHT * (bounds.bottom - bounds.top) * houseScale) / 2,
          },
          framed: {
            rx: HALO_FRAMED * Math.min(haloX, photoWidth - haloX),
            ry: HALO_FRAMED * Math.min(haloY, photoHeight - haloY),
          },
          open: {
            rx: HALO_OPEN * Math.max(haloX, photoWidth - haloX),
            ry: HALO_OPEN * Math.max(haloY, photoHeight - haloY),
          },
        },
      }

      // The street shot. The avenue runs down the stage through the spot where the foot of the house ends up,
      // so the house comes down the line of headlights as it grows.
      const runX = STREET.near[0] - STREET.far[0]
      const runY = STREET.near[1] - STREET.far[1]
      const streetScale = Math.max((STREET_SPAN * h) / runY, skyScale * STREET_ZOOM)
      const horizon = h * STREET_HORIZON
      const farX = clamp(home.foot[0] - ((home.foot[1] - horizon) * runX) / runY, w * 0.14, w * 0.86)
      const streetView: View = {
        scale: streetScale,
        x: clamp(farX - STREET.far[0] * streetScale, w - SKYLINE.width * streetScale, 0),
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

      return { w, h, river, sky, street, home, towers, pills }
    }

    let layout = measure()
    let mounted = true
    /** True while the downtown clip is still playing under the dive, so the shot has to follow the drone. */
    let following = false
    let followed = -1

    if (skylineVideo) skylineVideo.style.transformOrigin = '0 0'
    if (avenueStill) avenueStill.style.transformOrigin = '0 0'
    if (houseMove) houseMove.style.transformOrigin = '0 0'

    /** Shows a layer of the downtown clip through that view. */
    const place = (layer: HTMLElement, view: View) => {
      const { sky } = layout
      layer.style.transform = `translate3d(${(view.x - sky.x).toFixed(1)}px, ${(view.y - sky.y).toFixed(1)}px, 0) scale(${(view.scale / sky.scale).toFixed(4)})`
    }

    /** Draws the story at scroll position x (in screens). */
    const paint = (x: number) => {
      const { w, h, river, sky, street, home } = layout
      const diving = span(x, ...AT.dive)
      const dive = ease(diving)
      const driven = span(x, ...AT.drive)
      const garage = span(x, ...AT.garage)
      const split = span(x, ...AT.split)
      const sink = ease(span(x, ...AT.sink))
      const onStreet = diving > 0 && driven < 1
      const houseStands = driven > 0 && garage < 1
      // The house, and then the room, cover the city. It comes back between the loan towers.
      const cityCovered = driven >= 1 && split <= 0
      // The house doubles in size at an even rate on the way in, the way a building does as you close on it.
      const size = Math.pow(HOUSE_START, 1 - ease(span(driven, 0, HOUSE_ARRIVES)))

      // Opening: the hero copy drifts up and the shot starts down toward the avenue.
      if (hero) {
        const out = ease(span(x, ...AT.heroOut))
        fade(hero, 1 - out)
        hero.style.setProperty('--hero-shift', `${(-Math.min(x, AT.heroOut[1]) * h * 0.7).toFixed(1)}px`)
      }

      // The street. `stand` is the spot on the stage where the house stands on the avenue.
      const clock = skylineVideo ? skylineVideo.currentTime : 0
      let stand = home.foot
      // How far the still frame of the avenue has replaced the moving clip.
      let taken = 0
      if (onStreet) {
        // The dive pushes in until the avenue runs down the stage. The drive keeps pushing, about the spot the house stands on.
        const shot = zoomAbout(
          zoomBetween(sky, street.view, dive),
          street.stand,
          Math.pow(size / HOUSE_START, DRIVE_PUSH),
        )
        stand = project(shot, along(STREET, ON_ROAD))
        const soft = STREET_BLUR * ease(span(size, ...STREET_SOFTENS))
        // The blur is set in the layer's own pixels, before it is enlarged.
        const blur = soft > 0.05 ? `blur(${((soft * sky.scale) / shot.scale).toFixed(2)}px)` : ''

        if (avenueStill && avenueStill.complete && avenueStill.naturalWidth > 0) {
          taken = ease(span(diving, ...STREET_TAKES))
          place(avenueStill, shot)
          avenueStill.style.opacity = taken.toFixed(3)
          avenueStill.style.filter = blur
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
          skylineVideo.style.filter = blur
        }
      } else if (skylineVideo) {
        skylineVideo.style.transform = ''
        skylineVideo.style.filter = ''
      }
      setVisible(avenueStill, taken > 0)
      setVisible(skylineVideo, taken < 1)
      setVisible(skyline, !cityCovered)

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
        let grade = ''
        let spread = 0
        let daylight = 0
        if (driven < 1) {
          // It leaves its spot on the avenue in step with its growth, so the photo and the street open out from the same point.
          const arrived = (size - HOUSE_START) / (1 - HOUSE_START)
          const footX = lerp(stand[0], home.foot[0], arrived)
          const footY = lerp(stand[1], home.foot[1], arrived)
          move = `translate3d(${(footX - size * home.foot[0]).toFixed(1)}px, ${(footY - size * home.foot[1]).toFixed(1)}px, 0) scale(${size.toFixed(4)})`
          cut = home.cutout
          // A daylight photo on a night street: it starts at dusk and comes up to day as it takes the frame.
          const day = ease(span(size, ...HOUSE_DAWN))
          if (day < 1) grade = `brightness(${lerp(HOUSE_DUSK, 1, day).toFixed(3)}) saturate(${lerp(0.8, 1, day).toFixed(3)})`
          spread = ease(span(size, ...HOUSE_HALO))
          daylight = ease(span(size, ...HOUSE_DAYLIGHT))
          const cleared = Math.pow(ease(span(driven, HOUSE_ARRIVES - 0.04, 1)), 2)
          // The out-of-focus daylight reaches as far as its image does, then past the corners of the stage.
          if (haze) haze.style.setProperty('--reach', `${lerp(50, 160, cleared).toFixed(1)}%`)
          if (surrounds && spread > 0) {
            // Its lawn, driveway and sky show through an oval that grows out from the building, then clears the corners.
            const { tight, framed, open } = home.halo
            surrounds.style.setProperty('--halo-rx', `${lerp(lerp(tight.rx, framed.rx, spread), open.rx, cleared).toFixed(1)}px`)
            surrounds.style.setProperty('--halo-ry', `${lerp(lerp(tight.ry, framed.ry, spread), open.ry, cleared).toFixed(1)}px`)
            surrounds.style.setProperty('--halo-x', `${home.halo.x.toFixed(1)}px`)
            surrounds.style.setProperty('--halo-y', `${home.halo.y.toFixed(1)}px`)
          }
        } else if (garage > 0) {
          // Through the garage: the doorway grows to the edges of the stage and takes the house with it.
          const scaleX = (opening.right - opening.left) / (door.right - door.left)
          const scaleY = (opening.bottom - opening.top) / (door.bottom - door.top)
          move = `translate3d(${(opening.left - scaleX * door.left).toFixed(1)}px, ${(opening.top - scaleY * door.top).toFixed(1)}px, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`
        }
        house.style.opacity = ease(span(driven, 0, 0.08)).toFixed(3)
        house.style.filter = grade
        houseMove.style.transform = move
        houseCut.style.clipPath = cut
        setVisible(surrounds, spread > 0)
        setVisible(haze, daylight > 0)
        if (haze) haze.style.opacity = daylight.toFixed(3)
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
        // The drone keeps flying into the start of the dive, then holds where it is while the still frame takes over.
        const flying = !onStreet || diving < STREET_TAKES[0]
        following = onStreet && flying
        setPlaying(skylineVideo, flying && !cityCovered)
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
        <div
          ref={houseRef}
          className="pointer-events-none absolute inset-0"
          role="img"
          aria-label="A two-story suburban house with a stone front porch, a double garage, a driveway and a front lawn"
        >
          {/* This layer carries the size and the place. The innermost one carries the cutout. */}
          <div ref={houseMoveRef} className="absolute inset-0">
            {/* The photo's sky, lawn and driveway carried on past its edges, out of focus. The night street gives way to this first. */}
            {beat ? null : <img ref={hazeRef} className={`${WIDE} story-haze`} src={MEDIA.purchaseHaze} alt="" aria-hidden="true" />}
            {/* The rest of the photo: the lawn, driveway, neighbours and sky that spread out around the building as it arrives. */}
            {beat ? null : (
              <img ref={surroundsRef} className={`${WIDE} story-daylight`} src={MEDIA.purchase} alt="" aria-hidden="true" />
            )}
            <div ref={houseCutRef} className="absolute inset-0">
              <img ref={housePhotoRef} className={WIDE} src={MEDIA.purchase} alt="" aria-hidden="true" />
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

      {has('purchase') ? (
        // Down on the lawn and the driveway, so the roof, the porch and the garage door stay in view.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-6 md:px-12 md:pb-12 lg:px-16 lg:pb-16">
          <div
            ref={copyRef('purchase')}
            data-at={SETTLED.purchase}
            className="story-card pointer-events-auto max-w-lg rounded-[28px] p-5 md:p-9"
          >
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
