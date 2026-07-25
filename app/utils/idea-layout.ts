import type { IdeaEdge, IdeaNode, IdeaNodeKind } from '../composables/useIdeaSpace'

export const CELL_MIN_GAP = 18
export const BRANCH_MIN_GAP = 22
export const ANGLE_STEP_DEGREES = 18
export const RADIUS_STEP = 72
export const MAX_LAYOUT_ATTEMPTS = 48

export interface PositionedIdeaNode extends IdeaNode {
  x: number
  y: number
  radius: number
  angle: number
  isFocused: boolean
}

const kindRadius: Record<IdeaNodeKind, number> = {
  root: 230,
  direct: 220,
  custom: 240,
  distant: 270,
  alternative: 310,
}

interface Point {
  x: number
  y: number
}

function getCellRadius(node: IdeaNode, _isFocused: boolean): number {
  if (node.kind === 'root') return 76
  return node.label.length > 18 ? 72 : 68
}

function overlaps(
  candidate: PositionedIdeaNode,
  positioned: PositionedIdeaNode[],
): boolean {
  return positioned.some((node) => {
    const distance = Math.hypot(candidate.x - node.x, candidate.y - node.y)
    return distance < candidate.radius + node.radius + CELL_MIN_GAP
  })
}

function distanceToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const segmentX = endX - startX
  const segmentY = endY - startY
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2

  if (segmentLengthSquared === 0) {
    return Math.hypot(pointX - startX, pointY - startY)
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((pointX - startX) * segmentX + (pointY - startY) * segmentY)
      / segmentLengthSquared,
    ),
  )
  const closestX = startX + projection * segmentX
  const closestY = startY + projection * segmentY
  return Math.hypot(pointX - closestX, pointY - closestY)
}

function overlapsExistingEdge(
  candidate: PositionedIdeaNode,
  positioned: PositionedIdeaNode[],
  edges: IdeaEdge[],
): boolean {
  const nodeMap = new Map(positioned.map(node => [node.id, node]))

  return edges.some((edge) => {
    const start = nodeMap.get(edge.fromNodeId)
    const end = nodeMap.get(edge.toNodeId)
    if (!start || !end) return false

    return distanceToSegment(
      candidate.x,
      candidate.y,
      start.x,
      start.y,
      end.x,
      end.y,
    ) < candidate.radius + CELL_MIN_GAP
  })
}

function edgeCrossesExistingNode(
  parent: PositionedIdeaNode,
  candidate: PositionedIdeaNode,
  positioned: PositionedIdeaNode[],
): boolean {
  return positioned.some((node) => {
    if (node.id === parent.id) return false

    return distanceToSegment(
      node.x,
      node.y,
      parent.x,
      parent.y,
      candidate.x,
      candidate.y,
    ) < node.radius + BRANCH_MIN_GAP
  })
}

function crossProduct(origin: Point, first: Point, second: Point): number {
  return (
    (first.x - origin.x) * (second.y - origin.y)
    - (first.y - origin.y) * (second.x - origin.x)
  )
}

function isPointOnSegment(point: Point, start: Point, end: Point): boolean {
  const epsilon = 0.000001
  return (
    Math.abs(crossProduct(start, end, point)) <= epsilon
    && point.x >= Math.min(start.x, end.x) - epsilon
    && point.x <= Math.max(start.x, end.x) + epsilon
    && point.y >= Math.min(start.y, end.y) - epsilon
    && point.y <= Math.max(start.y, end.y) + epsilon
  )
}

function branchesCross(aFrom: Point, aTo: Point, bFrom: Point, bTo: Point): boolean {
  const aStart = crossProduct(aFrom, aTo, bFrom)
  const aEnd = crossProduct(aFrom, aTo, bTo)
  const bStart = crossProduct(bFrom, bTo, aFrom)
  const bEnd = crossProduct(bFrom, bTo, aTo)
  const epsilon = 0.000001

  if (
    ((aStart > epsilon && aEnd < -epsilon) || (aStart < -epsilon && aEnd > epsilon))
    && ((bStart > epsilon && bEnd < -epsilon) || (bStart < -epsilon && bEnd > epsilon))
  ) {
    return true
  }

  return (
    (Math.abs(aStart) <= epsilon && isPointOnSegment(bFrom, aFrom, aTo))
    || (Math.abs(aEnd) <= epsilon && isPointOnSegment(bTo, aFrom, aTo))
    || (Math.abs(bStart) <= epsilon && isPointOnSegment(aFrom, bFrom, bTo))
    || (Math.abs(bEnd) <= epsilon && isPointOnSegment(aTo, bFrom, bTo))
  )
}

