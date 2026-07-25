<script setup lang="ts">
import type { IdeaNodeKind } from '../composables/useIdeaSpace'
import type { PositionedIdeaNode } from '../utils/idea-layout'

const props = defineProps<{
  node: PositionedIdeaNode
  disabled?: boolean
  isPath?: boolean
  isRelated?: boolean
  isGeneratingParent?: boolean
}>()

const emit = defineEmits<{
  focus: [nodeId: string]
  center: [nodeId: string]
}>()

const kindLabels: Record<IdeaNodeKind, string> = {
  root: '起点',
  direct: '直接関係',
  distant: '少し離れた',
  alternative: '別観点',
  custom: 'あなたのアイデア',
}

const diameter = computed(() => props.node.radius * 2)
</script>

<template>
  <div
    class="idea-bubble-shell absolute -translate-x-1/2 -translate-y-1/2"
    :style="{
      left: `${node.x}px`,
      top: `${node.y}px`,
      width: `${diameter}px`,
      height: `${diameter}px`,
    }"
  >
    <button
      type="button"
      class="idea-bubble grid size-full place-items-center rounded-full border text-center focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white/80 disabled:cursor-wait"
      :class="[
        `idea-bubble--${node.kind}`,
        {
          'idea-bubble--focused': node.isFocused,
          'idea-bubble--path': isPath && !node.isFocused,
          'idea-bubble--unrelated': !isRelated,
        },
      ]"
      :disabled="disabled"
      :aria-current="node.isFocused ? 'true' : undefined"
      :aria-label="`${kindLabels[node.kind]}「${node.label}」へフォーカス`"
      :title="node.description"
      @click="emit('focus', node.id)"
      @dblclick.stop="emit('center', node.id)"
    >
      <span class="max-w-[82%]">
        <span class="block text-[0.6rem] font-bold tracking-[0.14em] text-white/78 uppercase">
          {{ kindLabels[node.kind] }}
        </span>
        <strong class="mt-1.5 block text-sm leading-snug font-semibold text-white sm:text-[0.95rem]">
          {{ node.label }}
        </strong>
      </span>
      <span
        v-if="isGeneratingParent"
        class="bubble-spinner"
        aria-label="このセルから派生を生成中"
        role="status"
      />
    </button>
  </div>
</template>

<style scoped>
.idea-bubble-shell {
  z-index: 2;
  transition:
    left 420ms cubic-bezier(0.2, 0.8, 0.2, 1),
    top 420ms cubic-bezier(0.2, 0.8, 0.2, 1),
    width 260ms ease,
    height 260ms ease;
}

.idea-bubble {
  border-color: color-mix(in srgb, var(--bubble-color) 38%, transparent);
  background:
    radial-gradient(circle at 32% 24%, rgb(255 255 255 / 0.2), transparent 28%),
    radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--bubble-color) 35%, #101d31), #101d31 72%);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.04) inset,
    0 18px 42px rgb(0 0 0 / 0.28),
    0 0 28px color-mix(in srgb, var(--bubble-color) 18%, transparent);
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    filter 120ms ease,
    box-shadow 120ms ease;
  animation: bubble-arrive 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.idea-bubble:hover:not(:disabled) {
  transform: scale(1.012);
  filter: brightness(1.1);
}

.idea-bubble--focused {
  z-index: 3;
  border-color: color-mix(in srgb, var(--bubble-color) 82%, white);
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 0.16) inset,
    0 22px 55px rgb(0 0 0 / 0.36),
    0 0 56px color-mix(in srgb, var(--bubble-color) 48%, transparent),
    0 0 18px color-mix(in srgb, var(--bubble-color) 48%, transparent);
}

.idea-bubble--path {
  border-color: color-mix(in srgb, var(--bubble-color) 55%, white);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08) inset,
    0 18px 42px rgb(0 0 0 / 0.3),
    0 0 34px color-mix(in srgb, var(--bubble-color) 28%, transparent);
}

.idea-bubble--unrelated {
  opacity: 0.68;
  filter: saturate(0.72);
}

.idea-bubble--unrelated:hover:not(:disabled) {
  opacity: 0.9;
  filter: saturate(0.9) brightness(1.08);
}

.idea-bubble--root { --bubble-color: #7dd3fc; }
.idea-bubble--direct { --bubble-color: #34d399; }
.idea-bubble--distant { --bubble-color: #a78bfa; }
.idea-bubble--alternative { --bubble-color: #fb7185; }
.idea-bubble--custom { --bubble-color: #fbbf24; }

.bubble-spinner {
  position: absolute;
  inset: 5px;
  pointer-events: none;
  border-radius: 9999px;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg 245deg,
      color-mix(in srgb, var(--bubble-color) 35%, transparent) 285deg,
      color-mix(in srgb, var(--bubble-color) 88%, white) 330deg,
      white 350deg,
      transparent 360deg
    );
  filter:
    drop-shadow(0 0 5px var(--bubble-color))
    drop-shadow(0 0 12px color-mix(in srgb, var(--bubble-color) 72%, transparent));
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
  animation: bubble-spin 1.05s linear infinite;
}

@keyframes bubble-spin {
  to { transform: rotate(360deg); }
}

@keyframes bubble-arrive {
  from {
    opacity: 0;
    transform: scale(0.72);
    filter: brightness(1.35) blur(2px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1) blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .idea-bubble-shell,
  .idea-bubble {
    transition-duration: 0.01ms;
  }

  .bubble-spinner {
    animation-duration: 1.8s;
  }
}
</style>
