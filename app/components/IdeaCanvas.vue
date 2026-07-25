<script setup lang="ts">
import type {
  IdeaEdge,
  IdeaNode,
  IdeaNodeFocusInput,
  IdeaNodeFocusRequest,
} from '../composables/useIdeaSpace'
import { layoutIdeaSpace } from '../utils/idea-layout'

const props = defineProps<{
  nodes: IdeaNode[]
  edges: IdeaEdge[]
  focusedNodeId: string
  remainingCapacity: number
  isBusy?: boolean
}>()

const emit = defineEmits<{
  focus: [request: IdeaNodeFocusRequest]
}>()

const viewport = ref<HTMLElement | null>(null)
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const isDragging = ref(false)
const activePointers = new Map<number, {
  x: number
  y: number
  startX: number
  startY: number
  input: IdeaNodeFocusInput
  cellId?: string
  canTap: boolean
}>()
const dragState = {
  pointerId: -1,
  originX: 0,
  originY: 0,
}
const pinchState = {
  startDistance: 0,
  startZoom: 1,
  localX: 0,
  localY: 0,
}

const positionedNodes = computed(() =>
  layoutIdeaSpace(props.nodes, props.edges, props.focusedNodeId),
)
const positionedNodeMap = computed(
  () => new Map(positionedNodes.value.map(node => [node.id, node])),
)
const canvasWidth = computed(() => {
  const extent = Math.max(
    0,
    ...positionedNodes.value.map(node => Math.abs(node.x) + node.radius),
  )
  return Math.max(1600, (extent + 240) * 2)
})
const canvasHeight = computed(() => {
  const extent = Math.max(
    0,
    ...positionedNodes.value.map(node => Math.abs(node.y) + node.radius),
  )
  return Math.max(1200, (extent + 240) * 2)
})
const originX = computed(() => canvasWidth.value / 2)
const originY = computed(() => canvasHeight.value / 2)
const ancestorPath = computed(() => {
  const edgeIds = new Set<string>()
  const nodeIds = new Set<string>()
  const nodeMap = new Map(props.nodes.map(node => [node.id, node]))
  let currentId: string | null = props.focusedNodeId

  while (currentId) {
    nodeIds.add(currentId)
    const current = nodeMap.get(currentId)
    if (!current?.parentId) break
    const edge = props.edges.find(
      item =>
        item.fromNodeId === current!.parentId
        && item.toNodeId === current!.id,
    )
    if (edge) edgeIds.add(edge.id)
    currentId = current.parentId
  }

  return { edgeIds, nodeIds }
})
const focusNeighborhood = computed(() => {
  const edgeIds = new Set(ancestorPath.value.edgeIds)
  const nodeIds = new Set(ancestorPath.value.nodeIds)

  for (const edge of props.edges) {
    if (edge.fromNodeId !== props.focusedNodeId) continue
    edgeIds.add(edge.id)
    nodeIds.add(edge.toNodeId)
  }

  return { edgeIds, nodeIds }
})

const MIN_ZOOM = 0.45
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.12
const TAP_MOVE_THRESHOLD = 8

function getInput(event: MouseEvent | PointerEvent): IdeaNodeFocusInput {
  if ('pointerType' in event && event.pointerType === 'touch') return 'touch'
  return event.detail === 0 ? 'keyboard' : 'mouse'
}

async function resetToTheme(event: MouseEvent) {
  const theme = props.nodes.find(node => node.parentId === null)
  if (!theme) return
  emit('focus', { nodeId: theme.id, input: getInput(event) })
  await nextTick()
  centerNodeAtDefaultZoom(theme.id)
}

function setZoom(nextZoom: number, clientX?: number, clientY?: number) {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
  if (next === zoom.value) return

  const rect = viewport.value?.getBoundingClientRect()
  if (rect && clientX !== undefined && clientY !== undefined) {
    const pointerX = clientX - rect.left - rect.width / 2
    const pointerY = clientY - rect.top - rect.height / 2
    const localX = (pointerX - panX.value) / zoom.value
    const localY = (pointerY - panY.value) / zoom.value
    panX.value = pointerX - localX * next
    panY.value = pointerY - localY * next
  }

  zoom.value = next
}

function handleWheel(event: WheelEvent) {
  const direction = event.deltaY > 0 ? -1 : 1
  setZoom(zoom.value + direction * ZOOM_STEP, event.clientX, event.clientY)
}