function branchCrossesExistingBranch(
  parent: PositionedIdeaNode,
  candidate: PositionedIdeaNode,
  positioned: PositionedIdeaNode[],
  edges: IdeaEdge[],
): boolean {
  const nodeMap = new Map(positioned.map(node => [node.id, node]))

  return edges.some((edge) => {
    if (edge.fromNodeId === parent.id || edge.toNodeId === parent.id) return false

    const start = nodeMap.get(edge.fromNodeId)
    const end = nodeMap.get(edge.toNodeId)
    if (!start || !end) return false

    return branchesCross(parent, candidate, start, end)
  })
}

export function layoutIdeaSpace(
  nodes: IdeaNode[],
  edges: IdeaEdge[],
  focusedNodeId: string,
): PositionedIdeaNode[] {
  const rootNode = nodes.find(node => node.parentId === null)
  if (!rootNode) return []

  const positioned: PositionedIdeaNode[] = [{
    ...rootNode,
    x: 0,
    y: 0,
    radius: getCellRadius(rootNode, rootNode.id === focusedNodeId),
    angle: 0,
    isFocused: rootNode.id === focusedNodeId,
  }]

  const remainingNodes = nodes
    .filter(node => node.id !== rootNode.id)
    .sort((left, right) => {
      if (left.depth !== right.depth) return left.depth - right.depth
      if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt
      return left.id.localeCompare(right.id)
    })

  for (const node of remainingNodes) {
    const parent = positioned.find(item => item.id === node.parentId)
    if (!parent) continue

    const siblings = nodes
      .filter(item => item.parentId === node.parentId)
      .sort((left, right) =>
        left.createdAt !== right.createdAt
          ? left.createdAt - right.createdAt
          : left.id.localeCompare(right.id),
      )
    const siblingIndex = siblings.findIndex(item => item.id === node.id)
    const isRootChild = parent.parentId === null
    const spread = isRootChild ? Math.PI * 2 : Math.PI * 0.7
    const startAngle = isRootChild
      ? -Math.PI / 2
      : parent.angle - spread / 2
    const baseAngle = siblings.length === 1
      ? (isRootChild ? -Math.PI / 2 : parent.angle)
      : startAngle + spread * siblingIndex / (siblings.length - (isRootChild ? 0 : 1))
    const depthSpacing = Math.max(0, node.depth - 1) * RADIUS_STEP
    const baseRadius = kindRadius[node.kind] + depthSpacing
    const cellRadius = getCellRadius(node, node.id === focusedNodeId)
    let candidate: PositionedIdeaNode | null = null
    let lastResortCandidate: PositionedIdeaNode | null = null

    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      const direction = attempt % 2 === 0 ? 1 : -1
      const rotationStep = Math.ceil(attempt / 2)
      const angle
        = baseAngle
          + direction * rotationStep * (ANGLE_STEP_DEGREES * Math.PI / 180)
      const radius = baseRadius + Math.floor(attempt / 8) * RADIUS_STEP
      const proposed: PositionedIdeaNode = {
        ...node,
        x: parent.x + Math.cos(angle) * radius,
        y: parent.y + Math.sin(angle) * radius,
        radius: cellRadius,
        angle,
        isFocused: node.id === focusedNodeId,
      }

      const violatesCellSpacing = overlaps(proposed, positioned)
      const cellOverlapsBranch = overlapsExistingEdge(proposed, positioned, edges)
      const branchPassesCell = edgeCrossesExistingNode(parent, proposed, positioned)
      const crossesBranch = branchCrossesExistingBranch(
        parent,
        proposed,
        positioned,
        edges,
      )

      if (!violatesCellSpacing && !cellOverlapsBranch && !branchPassesCell) {
        lastResortCandidate = proposed
      }

      if (
        !violatesCellSpacing
        && !cellOverlapsBranch
        && !branchPassesCell
        && !crossesBranch
      ) {
        candidate = proposed
        break
      }
    }

    positioned.push(candidate ?? lastResortCandidate ?? {
      ...node,
      x: parent.x + Math.cos(baseAngle) * (baseRadius + RADIUS_STEP * 3),
      y: parent.y + Math.sin(baseAngle) * (baseRadius + RADIUS_STEP * 3),
      radius: cellRadius,
      angle: baseAngle,
      isFocused: node.id === focusedNodeId,
    })
  }

  return positioned
}
