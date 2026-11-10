import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Hero, HERO_VIDEO } from './Hero'
import { SiteLink } from './SiteLink'
import {
  boundsOf,
  doorRect,
  ease,
  housePoints,
  openingPoints,
  lerp,
  roundedPath,
  smoothLine,
  span,
  towersPath,
  waterlineY,
  waterPath,
  waveLine,
  type HouseBox,
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
  heroOut: [0.1, 0.8],
  house: [0.5, 1.55],
  purchaseClip: [1, 1.55],
  tide: [2.15, 3.2],
  split: [3.7, 4.6],
  towerLabels: [4.25, 4.6],
  towerLabelsOut: [5.25, 5.45],
  sink: [5.3, 5.75],
  lightsOn: [5.65, 5.87],
  lightsOpen: [5.91, 6.25],
  railIn: [0.6, 1],
} as const satisfies Record<string, readonly [number, number]>

const END = 6.85

/** Where each beat sits still. Reduced motion and short screens show these and nothing in between. */
const SETTLED: Record<Beat, number> = { purchase: 1.9, refinance: 3.45, loans: 5, tools: 6.65 }

/** Fade in from, fade in to, fade out from, fade out to. */
type Cue = readonly [number, number, number, number]

const COPY_CUES: Record<Beat, Cue> = {
  purchase: [1.15, 1.6, 2.15, 2.4],
  refinance: [2.85, 3.25, 3.7, 3.95],
  loans: [4.15, 4.55, 5.25, 5.5],
  tools: [5.6, 5.95, END, END + 1],
}

/** The outer columns peel away first and the middle one, the tallest, lands last. */
const TOWER_DELAYS = [0, 0.15, 0.3, 0.15, 0]
const TOWER_HEIGHTS = [0.44, 0.5, 0.56, 0.5, 0.44]
const TOWER_LABEL_STAGGER = 0.04
const LIGHT_STAGGER = 0.035
const LIGHT_DOT = 12
const COPY_LIFT = 28

const STATIC_QUERY = '(prefers-reduced-motion: reduce), (max-height: 619px)'

const VIDEO = 'absolute inset-0 h-full w-full object-cover'
const PRIMARY =
  'rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand'
const SECONDARY = 'text-sm font-medium text-white underline-offset-4 transition-colors hover:text-brand'

