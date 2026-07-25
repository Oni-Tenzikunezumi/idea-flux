<script setup lang="ts">
import type {
  IdeaNodeFocusRequest,
  IdeaNodeKind,
} from './composables/useIdeaSpace'

const {
  initialPrompt,
  manualInput,
  nodes,
  edges,
  focusedNodeId,
  focusedNode,
  errorMessage,
  isGenerating,
  hasSpace,
  remainingCapacity,
  canGenerate,
  canAddManual,
  capacityMessage,
  startSpace,
  generateFromFocusedNode,
  focusNode,
  addManualNode,
} = useIdeaSpace()

const kindLabels = {
  root: 'テーマ',
  direct: '深掘る',
  distant: '広げる',
  alternative: '別角度',
  custom: 'あなたのアイデア',
} as const

const kindColorClasses: Record<IdeaNodeKind, string> = {
  root: 'kind-color--root',
  direct: 'kind-color--direct',
  distant: 'kind-color--distant',
  alternative: 'kind-color--alternative',
  custom: 'kind-color--custom',
}

const controlPanel = ref<HTMLElement | null>(null)
const manualIdeaInput = ref<HTMLInputElement | null>(null)
const panelOffset = reactive({ x: 0, y: 0 })
const isDraggingPanel = ref(false)
const panelDragState = {
  pointerId: -1,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
}

function handleInitialKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  void startSpace()
}

async function handleNodeFocus(request: IdeaNodeFocusRequest) {
  if (!focusNode(request.nodeId)) return
  if (request.input === 'touch') return

  await nextTick()
  if (!isGenerating.value) {
    manualIdeaInput.value?.focus()
  }
}

function resetControlPanelPosition() {
  panelOffset.x = 0
  panelOffset.y = 0
}

