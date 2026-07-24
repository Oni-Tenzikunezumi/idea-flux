<script setup lang="ts">
import type { AssociationItem } from '../shared/types/association'

const {
  prompt,
  status,
  associations,
  history,
  errorMessage,
  selectedAssociation,
  isLoading,
  submitPrompt,
  selectAssociation,
  cancelSelection,
  continueFromSelection,
} = useAssociation()

const currentIdea = computed(() => history.value.at(-1) ?? '')
const previousHistory = computed(() => history.value.slice(0, -1))

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return

  event.preventDefault()
  void submitPrompt()
}

function handleCardSelect(item: AssociationItem) {
  selectAssociation(item)
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden px-3 py-8 text-ink sm:px-6 sm:py-12 lg:py-16">
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />

    <div class="relative z-10 mx-auto w-full max-w-6xl">
      <header class="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <div class="mx-auto mb-4 flex h-9 w-11 items-end justify-center gap-1" aria-hidden="true">
          <span class="h-4 w-2 rotate-6 rounded-full bg-clay" />
          <span class="h-8 w-2 rotate-3 rounded-full bg-leaf" />
          <span class="h-6 w-2 -rotate-6 rounded-full bg-sun" />
        </div>
        <p class="mb-2 text-[0.68rem] font-extrabold tracking-[0.24em] text-clay uppercase">
          Guided idea exploration
        </p>
        <h1 class="font-display text-5xl leading-none font-medium tracking-[-0.055em] sm:text-7xl">
          Idea Flux
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
          ひとつのアイデアを起点に、あなたが選ぶ3つの方向へ思考を進めます。
        </p>
      </header>

      <section
        class="mx-auto border border-ink/10 bg-paper/85 shadow-[0_24px_70px_rgba(34,63,48,0.09)] backdrop-blur-md transition-all"
        :class="associations.length ? 'max-w-3xl rounded-[1.75rem] p-4 sm:p-5' : 'max-w-3xl rounded-[2rem] p-5 sm:p-7'"
        aria-labelledby="input-heading"
      >
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-[0.65rem] font-extrabold tracking-[0.18em] text-clay uppercase">
              {{ associations.length ? 'New starting point' : 'Start here' }}
            </p>
            <h2 id="input-heading" class="font-display text-xl font-medium sm:text-2xl">
              {{ associations.length ? '別の起点から探索する' : '連想の起点を入力' }}
            </h2>
          </div>
          <span
            class="shrink-0 text-xs"
            :class="prompt.length > 450 ? 'font-bold text-clay' : 'text-muted/75'"
          >
            {{ prompt.length }} / 500
          </span>
        </div>

        <form
          class="mt-4 rounded-2xl border border-ink/15 bg-white p-1.5 transition focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/10"
          @submit.prevent="submitPrompt"
        >
          <label class="sr-only" for="idea-input">アイデアを入力</label>
          <textarea
            id="idea-input"
            v-model="prompt"
            name="prompt"
            :rows="associations.length ? 2 : 3"
            maxlength="500"
            placeholder="例：木を使ったゲーム"
            :disabled="isLoading"
            class="block min-h-20 w-full resize-y border-0 bg-transparent px-3 py-3 text-[0.98rem] leading-7 text-ink outline-none placeholder:text-muted/55 disabled:cursor-wait disabled:opacity-60"
            @keydown="handleKeydown"
          />
          <div class="flex flex-col gap-2 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between sm:pl-3">
            <p class="px-2 text-[0.68rem] text-muted/75 sm:px-0">
              Enterで送信・Shift＋Enterで改行
            </p>
            <button
              type="submit"
              :disabled="isLoading || !prompt.trim()"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-leaf-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-leaf/35 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <span v-if="isLoading" class="spinner" aria-hidden="true" />
              {{ isLoading ? '連想中…' : '3つの方向をひらく' }}
            </button>
          </div>
        </form>

        <p
          v-if="errorMessage"
          class="mt-3 flex items-center gap-2 rounded-xl bg-clay/10 px-4 py-3 text-sm text-[#963c27]"
          role="alert"
        >
          <span class="grid size-5 shrink-0 place-items-center rounded-full bg-clay text-xs font-black text-white" aria-hidden="true">!</span>
          {{ errorMessage }}
        </p>
      </section>

      <section
        v-if="associations.length"
        class="relative mt-10 sm:mt-14"
        aria-labelledby="exploration-heading"
        :aria-busy="isLoading"
      >
        <div v-if="previousHistory.length" class="mx-auto mb-6 max-w-4xl" aria-label="これまでの探索パス">
          <p class="mb-3 text-center text-[0.65rem] font-extrabold tracking-[0.2em] text-muted uppercase">
            Exploration path
          </p>
          <ol class="flex flex-wrap items-center justify-center gap-2 text-xs text-muted sm:text-sm">
            <template v-for="(entry, index) in previousHistory" :key="`${index}-${entry}`">
              <li class="max-w-56 truncate rounded-full border border-ink/10 bg-paper/75 px-3 py-1.5">
                {{ entry }}
              </li>
              <li class="text-leaf/55" aria-hidden="true">→</li>
            </template>
            <li class="font-bold text-leaf">現在</li>
          </ol>
        </div>

        <div class="mx-auto max-w-5xl">
          <div class="relative z-10 mx-auto grid min-h-40 w-full max-w-xl place-items-center rounded-[45%_55%_48%_52%/55%_45%_55%_45%] border border-leaf/20 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.96),rgba(225,239,226,0.9))] px-8 py-8 text-center shadow-[0_20px_60px_rgba(47,119,84,0.14)] sm:min-h-48">
            <div>
              <p class="mb-3 text-[0.65rem] font-extrabold tracking-[0.2em] text-leaf uppercase">
                Current idea
              </p>
              <h2 id="exploration-heading" class="font-display text-2xl leading-snug font-semibold sm:text-3xl">
                {{ currentIdea }}
              </h2>
              <p class="mt-3 text-xs text-muted sm:text-sm">
                次に進みたい思考の方向を選んでください
              </p>
            </div>
          </div>

          <div class="branch-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div class="relative z-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
            <AssociationCard
              v-for="item in associations"
              :key="item.id"
              :association="item"
              :disabled="isLoading"
              @select="handleCardSelect"
            />
          </div>
        </div>

        <div
          v-if="isLoading"
          class="absolute inset-0 z-20 grid place-items-center rounded-[2rem] bg-canvas/55 px-4 backdrop-blur-[2px]"
          role="status"
        >
          <div class="flex max-w-sm items-center gap-3 rounded-2xl border border-leaf/15 bg-paper px-5 py-4 text-sm font-bold text-leaf shadow-xl">
            <span class="spinner" aria-hidden="true" />
            <span>
              {{ selectedAssociation ? `「${selectedAssociation.label}」から探索中…` : '新しい方向を探索中…' }}
            </span>
          </div>
        </div>
      </section>

      <section
        v-else-if="status === 'idle'"
        class="mx-auto mt-8 flex max-w-lg items-center justify-center gap-3 text-sm leading-6 text-muted"
        aria-label="使い方"
      >
        <span class="grid size-9 shrink-0 place-items-center rounded-full border border-leaf/20 bg-white/60 text-leaf" aria-hidden="true">↗</span>
        <p>入力すると、深める・つなげる・前提を変える3方向へ展開します。</p>
      </section>
    </div>

    <ConfirmDialog
      :open="status === 'confirming'"
      :association="selectedAssociation"
      @cancel="cancelSelection"
      @confirm="continueFromSelection"
    />
  </main>
</template>

<style scoped>
.ambient {
  position: fixed;
  width: min(32rem, 75vw);
  aspect-ratio: 1;
  border-radius: 999px;
  pointer-events: none;
  opacity: 0.55;
  animation: drift 12s ease-in-out infinite alternate;
}

.ambient-one {
  top: -22rem;
  right: -10rem;
  background: radial-gradient(circle, rgba(223, 163, 59, 0.34), transparent 68%);
}

.ambient-two {
  bottom: -24rem;
  left: -12rem;
  background: radial-gradient(circle, rgba(47, 119, 84, 0.3), transparent 68%);
  animation-delay: -4s;
}

.spinner {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.branch-lines {
  position: relative;
  height: 5rem;
  margin-inline: auto;
}

.branch-lines::before {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 2.5rem;
  content: "";
  background: linear-gradient(to bottom, rgba(47, 119, 84, 0.42), rgba(47, 119, 84, 0.18));
}

.branch-lines::after {
  position: absolute;
  top: 2.5rem;
  left: 16.666%;
  width: 66.666%;
  height: 1px;
  content: "";
  background: rgba(47, 119, 84, 0.2);
}

.branch-lines span {
  position: absolute;
  top: 2.5rem;
  width: 1px;
  height: 2.5rem;
  background: linear-gradient(to bottom, rgba(47, 119, 84, 0.2), rgba(47, 119, 84, 0.42));
}

.branch-lines span:nth-child(1) { left: 16.666%; }
.branch-lines span:nth-child(2) { left: 50%; }
.branch-lines span:nth-child(3) { left: 83.333%; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes drift {
  to { transform: translate3d(1.5rem, 1rem, 0) scale(1.06); }
}

@media (max-width: 639px) {
  .branch-lines {
    height: 3rem;
  }

  .branch-lines::before {
    height: 3rem;
  }

  .branch-lines::after,
  .branch-lines span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient,
  .spinner {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
</style>
