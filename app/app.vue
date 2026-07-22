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
  <main class="app-shell">
    <div class="ambient ambient-one" />
    <div class="ambient ambient-two" />

    <section class="workspace" aria-labelledby="app-title">
      <header class="hero">
        <div class="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p class="eyebrow">
          Idea exploration
        </p>
        <h1 id="app-title">
          Idea Flux
        </h1>
        <p class="lead">
          ひとつのアイデアから、思考の流れを3つの方向へ広げます。
        </p>
      </header>

      <section class="composer-panel" aria-labelledby="input-heading">
        <div class="section-heading">
          <div>
            <p class="step-label">
              Start here
            </p>
            <h2 id="input-heading">
              連想の起点を入力
            </h2>
          </div>
          <span class="character-count" :class="{ 'is-near-limit': prompt.length > 450 }">
            {{ prompt.length }} / 500
          </span>
        </div>

        <form class="composer" @submit.prevent="submitPrompt">
          <label class="sr-only" for="idea-input">アイデアを入力</label>
          <textarea
            id="idea-input"
            v-model="prompt"
            name="prompt"
            rows="3"
            maxlength="500"
            placeholder="例：木を使ったゲーム"
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
          <div class="composer-footer">
            <p>Enterで送信・Shift＋Enterで改行</p>
            <button
              class="submit-button"
              type="submit"
              :disabled="isLoading || !prompt.trim()"
            >
              <span v-if="isLoading" class="spinner" aria-hidden="true" />
              {{ isLoading ? '連想中…' : '3つの連想をひらく' }}
            </button>
          </div>
        </form>

        <p v-if="errorMessage" class="error-message" role="alert">
          <span aria-hidden="true">!</span>
          {{ errorMessage }}
        </p>
      </section>

      <section v-if="history.length" class="history" aria-labelledby="history-heading">
        <div class="history-title-row">
          <p id="history-heading" class="history-title">
            思考の履歴
          </p>
          <span>{{ history.length }} steps</span>
        </div>
        <ol>
          <li v-for="(entry, index) in history" :key="`${index}-${entry}`">
            <span class="history-index">{{ index + 1 }}</span>
            <span>{{ entry }}</span>
          </li>
        </ol>
      </section>

      <section
        v-if="associations.length"
        class="results"
        aria-labelledby="results-heading"
        :aria-busy="isLoading"
      >
        <div class="results-heading-row">
          <div>
            <p class="step-label">
              Choose a direction
            </p>
            <h2 id="results-heading">
              次に広げるカードを選択
            </h2>
          </div>
          <p>選んだカードから、さらに3つの連想を生成します。</p>
        </div>

        <div class="card-grid" :class="{ 'is-loading': isLoading }">
          <AssociationCard
            v-for="item in associations"
            :key="item.id"
            :association="item"
            :disabled="isLoading"
            @select="handleCardSelect"
          />
        </div>

        <div v-if="isLoading" class="results-loading" role="status">
          <span class="spinner" aria-hidden="true" />
          新しい連想を組み立てています…
        </div>
      </section>

      <section v-else-if="status === 'idle'" class="empty-state" aria-label="使い方">
        <span class="empty-icon" aria-hidden="true">↗</span>
        <p>アイデアを入力すると、直接・少し離れた・別観点の3方向へ展開します。</p>
      </section>
    </section>

    <ConfirmDialog
      :open="status === 'confirming'"
      :association="selectedAssociation"
      @cancel="cancelSelection"
      @confirm="continueFromSelection"
    />
  </main>
</template>

<style>
:root {
  color-scheme: light;
  font-family: Inter, "Noto Sans JP", "Yu Gothic UI", "Yu Gothic", sans-serif;
  color: #17221d;
  background: #f4f5ef;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(rgba(40, 62, 51, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(40, 62, 51, 0.035) 1px, transparent 1px),
    #f4f5ef;
  background-size: 32px 32px;
}

button,
textarea {
  font: inherit;
}

button {
  -webkit-tap-highlight-color: transparent;
}

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 56px 24px 80px;
}

.workspace {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  margin: 0 auto;
}

.ambient {
  position: fixed;
  width: 400px;
  height: 400px;
  border-radius: 999px;
  filter: blur(2px);
  pointer-events: none;
  opacity: 0.5;
}

.ambient-one {
  top: -250px;
  right: -100px;
  background: radial-gradient(circle, rgba(232, 134, 70, 0.34), transparent 68%);
}

.ambient-two {
  bottom: -280px;
  left: -130px;
  background: radial-gradient(circle, rgba(55, 126, 92, 0.28), transparent 68%);
}

.hero {
  max-width: 730px;
  margin-bottom: 36px;
}

.brand-mark {
  display: flex;
  align-items: end;
  gap: 4px;
  width: 34px;
  height: 28px;
  margin-bottom: 18px;
}

.brand-mark span {
  width: 8px;
  border-radius: 6px 6px 2px 2px;
  background: #d95f2b;
  transform: rotate(8deg);
}

