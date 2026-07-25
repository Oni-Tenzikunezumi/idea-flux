<script setup lang="ts">
import type { IdeaNodeKind } from './composables/useIdeaSpace'

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
  maxVisibleCells,
  startSpace,
  generateFromFocusedNode,
  focusNode,
  addManualNode,
} = useIdeaSpace()

const kindLabels = {
  root: '探索の起点',
  direct: '直接関係',
  distant: '少し離れた連想',
  alternative: '別観点',
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
        <p class="mb-3 text-xs font-bold tracking-widest text-sky-300 uppercase">
          Persistent radial idea space
        </p>
        <h1 class="font-display text-6xl font-semibold tracking-tighter text-white sm:text-8xl">
          Idea Flux
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          ひとつのセルから、考えを深め、遠くへつなぎ、別の角度へひらいていく。
        </p>
      </header>

      <section
        class="rounded-4xl border border-slate-700/80 bg-paper/90 p-5 shadow-2xl backdrop-blur sm:p-8"
        aria-labelledby="initial-heading"
      >
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold tracking-widest text-emerald-300 uppercase">
              Start a new space
            </p>
            <h2 id="initial-heading" class="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              今回のテーマを入力
            </h2>
          </div>
          <span
            class="text-xs"
            :class="initialPrompt.length > 450 ? 'font-bold text-rose-300' : 'text-slate-500'"
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
            class="block min-h-36 w-full resize-y rounded-2xl border border-slate-600/80 bg-canvas/80 px-5 py-4 text-base leading-8 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
            @keydown="handleInitialKeydown"
          />
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-slate-500">
              Enterで開始・Shift＋Enterで改行
            </p>
            <button
              type="submit"
              :disabled="!initialPrompt.trim()"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
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
        :max-visible-cells="maxVisibleCells"
        @focus="focusNode"
      />

      <header class="pointer-events-none absolute top-4 right-4 z-20 max-w-sm text-right sm:top-6 sm:right-7">
        <p class="text-xs font-bold tracking-widest text-sky-300 uppercase">
          Persistent radial idea space
        </p>
        <h1 class="font-display text-2xl font-semibold tracking-tighter text-white drop-shadow-lg sm:text-4xl">
          Idea Flux
        </h1>
        <p class="mt-1 text-xs text-slate-400">
          {{ nodes.length }} / {{ maxVisibleCells }} cells
        </p>
      </header>

      <section
        v-if="focusedNode"
        ref="controlPanel"
        class="control-panel absolute right-3 bottom-3 left-3 z-20 mx-auto max-h-2/5 max-w-5xl overflow-y-auto rounded-2xl border border-sky-200/20 bg-panel/95 p-4 shadow-2xl backdrop-blur-xl sm:right-5 sm:bottom-5 sm:left-5 sm:p-5 lg:top-1/2 lg:right-auto lg:bottom-auto lg:left-3/5 lg:mx-0 lg:max-h-11/12 lg:w-1/3 lg:max-w-md"
        :class="{ 'control-panel--dragging': isDraggingPanel }"
        :style="{
          '--panel-offset-x': `${panelOffset.x}px`,
          '--panel-offset-y': `${panelOffset.y}px`,
        }"
        aria-labelledby="focused-heading"
      >
        <div
          class="control-panel__handle -mx-1 -mt-1 mb-3 flex min-h-7 items-center justify-between gap-3 rounded-lg px-2 text-xs text-slate-400"
          aria-label="操作パネルをドラッグして移動"
          @pointerdown="handlePanelPointerDown"
          @pointermove="handlePanelPointerMove"
          @pointerup="handlePanelPointerUp"
          @pointercancel="handlePanelPointerUp"
        >
          <span class="flex items-center gap-2">
            <span class="text-base leading-none text-sky-200/70" aria-hidden="true">⠿</span>
            ドラッグして移動
          </span>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-slate-400 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
            @pointerdown.stop
            @click="resetControlPanelPosition"
          >
            位置を戻す
          </button>
        </div>

        <div class="grid gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p
                class="kind-color flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase"
                :class="kindColorClasses[focusedNode.kind]"
              >
                <span
                  class="kind-color-dot size-1.5 rounded-full"
                  aria-hidden="true"
                />
                {{ kindLabels[focusedNode.kind] }}
              </p>
              <span class="text-xs text-slate-500">
                残り {{ remainingCapacity }}
              </span>
            </div>
            <h2 id="focused-heading" class="mt-1 truncate font-display text-xl font-semibold text-white sm:text-2xl">
              {{ focusedNode.label }}
            </h2>
            <p v-if="focusedNode.description" class="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
              {{ focusedNode.description }}
            </p>

            <div class="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                :disabled="!canGenerate"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-300 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-sky-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-35"
                @click="generateFromFocusedNode"
              >
                {{ isGenerating ? '生成中…' : 'Geminiでアイデアを生成' }}
              </button>
              <p class="hidden text-xs text-slate-400 sm:block">
                セルを選ぶと、そのセルを中心に探索できます
              </p>
            </div>
          </div>

          <form
            class="rounded-lg border border-amber-300/15 bg-amber-300/5 p-3"
            @submit.prevent="addManualNode"
          >
            <div class="flex items-center justify-between gap-3">
              <label for="manual-idea" class="text-xs font-bold text-amber-100">
                自分のアイデアを追加
              </label>
              <span class="text-xs text-slate-500">
                {{ manualInput.length }} / 30
              </span>
            </div>
            <div class="mt-2 flex gap-2">
              <input
                id="manual-idea"
                v-model="manualInput"
                type="text"
                maxlength="30"
                placeholder="このセルからつなげたいこと"
                :disabled="!canAddManual"
                class="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-600 bg-canvas/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-3 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-45"
              />
              <button
                type="submit"
                :disabled="!canAddManual || !manualInput.trim()"
                class="min-h-10 shrink-0 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-300/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
              >
                追加
              </button>
            </div>
          </form>
        </div>

        <p
          v-if="capacityMessage"
          class="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100"
          role="status"
        >
          {{ capacityMessage }}
        </p>
        <p
          v-if="errorMessage"
          class="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100"
          role="alert"
        >
          {{ errorMessage }}
        </p>
      </section>
    </template>
  </main>
</template>