function centerFocusedNode() {
  const focused = positionedNodeMap.value.get(props.focusedNodeId)
  if (!focused) return
  panX.value = -focused.x * zoom.value
  panY.value = -focused.y * zoom.value
}

function centerNodeAtDefaultZoom(nodeId: string) {
  const node = positionedNodeMap.value.get(nodeId)
  if (!node) return
  zoom.value = 1
  panX.value = -node.x
  panY.value = -node.y
}

function getPointerCenter() {
  const pointers = [...activePointers.values()]
  return {
    x: pointers.reduce((sum, pointer) => sum + pointer.x, 0) / pointers.length,
    y: pointers.reduce((sum, pointer) => sum + pointer.y, 0) / pointers.length,
  }
}

function getPointerDistance() {
  const [first, second] = [...activePointers.values()]
  if (!first || !second) return 0
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function beginSinglePointer(pointerId: number) {
  const pointer = activePointers.get(pointerId)
  if (!pointer) return
  dragState.pointerId = pointerId
  dragState.originX = panX.value
  dragState.originY = panY.value
}

function beginPinch() {
  const rect = viewport.value?.getBoundingClientRect()
  if (!rect) return

  const center = getPointerCenter()
  const pointerX = center.x - rect.left - rect.width / 2
  const pointerY = center.y - rect.top - rect.height / 2
  pinchState.startDistance = getPointerDistance()
  pinchState.startZoom = zoom.value
  pinchState.localX = (pointerX - panX.value) / zoom.value
  pinchState.localY = (pointerY - panY.value) / zoom.value
  for (const pointer of activePointers.values()) {
    pointer.canTap = false
  }
  isDragging.value = true
}

function handlePointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  const cell = target.closest<HTMLElement>('[data-cell-id]')
  if (!cell && target.closest('button, input, textarea, form')) return

  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
    startX: event.clientX,
    startY: event.clientY,
    input: event.pointerType === 'touch' ? 'touch' : 'mouse',
    cellId: cell?.dataset.cellId,
    canTap: true,
  })
  viewport.value?.setPointerCapture(event.pointerId)

  if (activePointers.size === 1) {
    beginSinglePointer(event.pointerId)
  }
  else if (activePointers.size === 2) {
    beginPinch()
  }
}

function handlePointerMove(event: PointerEvent) {
  const pointer = activePointers.get(event.pointerId)
  if (!pointer) return
  pointer.x = event.clientX
  pointer.y = event.clientY

  if (activePointers.size >= 2) {
    const rect = viewport.value?.getBoundingClientRect()
    if (!rect || pinchState.startDistance === 0) return
    const center = getPointerCenter()
    const pointerX = center.x - rect.left - rect.width / 2
    const pointerY = center.y - rect.top - rect.height / 2
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(
        MIN_ZOOM,
        pinchState.startZoom * getPointerDistance() / pinchState.startDistance,
      ),
    )
    zoom.value = nextZoom
    panX.value = pointerX - pinchState.localX * nextZoom
    panY.value = pointerY - pinchState.localY * nextZoom
    return
  }

  if (event.pointerId !== dragState.pointerId) return
  const distance = Math.hypot(
    event.clientX - pointer.startX,
    event.clientY - pointer.startY,
  )
  if (distance <= TAP_MOVE_THRESHOLD && !isDragging.value) return

  pointer.canTap = false
  isDragging.value = true
  panX.value = dragState.originX + event.clientX - pointer.startX
  panY.value = dragState.originY + event.clientY - pointer.startY
}

function handlePointerUp(event: PointerEvent) {
  const pointer = activePointers.get(event.pointerId)
  if (!pointer) return
  const shouldFocus
    = event.type === 'pointerup'
      && pointer.canTap
      && pointer.cellId
      && activePointers.size === 1

  if (viewport.value?.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }
  activePointers.delete(event.pointerId)

  if (shouldFocus) {
    emit('focus', { nodeId: pointer.cellId!, input: pointer.input })
  }

  if (activePointers.size === 1) {
    const [remainingId, remaining] = [...activePointers.entries()][0]!
    remaining.startX = remaining.x
    remaining.startY = remaining.y
    remaining.canTap = false
    beginSinglePointer(remainingId)
  }
  else if (activePointers.size === 0) {
    isDragging.value = false
    dragState.pointerId = -1
    pinchState.startDistance = 0
  }
}

