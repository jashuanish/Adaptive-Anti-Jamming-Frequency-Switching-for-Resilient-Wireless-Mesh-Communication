import * as THREE from 'three'

/** Backend node coords are 0-100 on an XY plane. Map to a centered XZ ground field. */
export function toWorld(node, y = 0) {
  return new THREE.Vector3((node.x - 50) / 3.6, y, (node.y - 50) / 3.6)
}

/** Build an array of THREE.Vector3 for a path of node ids. */
export function pathPoints(ids, nodes, y = 0) {
  if (!ids || !nodes) return []
  return ids.filter((id) => nodes[id]).map((id) => toWorld(nodes[id], y))
}

/** Sample a point at arc-length parameter t (0-1) along a polyline of Vector3. */
export function samplePolyline(points, t, out = new THREE.Vector3()) {
  if (points.length === 0) return out
  if (points.length === 1) return out.copy(points[0])

  // total length + segment lengths
  let total = 0
  const segs = []
  for (let i = 0; i < points.length - 1; i++) {
    const d = points[i].distanceTo(points[i + 1])
    segs.push(d)
    total += d
  }
  let target = THREE.MathUtils.clamp(t, 0, 1) * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const local = segs[i] === 0 ? 0 : target / segs[i]
      return out.copy(points[i]).lerp(points[i + 1], local)
    }
    target -= segs[i]
  }
  return out.copy(points[points.length - 1])
}

export const COLORS = {
  comms: new THREE.Color('#1d9bf0'),
  cyan: new THREE.Color('#22d3ee'),
  sender: new THREE.Color('#22e0a1'),
  receiver: new THREE.Color('#4db8ff'),
  relay: new THREE.Color('#2b3f57'),
  threat: new THREE.Color('#ff2d55'),
  warning: new THREE.Color('#ff9f1c'),
  data: new THREE.Color('#e8f4ff'),
}
