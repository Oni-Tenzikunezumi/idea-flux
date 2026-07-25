<script setup lang="ts">
import type { IdeaEdge, IdeaNode } from '../composables/useIdeaSpace'
import { layoutIdeaSpace } from '../utils/idea-layout'

const props = defineProps<{
  nodes: IdeaNode[]
  edges: IdeaEdge[]
  focusedNodeId: string
  maxVisibleCells: number
  isBusy?: boolean
}>()

const emit = defineEmits<{
  focus: [nodeId: string]
}>()

const viewport = ref<HTMLElement | null>(null)
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const isDragging = ref(false)
const dragState = {
  pointerId: -1,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
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

function resetToTheme() {
  panX.value = 0
  panY.value = 0
  zoom.value = 1
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

function handlePointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.closest('button, input, textarea, form')) return

  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.originX = panX.value
  dragState.originY = panY.value
  isDragging.value = true
  viewport.value?.setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragState.pointerId) return
  panX.value = dragState.originX + event.clientX - dragState.startX
  panY.value = dragState.originY + event.clientY - dragState.startY
}

function handlePointerUp(event: PointerEvent) {
  if (event.pointerId !== dragState.pointerId) return
  isDragging.value = false
  viewport.value?.releasePointerCapture(event.pointerId)
  dragState.pointerId = -1
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
    <div
      class="absolute top-4 left-4 z-30 flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/70 p-1 text-xs font-bold text-slate-200 select-none backdrop-blur"
      @pointerdown.stop
    >
      <button
        type="button"
        class="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
        draggable="false"
        @click="resetToTheme"
      >
        テーマに戻る
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
          @focus="emit('focus', $event)"
          @center="centerNodeAtDefaultZoom"
        />
      </div>
    </div>

    <div class="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-xs text-slate-400 backdrop-blur">
      {{ nodes.length }} / {{ maxVisibleCells }} cells · ホイールで拡大縮小
    </div>
  </section>
</template>
