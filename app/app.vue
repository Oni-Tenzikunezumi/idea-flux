<script setup lang="ts">
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

const manualInputElement = ref<HTMLInputElement | null>(null)

const kindLabels = {
  root: '探索の起点',
  direct: '直接関係',
  distant: '少し離れた連想',
  alternative: '別観点',
  custom: 'あなたのアイデア',
} as const

function handleInitialKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  void startSpace()
}

async function handleFocusNode(nodeId: string) {
  focusNode(nodeId)
  await nextTick()
  manualInputElement.value?.focus()
}
</script>

<template>
  <main
    class="relative text-slate-100"
    :class="hasSpace
      ? 'h-[100dvh] overflow-hidden'
      : 'min-h-screen overflow-hidden px-3 py-7 sm:px-6 sm:py-10'"
  >
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />

    <div
      v-if="!hasSpace"
      class="relative z-10 mx-auto w-full max-w-3xl"
    >
      <header class="mb-10 pt-8 text-center sm:pt-16">
        <p class="mb-3 text-[0.65rem] font-bold tracking-[0.28em] text-sky-300 uppercase">
          Persistent radial idea space
        </p>
        <h1 class="font-display text-6xl font-semibold tracking-[-0.045em] text-white sm:text-8xl">
          Idea Flux
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          ひとつの泡から、考えを深め、遠くへつなぎ、別の角度へひらいていく。
        </p>
      </header>

      <section
        class="rounded-[2rem] border border-slate-700/80 bg-[#101d31]/88 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8"
        aria-labelledby="initial-heading"
      >
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-[0.65rem] font-bold tracking-[0.2em] text-emerald-300 uppercase">
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
            class="block min-h-36 w-full resize-y rounded-2xl border border-slate-600/80 bg-[#07111f]/80 px-5 py-4 text-base leading-8 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
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
        @focus="handleFocusNode"
      />

      <header class="pointer-events-none absolute top-4 right-4 z-20 max-w-[55vw] text-right sm:top-6 sm:right-7">
        <p class="text-[0.55rem] font-bold tracking-[0.22em] text-sky-300 uppercase sm:text-[0.62rem]">
          Persistent radial idea space
        </p>
        <h1 class="font-display text-2xl font-semibold tracking-[-0.04em] text-white drop-shadow-lg sm:text-4xl">
          Idea Flux
        </h1>
        <p class="mt-1 text-[0.65rem] text-slate-400 sm:text-xs">
          {{ nodes.length }} / 50 bubbles
        </p>
      </header>

      <section
        v-if="focusedNode"
        class="control-panel absolute right-3 bottom-3 left-3 z-20 mx-auto max-h-[42dvh] max-w-5xl overflow-y-auto rounded-[1.5rem] border border-slate-700/90 bg-[#101d31]/94 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:right-5 sm:bottom-5 sm:left-5 sm:p-5"
        aria-labelledby="focused-heading"
      >
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.75fr)] lg:items-end">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p class="text-[0.6rem] font-bold tracking-[0.18em] text-sky-300 uppercase">
                {{ kindLabels[focusedNode.kind] }}
              </p>
              <span class="text-[0.65rem] text-slate-500">
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
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-sky-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-35"
                @click="generateFromFocusedNode"
              >
                <span v-if="isGenerating" class="spinner" aria-hidden="true" />
                {{ isGenerating ? '生成中…' : 'この泡から3つ生成' }}
              </button>
              <p class="hidden text-[0.68rem] text-slate-500 sm:block">
                泡の選択だけでは配置は変わりません
              </p>
            </div>
          </div>

          <form
            class="rounded-xl border border-amber-300/15 bg-amber-300/5 p-3"
            @submit.prevent="addManualNode"
          >
            <div class="flex items-center justify-between gap-3">
              <label for="manual-idea" class="text-xs font-bold text-amber-100">
                自分のアイデアを追加
              </label>
              <span class="text-[0.62rem] text-slate-500">
                {{ manualInput.length }} / 30
              </span>
            </div>
            <div class="mt-2 flex gap-2">
              <input
                id="manual-idea"
                ref="manualInputElement"
                v-model="manualInput"
                type="text"
                maxlength="30"
                placeholder="この泡からつなげたいこと"
                :disabled="!canAddManual"
                class="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-600 bg-[#07111f]/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300 focus:ring-3 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-45"
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

<style scoped>
.ambient {
  position: fixed;
  z-index: 0;
  width: 34rem;
  height: 34rem;
  pointer-events: none;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.16;
  animation: drift 18s ease-in-out infinite alternate;
}

.ambient-one {
  top: -15rem;
  left: -10rem;
  background: #0ea5e9;
}

.ambient-two {
  right: -12rem;
  bottom: -17rem;
  background: #8b5cf6;
  animation-delay: -7s;
}

.control-panel {
  overscroll-behavior: contain;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgb(15 23 42 / 0.25);
  border-top-color: #0f172a;
  border-radius: 9999px;
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes drift {
  to { transform: translate3d(2rem, 1rem, 0) scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .ambient,
  .spinner {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
</style>
