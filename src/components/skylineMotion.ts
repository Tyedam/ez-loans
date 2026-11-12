/** Shape and easing maths for the homepage skyline story. All coordinates are stage pixels. */

export type Point = readonly [number, number]

export type Tower = { x: number; top: number; width: number; bulge: number }

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const clamp01 = (n: number) => clamp(n, 0, 1)

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

/** How far x has travelled through [from, to], clamped to 0..1. */
export const span = (x: number, from: number, to: number) => clamp01((x - from) / (to - from))

export const ease = (t: number) => t * t * (3 - 2 * t)

const fmt = (n: number) => n.toFixed(1)

const at = ([x, y]: Point) => `${fmt(x)} ${fmt(y)}`

/** The downtown night clip is 1920x1088. The shore sits near the bottom of the frame. */
export const SKYLINE = { width: 1920, height: 1088, waterline: 0.8 }

/** Where the clip's waterline lands in a stage that shows it with object-fit: cover. */
export function waterlineY(width: number, height: number) {
  const shownHeight = SKYLINE.height * Math.max(width / SKYLINE.width, height / SKYLINE.height)
  return height / 2 + (SKYLINE.waterline - 0.5) * shownHeight
}

/** How object-fit: cover lays a clip into the stage. A clip pixel lands at left/top + pixel * scale. */
export type Fit = { scale: number; left: number; top: number }

/** `alignX` and `alignY` are the object-position, as fractions. */
export function coverFit(
  width: number,
  height: number,
  clipWidth: number,
  clipHeight: number,
  alignX = 0.5,
  alignY = 0.5,
): Fit {
  const scale = Math.max(width / clipWidth, height / clipHeight)
  return { scale, left: (width - clipWidth * scale) * alignX, top: (height - clipHeight * scale) * alignY }
}

/** A zoomed and shifted look at a clip. A clip pixel p lands on the stage at x, y + p * scale. */
export type View = { scale: number; x: number; y: number }

/** Where a clip pixel lands on the stage in that view. */
export const project = (view: View, [px, py]: Point): Point => [view.x + px * view.scale, view.y + py * view.scale]

/**
 * The view part of the way from one to another. It zooms at an even rate about the one clip pixel
 * that sits at the same place on the stage in both, so the move reads as a single push in.
 */
export function zoomBetween(from: View, to: View, t: number): View {
  const gain = to.scale - from.scale
  if (Math.abs(gain) < 1e-6) return { scale: from.scale, x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }
  const pivotX = (from.x - to.x) / gain
  const pivotY = (from.y - to.y) / gain
  const scale = from.scale * Math.pow(to.scale / from.scale, t)
  return { scale, x: from.x + pivotX * (from.scale - scale), y: from.y + pivotY * (from.scale - scale) }
}

/** The view enlarged by `factor` about a point on the stage, which stays where it is. */
export function zoomAbout(view: View, [cx, cy]: Point, factor: number): View {
  return { scale: view.scale * factor, x: cx + (view.x - cx) * factor, y: cy + (view.y - cy) * factor }
}

/** The two ends of the avenue, in clip pixels. */
export type Avenue = { far: Point; near: Point }

/**
 * The headlight avenue in the downtown clip: the diagonal run of traffic between the towers, left
 * of centre, with the glass tower and its blue light strip on the right. `far` is where the
 * headlights disappear between the towers and `near` is where the avenue meets the cross street
 * above the trees. The drone flies toward it, so both ends are given once a second.
 */
const AVENUE: readonly Avenue[] = [
  { far: [729, 551], near: [872, 799] },
  { far: [722, 547], near: [866, 803] },
  { far: [714, 542], near: [861, 810] },
  { far: [706, 537], near: [855, 817] },
  { far: [697, 530], near: [847, 826] },
  { far: [686, 523], near: [837, 836] },
  { far: [675, 516], near: [826, 849] },
  { far: [666, 509], near: [814, 867] },
  { far: [660, 502], near: [800, 891] },
]