function handlePanelPointerDown(event: PointerEvent) {
  if (event.button !== 0) return

  const panel = controlPanel.value
  const handle = event.currentTarget as HTMLElement
  if (!panel) return

  const rect = panel.getBoundingClientRect()
  const edgeGap = 8
  panelDragState.pointerId = event.pointerId
  panelDragState.startX = event.clientX
  panelDragState.startY = event.clientY
  panelDragState.originX = panelOffset.x
  panelDragState.originY = panelOffset.y
  panelDragState.minX = panelOffset.x + edgeGap - rect.left
  panelDragState.maxX = panelOffset.x + window.innerWidth - edgeGap - rect.right
  panelDragState.minY = panelOffset.y + edgeGap - rect.top
  panelDragState.maxY = panelOffset.y + window.innerHeight - edgeGap - rect.bottom
  isDraggingPanel.value = true
  handle.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function handlePanelPointerMove(event: PointerEvent) {
  if (!isDraggingPanel.value || event.pointerId !== panelDragState.pointerId) return

  const nextX = panelDragState.originX + event.clientX - panelDragState.startX
  const nextY = panelDragState.originY + event.clientY - panelDragState.startY
  panelOffset.x = Math.min(panelDragState.maxX, Math.max(panelDragState.minX, nextX))
  panelOffset.y = Math.min(panelDragState.maxY, Math.max(panelDragState.minY, nextY))
}

function handlePanelPointerUp(event: PointerEvent) {
  if (event.pointerId !== panelDragState.pointerId) return

  const handle = event.currentTarget as HTMLElement
  if (handle.hasPointerCapture(event.pointerId)) {
    handle.releasePointerCapture(event.pointerId)
  }
  isDraggingPanel.value = false
  panelDragState.pointerId = -1
}

onMounted(() => window.addEventListener('resize', resetControlPanelPosition))
onBeforeUnmount(() => window.removeEventListener('resize', resetControlPanelPosition))

</script>

<template>
  <main
    class="relative text-slate-100"
    :class="hasSpace
      ? 'h-dvh overflow-hidden'
      : 'min-h-screen overflow-hidden px-3 py-7 sm:px-6 sm:py-10'"
  >
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />

    <div
      v-if="!hasSpace"
      class="relative z-10 mx-auto w-full max-w-3xl"
    >
      <header class="mb-10 pt-8 text-center sm:pt-16">
        <h1 class="font-display text-6xl font-semibold tracking-tighter text-white sm:text-8xl">
          Idea Flux
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          ひとつのアイデアから、考えを深め、遠くへつなぎ、別の角度へひらいていく。
        </p>
      </header>

      <section
        class="rounded-4xl border border-sky-200/30 bg-paper/95 p-5 shadow-2xl backdrop-blur sm:p-8"
        aria-labelledby="initial-heading"
      >
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 id="initial-heading" class="font-display text-2xl font-semibold text-white sm:text-3xl">
              今回のテーマを入力
            </h2>
          </div>
          <span
            class="text-xs"
            :class="initialPrompt.length > 450 ? 'font-bold text-rose-300' : 'text-slate-400'"
          >
            {{ initialPrompt.length }} / 500
          </span>
        </div>

        <form class="mt-6" @submit.prevent="startSpace">
          <label class="sr-only" for="initial-prompt">今回のテーマ</label>
          <textarea
            id="initial-prompt"
            v-model="initialPrompt"
            name="prompt"
            rows="4"
            maxlength="500"
            placeholder="例：雨の日の静かな図書館"
            class="block min-h-36 w-full resize-y rounded-2xl border border-slate-500 bg-canvas/90 px-5 py-4 text-base leading-8 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/15"
            @keydown="handleInitialKeydown"
          />
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-slate-400">
              Enterで開始・Shift＋Enterで改行
            </p>
            <button
              type="submit"
              :disabled="!initialPrompt.trim()"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-300/80 bg-transparent px-6 py-3 text-sm font-black text-sky-200 transition hover:border-sky-200 hover:bg-sky-300/10 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              アイデア空間をひらく
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>
    </div>

    <template v-else>
      <IdeaCanvas
        v-if="focusedNodeId"
        class="absolute inset-0 z-0"
        :nodes="nodes"
        :edges="edges"
        :focused-node-id="focusedNodeId"
        :is-busy="isGenerating"
        :remaining-capacity="remainingCapacity"
        @focus="handleNodeFocus"
      />

      <header class="idea-space-header pointer-events-none absolute top-16 right-3 z-20 max-w-sm text-right sm:top-6 sm:right-7">
        <h1 class="font-display text-2xl font-semibold tracking-tighter text-white drop-shadow-lg sm:text-4xl">
          Idea Flux
        </h1>
        <p class="mt-1 text-xs font-medium text-slate-300 sm:text-sm">
          テーマから思考を広げる
        </p>
      </header>

      <section
        v-if="focusedNode"
        ref="controlPanel"
        class="control-panel absolute right-2 bottom-2 left-2 z-20 mx-auto max-h-[48dvh] max-w-3xl overflow-y-auto rounded-2xl border border-sky-200/40 p-3 shadow-2xl backdrop-blur-xl sm:right-4 sm:bottom-4 sm:left-4 sm:p-4 lg:top-1/2 lg:right-auto lg:bottom-auto lg:left-3/5 lg:mx-0 lg:max-h-11/12 lg:w-1/3 lg:max-w-md"
        :class="{ 'control-panel--dragging': isDraggingPanel }"
        :style="{
          '--panel-offset-x': `${panelOffset.x}px`,
          '--panel-offset-y': `${panelOffset.y}px`,
        }"
        aria-labelledby="focused-heading"
      >
        <div
          class="control-panel__handle -mx-1 -mt-1 hidden min-h-9 items-center justify-between gap-3 px-2 text-sm font-normal text-slate-300 lg:flex"
          aria-label="操作パネルをドラッグして移動"
          title="パネルを移動"
          @pointerdown="handlePanelPointerDown"
          @pointermove="handlePanelPointerMove"
          @pointerup="handlePanelPointerUp"
          @pointercancel="handlePanelPointerUp"
        >
            <div class="flex items-center gap-3">
                <span class="flex items-center">
                    <span class="kind-color text-lg font-light leading-none" :class="kindColorClasses[focusedNode.kind]" aria-hidden="true">⠿</span>
                </span>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p
                        class="kind-color flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase"
                        :class="kindColorClasses[focusedNode.kind]"
                    >
                        {{ kindLabels[focusedNode.kind] }}
                    </p>
                </div>
            </div>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-full text-xl text-white transition hover:bg-violet-200/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-200"
            aria-label="操作パネルの位置を戻す"
            title="操作パネルの位置を戻す"
            @pointerdown.stop
            @click="resetControlPanelPosition"
          >
            <span aria-hidden="true">↺</span>
          </button>
        </div>

        <div
          class="kind-color flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase lg:hidden"
          :class="kindColorClasses[focusedNode.kind]"
        >
          <span
            class="kind-color-dot size-1.5 rounded-full"
            aria-hidden="true"
          />
          {{ kindLabels[focusedNode.kind] }}
        </div>

        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <div class="min-w-0">
            <h2 id="focused-heading" class="mt-1 wrap-break-word font-display text-xl leading-tight font-semibold text-white sm:text-2xl">
              {{ focusedNode.label }}
            </h2>
            <p
              v-if="focusedNode.source === 'ai' && focusedNode.description"
              class="mt-1 line-clamp-2 text-xs leading-5 text-slate-400"
            >
              {{ focusedNode.description }}
            </p>
          </div>

          <form
            class="flex min-w-0 items-center justify-between gap-2"
            @submit.prevent="addManualNode"
          >
            <button
              type="button"
              :disabled="!canGenerate"
              class="control-icon-button control-icon-button--generate"
              aria-label="このアイデアから派生生成"
              title="このアイデアから派生生成"
              @click="generateFromFocusedNode"
            >
              <span v-if="isGenerating" class="control-spinner" aria-hidden="true" />
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l1.15 3.85L17 8l-3.85 1.15L12 13l-1.15-3.85L7 8l3.85-1.15L12 3Zm6 9 .75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12ZM6 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
              </svg>
            </button>
            <div class="flex min-w-0 items-center gap-2">
              <label class="sr-only" for="manual-idea">新しいアイデア</label>
              <input
                id="manual-idea"
                ref="manualIdeaInput"
                v-model="manualInput"
                type="text"
                maxlength="30"
                placeholder="新しいアイデアを入力"
                :disabled="!canAddManual"
                class="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-500 bg-canvas/85 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-3 focus:ring-amber-300/15 disabled:cursor-not-allowed disabled:opacity-45"
                @pointerdown.stop
              />
              <button
                type="submit"
                :disabled="!canAddManual || !manualInput.trim()"
                class="control-icon-button control-icon-button--add rounded-xl"
                aria-label="アイデアを追加"
                title="アイデアを追加"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12.5 4.2 4.2L19 7" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <p
          v-if="capacityMessage"
          class="mt-3 rounded-lg border border-amber-300/40 bg-amber-300/12 px-3 py-2 text-xs text-amber-50"
          role="status"
        >
          {{ capacityMessage }}
        </p>
        <p
          v-if="errorMessage"
          class="mt-3 rounded-lg border border-rose-300/45 bg-rose-300/12 px-3 py-2 text-xs text-rose-50"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </section>
    </template>
  </main>
</template>