type Layout = {
  w: number
  h: number
  river: number
  band: number
  house: HouseBox
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
  const glowRef = useRef<HTMLDivElement>(null)
  const skylineRef = useRef<HTMLDivElement>(null)
  const skylineVideoRef = useRef<HTMLVideoElement>(null)
  const houseRef = useRef<HTMLDivElement>(null)
  const purchaseVideoRef = useRef<HTMLVideoElement>(null)
  const tideRef = useRef<HTMLDivElement>(null)
  const refinanceVideoRef = useRef<HTMLVideoElement>(null)
  const loansVideoRef = useRef<HTMLVideoElement>(null)
  const crestRef = useRef<SVGSVGElement>(null)
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
    const tideLayer = tideRef.current
    const crest = crestRef.current
    const crestPaths = crest ? Array.from(crest.querySelectorAll('path')) : []
    const rail = railRef.current
    const ticks = rail ? Array.from(rail.querySelectorAll('button')) : []
    const grid = gridRef.current
    const skylineVideo = skylineVideoRef.current
    const purchaseVideo = purchaseVideoRef.current
    const refinanceVideo = refinanceVideoRef.current
    const loansVideo = loansVideoRef.current
    const videos = [skylineVideo, purchaseVideo, refinanceVideo, loansVideo]

    const measure = (): Layout => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      const wide = w >= 1024
      const river = waterlineY(w, h)

      // The house stands on the right on wide screens and under the copy on narrow ones.
      const band = h * (wide ? 0.82 : 0.87)
      const size = wide ? Math.min(h * 0.5, w * 0.36) : Math.min(h * 0.33, w * 0.8)
      const houseBox = { left: w * (wide ? 0.71 : 0.5) - size / 2, top: band - h * 0.045 - size, size }

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

      return { w, h, river, band, house: houseBox, towers, pills }
    }

    let layout = measure()
    let mounted = true

    /** Draws the story at scroll position x (in screens). Returns true while something on screen moves on its own. */
    const paint = (x: number, time: number) => {
      const { w, h, river, band } = layout
      const morph = ease(span(x, ...AT.house))
      const tide = span(x, ...AT.tide)
      const split = span(x, ...AT.split)
      const sink = ease(span(x, ...AT.sink))

      // Opening: the hero copy drifts up off the skyline, which stays where it is.
      if (hero) {
        const out = ease(span(x, ...AT.heroOut))
        fade(hero, 1 - out)
        hero.style.setProperty('--hero-shift', `${(-Math.min(x, AT.heroOut[1]) * h * 0.7).toFixed(1)}px`)
      }

      // The river stays a low band under the house. Refinance is a walk through the door, not a rising tide.
      const swell = h * 0.006 * ease(span(morph, 0.4, 1)) * (1 - ease(tide))
      const surface = waveLine(w, band, swell, time * 1.1)
      const water = waterPath(surface, w, h)

      // Beat 1: the frame folds into a house, and the purchase clip takes over inside it.
      const corners = housePoints(w, h, layout.house, morph)
      const radius = morph * layout.house.size * 0.035
      const houseStands = morph > 0 && tide < 0.96
      const entered = ease(span(tide, 0.28, 0.72))

      if (skyline) {
        const covered = tide >= 1 && split <= 0
        setVisible(skyline, !covered)
        skyline.style.clipPath =
          morph <= 0 || tide >= 1 ? 'none' : `path("${houseStands ? roundedPath(corners, radius) : ''}${water}")`
      }

      if (glow) {
        const center = boundsOf(corners)
        glow.style.opacity = (morph * (1 - ease(span(tide, 0.2, 0.8)))).toFixed(3)
        glow.style.setProperty('--glow-x', `${(center.left + center.width / 2).toFixed(0)}px`)
        glow.style.setProperty('--glow-y', `${(center.top + center.height / 2).toFixed(0)}px`)
      }

      if (house) {
        const inside = ease(span(x, ...AT.purchaseClip))
        const shown = inside > 0 && houseStands
        setVisible(house, shown)
        if (shown) {
          // The clip is fitted to the house's own box so the home in it stays framed as the box shrinks.
          const box = boundsOf(corners)
          const local = corners.map(([px, py]): Point => [px - box.left, py - box.top])
          house.style.left = `${box.left.toFixed(1)}px`
          house.style.top = `${box.top.toFixed(1)}px`
          house.style.width = `${box.width.toFixed(1)}px`
          house.style.height = `${box.height.toFixed(1)}px`
          house.style.clipPath = `path("${roundedPath(local, radius)}")`
          house.style.opacity = (inside * (1 - entered)).toFixed(3)
        }
      }

      // Beat 2: the interior opens in the doorway and grows until you are standing in the room.
      // Beat 3: that frame splits into five towers, one per loan, which later sink back into the river.
      const loansIn = ease(span(split, 0.2, 0.75))
      const door = doorRect(layout.house)
      if (tideLayer) {
        const shown = tide > 0 && sink < 1
        setVisible(tideLayer, shown)
        if (shown && tide < 1) {
          // First the room fills the doorway, then the whole house, then the frame.
          const t = ease(tide)
          const within = ease(span(t, 0, 0.55))
          const beyond = ease(span(t, 0.5, 1))
          const open = openingPoints(w, h, layout.house, within, beyond)
          const round = layout.house.size * 0.035 * (1 - beyond)
          tideLayer.style.clipPath = `path("${roundedPath(open, round)}")`
          tideLayer.style.opacity = ease(span(tide, 0, 0.08)).toFixed(3)
        } else if (shown && split <= 0) {
          tideLayer.style.clipPath = 'none'
          tideLayer.style.opacity = '1'
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
          tideLayer.style.opacity = '1'
          if (loansVideo) {
            // The loans clip is fitted to the towers, so the house in it stays in their windows as they settle.
            const roof = Math.max(0, Math.min(...columns.map((column) => column.top - column.bulge)))
            loansVideo.style.top = `${roof.toFixed(1)}px`
            loansVideo.style.height = `${Math.max(0, h - roof).toFixed(1)}px`
          }
        }
      }
      if (loansVideo) loansVideo.style.opacity = loansIn.toFixed(3)
      setVisible(refinanceVideo, loansIn < 1)
      if (refinanceVideo) {
        if (tide > 0 && tide < 1) {
          // The room's center starts in the doorway, then settles to fill the frame as you step through.
          const through = ease(span(ease(tide), 0.35, 1))
          const zoom = lerp(1.55, 1, through)
          const shiftX = lerp((door.left + door.right) / 2 - w / 2, 0, through)
          const shiftY = lerp((door.top + door.bottom) / 2 - h / 2, 0, through)
          refinanceVideo.style.transformOrigin = 'center center'
          refinanceVideo.style.transform = `translate(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px) scale(${zoom.toFixed(3)})`
        } else {
          refinanceVideo.style.transform = ''
          refinanceVideo.style.transformOrigin = ''
        }
      }
      if (crest) {
        const glint = 0.5 * ease(span(morph, 0.6, 1)) * (1 - ease(tide))
        crest.style.opacity = glint.toFixed(3)
        if (glint > 0) {
          const d = smoothLine(surface)
          crestPaths.forEach((path) => path.setAttribute('d', d))
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

      // Beat 4: eight lights come on along the waterline, then each drifts down and opens into a tool.
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

      if (!beat) {
        // Clips start a little before they are seen so the first frame is ready.
        setPlaying(skylineVideo, tide < 1 || split > 0)
        setPlaying(purchaseVideo, x > AT.house[0] && houseStands)
        setPlaying(refinanceVideo, x > SETTLED.purchase - 0.2 && loansIn < 1)
        setPlaying(loansVideo, x > SETTLED.refinance - 0.15 && sink < 1)
      }

      return morph > 0 && tide < 1
    }

    if (beat) {
      // One settled beat in the normal flow of the page. Its clips play only while it is on screen.
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const settle = () => {
        layout = measure()
        paint(SETTLED[beat], 0)
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
    let moving = false

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick)
      const target = Math.min(END, Math.max(0, -track.getBoundingClientRect().top / layout.h))
      // Ease toward the scroll position so wheel steps do not show as jumps.
      shown = shown < 0 || Math.abs(target - shown) < 0.0005 ? target : lerp(shown, target, 0.22)
      if (shown === painted && !moving) return
      moving = paint(shown, now / 1000)
      painted = shown
    }
    const repaint = () => {
      layout = measure()
      painted = -1
    }

    paint(Math.min(END, Math.max(0, -track.getBoundingClientRect().top / layout.h)), 0)
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

      {has('purchase') ? <div ref={glowRef} className="story-glow" aria-hidden="true" /> : null}

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

      {has('purchase') ? (
        <div
          ref={houseRef}
          className="absolute overflow-hidden"
          role="img"
          aria-label="A two-story house with a gabled roof, seen from the front"
        >
          <video
            ref={purchaseVideoRef}
            className={VIDEO}
            style={{ objectPosition: 'center 34%' }}
            src={CLIPS.purchase}
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
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
              aria-label="A modern house with a patio and glass doors"
            />
          ) : null}
        </div>
      ) : null}

      {beat ? null : (
        <svg ref={crestRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <path fill="none" stroke="rgba(137, 188, 55, 0.45)" strokeWidth="7" strokeLinecap="round" />
          <path fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {has('purchase') ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[9vh] md:px-12 lg:bottom-[18%] lg:flex lg:items-center lg:px-16 lg:pt-0">
          <div ref={copyRef('purchase')} data-at={SETTLED.purchase} className="pointer-events-auto max-w-md">
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
 * The homepage from the hero down to the free tools. The Detroit riverfront clip stays pinned while
 * scrolling folds it into a house (purchase), walks through its door into the room (refinance), splits it into
 * five towers (loan options), and lights eight river lamps (free tools).
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
