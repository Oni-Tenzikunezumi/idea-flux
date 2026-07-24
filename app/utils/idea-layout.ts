import type { IdeaEdge, IdeaNode, IdeaNodeKind } from '../composables/useIdeaSpace'

export const BUBBLE_MIN_GAP = 18
export const ANGLE_STEP_DEGREES = 18
export const RADIUS_STEP = 72
export const MAX_LAYOUT_ATTEMPTS = 24

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

function getBubbleRadius(node: IdeaNode, _isFocused: boolean): number {
  if (node.kind === 'root') return 76
  return node.label.length > 18 ? 72 : 68
}

function overlaps(
  candidate: PositionedIdeaNode,
  positioned: PositionedIdeaNode[],
): boolean {
  return positioned.some((node) => {
    const distance = Math.hypot(candidate.x - node.x, candidate.y - node.y)
    return distance < candidate.radius + node.radius + BUBBLE_MIN_GAP
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
    ) < candidate.radius + BUBBLE_MIN_GAP
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
    ) < node.radius + BUBBLE_MIN_GAP
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
    radius: getBubbleRadius(rootNode, rootNode.id === focusedNodeId),
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
    const spread = isRootChild ? Math.PI * 2 : Math.PI * 1.35
    const startAngle = isRootChild
      ? -Math.PI / 2
      : parent.angle - spread / 2
    const baseAngle = siblings.length === 1
      ? (isRootChild ? -Math.PI / 2 : parent.angle)
      : startAngle + spread * siblingIndex / (siblings.length - (isRootChild ? 0 : 1))
    const baseRadius = kindRadius[node.kind]
    const bubbleRadius = getBubbleRadius(node, node.id === focusedNodeId)
    let candidate: PositionedIdeaNode | null = null

    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      const direction = attempt % 2 === 0 ? 1 : -1
      const rotationStep = Math.ceil(attempt / 2)
      const angle
        = baseAngle
          + direction * rotationStep * (ANGLE_STEP_DEGREES * Math.PI / 180)
      const radius = baseRadius + Math.floor(attempt / 10) * RADIUS_STEP
      const proposed: PositionedIdeaNode = {
        ...node,
        x: parent.x + Math.cos(angle) * radius,
        y: parent.y + Math.sin(angle) * radius,
        radius: bubbleRadius,
        angle,
        isFocused: node.id === focusedNodeId,
      }

      if (
        !overlaps(proposed, positioned)
        && !overlapsExistingEdge(proposed, positioned, edges)
        && !edgeCrossesExistingNode(parent, proposed, positioned)
      ) {
        candidate = proposed
        break
      }
    }

    positioned.push(candidate ?? {
      ...node,
      x: parent.x + Math.cos(baseAngle) * (baseRadius + RADIUS_STEP * 3),
      y: parent.y + Math.sin(baseAngle) * (baseRadius + RADIUS_STEP * 3),
      radius: bubbleRadius,
      angle: baseAngle,
      isFocused: node.id === focusedNodeId,
    })
  }

  return positioned
}
