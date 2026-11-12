/** Shape and easing maths for the homepage skyline story. All coordinates are stage pixels. */

export type Point = readonly [number, number]

export type HouseBox = { left: number; top: number; size: number }

export type Tower = { x: number; top: number; width: number; bulge: number }

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

/** How far x has travelled through [from, to], clamped to 0..1. */
export const span = (x: number, from: number, to: number) => clamp01((x - from) / (to - from))

export const ease = (t: number) => t * t * (3 - 2 * t)

const fmt = (n: number) => n.toFixed(1)

const at = ([x, y]: Point) => `${fmt(x)} ${fmt(y)}`

/** The downtown night clip is 1920x1088. The shore sits near the bottom of the frame. */
const SKYLINE = { width: 1920, height: 1088, waterline: 0.8 }

/** Where the clip's waterline lands in a stage that shows it with object-fit: cover. */
export function waterlineY(width: number, height: number) {
  const shownHeight = SKYLINE.height * Math.max(width / SKYLINE.width, height / SKYLINE.height)
  return height / 2 + (SKYLINE.waterline - 0.5) * shownHeight
}

/** The house silhouette on a unit square: apex, then clockwise around the eaves, feet, and doorway. */
const HOUSE: readonly Point[] = [
  [0.5, 0],
  [1, 0.432],
  [1, 1],
  [0.659, 1],
  [0.659, 0.636],
  [0.341, 0.636],
  [0.341, 1],
  [0, 1],
  [0, 0.432],
]

const DOOR_TOP = new Set([4, 5])

/**
 * A tower in the downtown clip, in the same corner order as the house.
 * The roof is flat and the doorway is still shut, so it can fold into the silhouette.
 */
const TOWER_UNIT: readonly Point[] = [
  [0.5, 0],
  [0.84, 0],
  [0.84, 1],
  [0.66, 1],
  [0.66, 1],
  [0.34, 1],
  [0.34, 1],
  [0.16, 1],
  [0.16, 0],
]

/** A solid doorway, then the solid house around it. Five corners, no cutout, so the room can fill it. */
const DOOR_SOLID: readonly Point[] = [
  [0.5, 0.636],
  [0.659, 0.636],
  [0.659, 1],
  [0.341, 1],
  [0.341, 0.636],
]

const HOUSE_SOLID: readonly Point[] = [
  [0.5, 0],
  [1, 0.432],
  [1, 1],
  [0, 1],
  [0, 0.432],
]

const FRAME_SOLID: readonly Point[] = [
  [0.5, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
]

/**
 * The refinance opening. `within` grows it from the doorway to the house.
 * `beyond` carries that house out to the full frame.
 */
export function openingPoints(
  width: number,
  height: number,
  box: HouseBox,
  within: number,
  beyond: number,
): Point[] {
  return HOUSE_SOLID.map(([hx, hy], index) => {
    const [dx, dy] = DOOR_SOLID[index]
    const [fx, fy] = FRAME_SOLID[index]
    const x = lerp(box.left + lerp(dx, hx, within) * box.size, fx * width, beyond)
    const y = lerp(box.top + lerp(dy, hy, within) * box.size, fy * height, beyond)
    return [x, y] as Point
  })
}

/** The doorway cut out of a fully formed house, in stage pixels. */
export function doorRect(box: HouseBox) {
  const [rightX, topY] = HOUSE[4]
  const [leftX] = HOUSE[5]
  return {
    left: box.left + leftX * box.size,
    top: box.top + topY * box.size,
    right: box.left + rightX * box.size,
    bottom: box.top + box.size,
  }
}

/**
 * One tower in `box` folding into the house. The doorway opens once the roof has a peak.
 * The city around the box stays where it is; only this building changes shape.
 */
export function risingHousePoints(box: HouseBox, t: number, doorOpen = ease(span(t, 0.55, 1))): Point[] {
  const feet = box.top + box.size
  const door = (1 - HOUSE[4][1]) * box.size * doorOpen
  return HOUSE.map(([hx, hy], index) => {
    const [tx, ty] = TOWER_UNIT[index]
    const x = box.left + lerp(tx, hx, t) * box.size
    const y = box.top + lerp(ty, hy, t) * box.size
    return [x, DOOR_TOP.has(index) ? feet - door : y] as Point
  })
}

/** A closed path through the points with each corner rounded off by up to `radius`. */
export function roundedPath(points: readonly Point[], radius: number) {
  const count = points.length
  let d = ''
  for (let index = 0; index < count; index++) {
    const corner = points[index]
    const toward = (other: Point): Point => {
      const length = Math.hypot(other[0] - corner[0], other[1] - corner[1])
      if (length === 0) return corner
      const reach = Math.min(radius, length / 2) / length
      return [corner[0] + (other[0] - corner[0]) * reach, corner[1] + (other[1] - corner[1]) * reach]
    }
    const enter = toward(points[(index + count - 1) % count])
    const leave = toward(points[(index + 1) % count])
    d += `${index === 0 ? 'M' : 'L'}${at(enter)}Q${at(corner)} ${at(leave)}`
  }
  return `${d}Z`
}

export function boundsOf(points: readonly Point[]) {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const [x, y] of points) {
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  return { left, top, width: right - left, height: bottom - top }
}

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

/** Everything below the river surface, wound clockwise like the house so the two shapes add up. */
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