/** Both ends of the avenue at `seconds` into the downtown clip. */
export function avenueAt(seconds: number): Avenue {
  const clock = Math.min(Math.max(seconds, 0), AVENUE.length - 1)
  const from = AVENUE[Math.floor(clock)]
  const to = AVENUE[Math.ceil(clock)]
  const t = clock - Math.floor(clock)
  return {
    far: [lerp(from.far[0], to.far[0], t), lerp(from.far[1], to.far[1], t)],
    near: [lerp(from.near[0], to.near[0], t), lerp(from.near[1], to.near[1], t)],
  }
}

/** A point part of the way down the avenue, from the far end. */
export const along = ({ far, near }: Avenue, t: number): Point => [lerp(far[0], near[0], t), lerp(far[1], near[1], t)]

export const avenueLength = ({ far, near }: Avenue) => Math.hypot(near[0] - far[0], near[1] - far[1])

const WAVE_STEPS = 28
const OVERHANG = 24

/** The river surface from past the left edge to past the right, as two overlapping swells. */
export function waveLine(width: number, level: number, amplitude: number, phase: number): Point[] {
  const k = (Math.PI * 2) / Math.max(360, width * 0.52)
  const line: Point[] = []
  for (let step = 0; step <= WAVE_STEPS; step++) {
    const x = -OVERHANG + (step / WAVE_STEPS) * (width + OVERHANG * 2)
    const swell = 0.62 * Math.sin(x * k + phase) + 0.38 * Math.sin(x * k * 2.3 - phase * 1.4)
    line.push([x, level + amplitude * swell])
  }
  return line
}

/** An open curve through the midpoints of the line, so the surface has no corners. */
export function smoothLine(line: readonly Point[]) {
  let d = `M${at(line[0])}`
  for (let index = 1; index < line.length - 1; index++) {
    const [x, y] = line[index]
    const [nextX, nextY] = line[index + 1]
    d += `Q${at([x, y])} ${at([(x + nextX) / 2, (y + nextY) / 2])}`
  }
  return `${d}L${at(line[line.length - 1])}`
}

/** Everything below the river surface. */
export function waterPath(line: readonly Point[], width: number, height: number) {
  return `${smoothLine(line)}L${fmt(width + OVERHANG)} ${fmt(height + OVERHANG)}L${fmt(-OVERHANG)} ${fmt(height + OVERHANG)}Z`
}

/** Five flat-topped towers, stepped in slightly at the roof the way the downtown blocks are. */
export function towersPath(towers: readonly Tower[], height: number) {
  const floor = fmt(height + 8)
  return towers
    .map(({ x, top, width, bulge }) => {
      const right = x + width
      const inset = Math.min(bulge, width * 0.18)
      return `M${fmt(x)} ${floor}L${fmt(x + inset)} ${fmt(top)}L${fmt(right - inset)} ${fmt(top)}L${fmt(right)} ${floor}Z`
    })
    .join('')
}

const STRIP = 3

/**
 * Paints the clip into the canvas (cover-fitted) in thin rows, each nudged sideways along a moving sine,
 * so it reads as a reflection on the river. `tint` lays night-blue water over it.
 */
export function drawRipple(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  amplitude: number,
  time: number,
  tint: number,
) {
  const { width, height } = context.canvas
  if (!video.videoWidth || video.readyState < 2) return
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
  const sourceWidth = width / scale
  const sourceLeft = (video.videoWidth - sourceWidth) / 2
  const sourceTop = (video.videoHeight - height / scale) / 2

  for (let y = 0; y < height; y += STRIP) {
    // Three swells that never line up, so the rows do not read as one tidy zigzag.
    const drift =
      0.55 * Math.sin(y * 0.21 + time * 3.1) + 0.3 * Math.sin(y * 0.37 - time * 4.3) + 0.15 * Math.sin(y * 0.09 + time * 1.7)
    context.drawImage(
      video,
      sourceLeft,
      sourceTop + y / scale,
      sourceWidth,
      STRIP / scale,
      (drift - 1) * amplitude,
      y,
      width + amplitude * 2,
      STRIP,
    )
  }

  if (tint > 0) {
    context.fillStyle = `rgba(8, 20, 44, ${fmt(tint * 100)}%)`
    context.fillRect(0, 0, width, height)
  }
}