function handleBubbleFocus(nodeId: string, input: IdeaNodeFocusInput) {
  emit('focus', { nodeId, input })
}

watch(
  () => props.nodes.length,
  async () => {
    await nextTick()
    centerFocusedNode()
  },
)

watch(
  () => props.focusedNodeId,
  async () => {
    await nextTick()
    centerFocusedNode()
  },
)
</script>

<template>
  <section
    ref="viewport"
    class="idea-viewport relative h-full min-h-0 overflow-hidden bg-canvas/90"
    :class="{ 'cursor-grabbing': isDragging, 'cursor-grab': !isDragging }"
    :aria-busy="isBusy"
    aria-label="アイデア空間。背景をドラッグして移動できます。"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @wheel.prevent="handleWheel"
  >
    <div class="idea-vignette pointer-events-none absolute inset-0 z-10" />
    <div class="absolute top-4 left-4 z-30 flex flex-col items-start gap-1.5">
      <div
        class="flex items-center gap-1 rounded-full border border-sky-100/30 bg-slate-950/85 p-1 text-xs font-bold text-slate-100 shadow-lg select-none backdrop-blur"
        @pointerdown.stop
      >
        <button
          type="button"
          class="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
          draggable="false"
          @click="resetToTheme"
        >
          テーマへ戻る
        </button>
        <span class="h-5 w-px bg-white/10" aria-hidden="true" />
        <button
          type="button"
          class="grid size-7 place-items-center rounded-full transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
          aria-label="選択中のアイデアへ戻る"
          title="選択中のアイデアへ戻る"
          @click="centerFocusedNode"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
          </svg>
        </button>
        <span class="h-5 w-px bg-white/10" aria-hidden="true" />
        <button
          type="button"
          class="grid size-7 place-items-center rounded-full text-base transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-35"
          :disabled="zoom <= MIN_ZOOM"
          aria-label="縮小"
          @click="setZoom(zoom - ZOOM_STEP)"
        >
          −
        </button>
        <span class="w-10 text-center text-xs text-slate-400">
          {{ Math.round(zoom * 100) }}%
        </span>
        <button
          type="button"
          class="grid size-7 place-items-center rounded-full text-base transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-35"
          :disabled="zoom >= MAX_ZOOM"
          aria-label="拡大"
          @click="setZoom(zoom + ZOOM_STEP)"
        >
          ＋
        </button>
      </div>
      <p class="pointer-events-none px-3 text-xs font-medium text-slate-300">
        追加できるアイデア {{ remainingCapacity }}
      </p>
    </div>

    <div
      class="idea-world absolute top-1/2 left-1/2"
      :class="{ 'idea-world--dragging': isDragging }"
      :style="{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
      }"
    >
      <svg
        class="absolute inset-0 size-full overflow-visible"
        :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
        aria-hidden="true"
      >
        <line
          v-for="edge in edges"
          :key="edge.id"
          :x1="originX + (positionedNodeMap.get(edge.fromNodeId)?.x ?? 0)"
          :y1="originY + (positionedNodeMap.get(edge.fromNodeId)?.y ?? 0)"
          :x2="originX + (positionedNodeMap.get(edge.toNodeId)?.x ?? 0)"
          :y2="originY + (positionedNodeMap.get(edge.toNodeId)?.y ?? 0)"
          :class="[
            'idea-edge',
            {
              'idea-edge--active': ancestorPath.edgeIds.has(edge.id),
              'idea-edge--related':
                !ancestorPath.edgeIds.has(edge.id)
                && focusNeighborhood.edgeIds.has(edge.id),
              'idea-edge--unrelated': !focusNeighborhood.edgeIds.has(edge.id),
            },
          ]"
        />
      </svg>

      <div
        class="absolute"
        :style="{ left: `${originX}px`, top: `${originY}px` }"
      >
        <IdeaBubble
          v-for="node in positionedNodes"
          :key="node.id"
          :node="node"
          :disabled="isBusy"
          :is-path="ancestorPath.nodeIds.has(node.id)"
          :is-related="focusNeighborhood.nodeIds.has(node.id)"
          :is-generating-parent="isBusy && node.id === focusedNodeId"
          @focus="handleBubbleFocus"
          @center="centerNodeAtDefaultZoom"
        />
      </div>
    </div>
  </section>
</template>