.brand-mark span:nth-child(1) { height: 14px; }
.brand-mark span:nth-child(2) { height: 27px; background: #2f6f50; }
.brand-mark span:nth-child(3) { height: 20px; background: #e6a238; }

.eyebrow,
.step-label {
  margin: 0 0 8px;
  color: #a94d27;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  font-family: Georgia, "Yu Mincho", serif;
  font-size: clamp(3rem, 8vw, 5.8rem);
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.92;
}

.lead {
  max-width: 600px;
  margin-bottom: 0;
  color: #607068;
  font-size: clamp(1rem, 2.2vw, 1.17rem);
  line-height: 1.8;
}

.composer-panel,
.history {
  border: 1px solid rgba(39, 61, 50, 0.13);
  background: rgba(255, 255, 252, 0.84);
  box-shadow: 0 24px 70px rgba(45, 61, 52, 0.08);
  backdrop-filter: blur(10px);
}

.composer-panel {
  padding: 26px;
  border-radius: 22px;
}

.section-heading,
.results-heading-row,
.history-title-row,
.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

h2 {
  margin-bottom: 0;
  font-family: Georgia, "Yu Mincho", serif;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 500;
  letter-spacing: -0.025em;
}

.character-count {
  color: #849088;
  font-size: 0.78rem;
  white-space: nowrap;
}

.character-count.is-near-limit {
  color: #b1432d;
  font-weight: 700;
}

.composer {
  margin-top: 20px;
  padding: 7px;
  border: 1px solid #cfd6cf;
  border-radius: 16px;
  background: #fff;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.composer:focus-within {
  border-color: #397354;
  box-shadow: 0 0 0 4px rgba(57, 115, 84, 0.11);
}

.composer textarea {
  display: block;
  width: 100%;
  min-height: 88px;
  resize: vertical;
  padding: 13px 15px 9px;
  border: 0;
  outline: 0;
  color: #17221d;
  background: transparent;
  font-size: 1.02rem;
  line-height: 1.65;
}

.composer textarea::placeholder {
  color: #9aa49d;
}

.composer textarea:disabled {
  cursor: wait;
  opacity: 0.68;
}

.composer-footer {
  padding: 5px 5px 5px 13px;
}

.composer-footer p {
  margin-bottom: 0;
  color: #89938c;
  font-size: 0.72rem;
}

.submit-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 10px 19px;
  border: 0;
  border-radius: 11px;
  color: #fff;
  background: #276144;
  font-size: 0.86rem;
  font-weight: 750;
  cursor: pointer;
  transition: transform 150ms ease, background 150ms ease;
}

.submit-button:not(:disabled):hover {
  background: #1e5037;
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0 0;
  padding: 11px 14px;
  border-radius: 10px;
  color: #933923;
  background: #fff0e9;
  font-size: 0.87rem;
}

.error-message span {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #b94b31;
  font-weight: 800;
}

.history {
  margin-top: 18px;
  padding: 18px 22px;
  border-radius: 16px;
}

.history-title-row {
  align-items: baseline;
}

.history-title-row > span {
  color: #8b958e;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.history-title {
  margin-bottom: 12px;
  color: #53645b;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.history ol {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px 7px 7px;
  border-radius: 999px;
  color: #33473c;
  background: #edf2ec;
  font-size: 0.82rem;
}

.history-index {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #567060;
  font-size: 0.66rem;
  font-weight: 800;
}

.results {
  position: relative;
  margin-top: 50px;
}

.results-heading-row {
  align-items: end;
  margin-bottom: 22px;
}

.results-heading-row > p {
  max-width: 340px;
  margin-bottom: 2px;
  color: #718078;
  font-size: 0.81rem;
  line-height: 1.6;
  text-align: right;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  transition: opacity 180ms ease, filter 180ms ease;
}

.card-grid.is-loading {
  opacity: 0.48;
  filter: grayscale(0.2);
}

.results-loading {
  position: absolute;
  inset: 54% 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #284a38;
  font-size: 0.87rem;
  font-weight: 750;
}

.empty-state {
  display: flex;
  max-width: 550px;
  align-items: center;
  gap: 13px;
  margin: 30px auto 0;
  color: #718078;
  font-size: 0.85rem;
  line-height: 1.6;
}

.empty-state p { margin-bottom: 0; }

.empty-icon {
  display: grid;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid #ccd5cd;
  border-radius: 50%;
  color: #397354;
  background: rgba(255, 255, 255, 0.55);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 760px) {
  .app-shell { padding: 36px 16px 60px; }
  .hero { margin-bottom: 27px; }
  .composer-panel { padding: 20px; }
  .results { margin-top: 40px; }
  .results-heading-row { align-items: start; flex-direction: column; gap: 10px; }
  .results-heading-row > p { text-align: left; }
  .card-grid { grid-template-columns: 1fr; }
  .results-loading { position: fixed; inset: auto 16px 20px; z-index: 4; padding: 13px; border-radius: 12px; background: #fff; box-shadow: 0 8px 30px rgba(35, 58, 45, 0.18); }
}

@media (max-width: 480px) {
  .app-shell { padding-inline: 12px; }
  h1 { font-size: 3.25rem; }
  .lead { font-size: 0.92rem; }
  .composer-panel { padding: 17px 14px; border-radius: 18px; }
  .section-heading { align-items: end; gap: 12px; }
  .composer-footer { align-items: stretch; flex-direction: column; gap: 9px; padding: 5px; }
  .composer-footer p { padding: 0 8px; }
  .submit-button { width: 100%; }
  .history { padding: 16px 14px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
