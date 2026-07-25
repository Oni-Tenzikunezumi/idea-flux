<script setup lang="ts">
import type {
  IdeaNodeFocusInput,
  IdeaNodeKind,
} from '../composables/useIdeaSpace'
import type { PositionedIdeaNode } from '../utils/idea-layout'

const props = defineProps<{
  node: PositionedIdeaNode
  disabled?: boolean
  isPath?: boolean
  isRelated?: boolean
  isGeneratingParent?: boolean
}>()

const emit = defineEmits<{
  focus: [nodeId: string, input: IdeaNodeFocusInput]
  center: [nodeId: string]
}>()

const kindLabels: Record<IdeaNodeKind, string> = {
  root: 'テーマ',
  direct: '深掘る',
  distant: '広げる',
  alternative: '別角度',
  custom: 'あなたのアイデア',
}

const diameter = computed(() => props.node.radius * 2)

function handleClick(event: MouseEvent) {
  if (event.detail !== 0) return
  emit('focus', props.node.id, 'keyboard')
}
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
      :data-cell-id="node.id"
      :aria-current="node.isFocused ? 'true' : undefined"
      :aria-label="`${kindLabels[node.kind]}「${node.label}」を選択`"
      :title="node.description"
      @click="handleClick"
      @dblclick.stop="emit('center', node.id)"
    >
      <span class="max-w-4/5">
        <span class="block text-xs font-bold tracking-widest text-white/80 uppercase">
          {{ kindLabels[node.kind] }}
        </span>
        <strong class="mt-1.5 block text-sm leading-snug font-semibold text-white sm:text-base">
          {{ node.label }}
        </strong>
      </span>
      <span
        v-if="isGeneratingParent"
        class="bubble-spinner"
        aria-label="Geminiでアイデアを生成中"
        role="status"
      />
    </button>
  </div>
</template>
