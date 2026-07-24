<script setup lang="ts">
import type { AssociationItem, AssociationType } from '../../shared/types/association'

const props = defineProps<{
  association: AssociationItem
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [association: AssociationItem]
}>()

const typeDetails: Record<AssociationType, {
  label: string
  guide: string
  role: string
  accent: string
  surface: string
}> = {
  direct: {
    label: '直接関係',
    guide: '今の方向を深める',
    role: 'Explorer',
    accent: 'text-leaf',
    surface: 'border-leaf/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(226,240,229,0.94))]',
  },
  distant: {
    label: '少し離れた',
    guide: '別分野へつなげる',
    role: 'Connector',
    accent: 'text-[#a66b12]',
    surface: 'border-sun/30 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(250,237,207,0.94))]',
  },
  alternative: {
    label: '別観点',
    guide: '前提を変えて見る',
    role: 'Challenger',
    accent: 'text-clay',
    surface: 'border-clay/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(249,226,216,0.94))]',
  },
}

const details = computed(() => typeDetails[props.association.type])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="`${details.label}「${association.label}」を選択`"
    class="branch-node group flex min-h-64 w-full flex-col text-left shadow-[0_16px_45px_rgba(33,62,47,0.09)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(33,62,47,0.16)] focus-visible:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-leaf/35 disabled:cursor-wait disabled:opacity-65 disabled:hover:translate-y-0 sm:min-h-72"
    :class="[details.surface, `branch-${association.type}`]"
    @click="emit('select', association)"
  >
    <span class="flex w-full items-start justify-between gap-3">
      <span>
        <span class="block text-[0.68rem] font-extrabold tracking-[0.12em]" :class="details.accent">
          {{ details.label }}
        </span>
        <span class="mt-1 block text-xs text-muted">{{ details.guide }}</span>
      </span>
      <span class="font-display text-[0.65rem] tracking-[0.15em] text-muted/55 uppercase">
        {{ details.role }}
      </span>
    </span>

    <span class="my-auto block py-6">
      <strong class="font-display block text-xl leading-snug font-semibold sm:text-[1.35rem]">
        {{ association.label }}
      </strong>
      <span class="mt-3 block text-sm leading-7 text-muted">
        {{ association.description }}
      </span>
    </span>

    <span class="flex w-full items-center justify-between border-t border-ink/10 pt-4 text-xs font-bold text-muted">
      この方向へ進む
      <span
        class="grid size-8 place-items-center rounded-full text-white transition group-hover:translate-x-1"
        :class="association.type === 'direct' ? 'bg-leaf' : association.type === 'distant' ? 'bg-sun' : 'bg-clay'"
        aria-hidden="true"
      >→</span>
    </span>
  </button>
</template>

<style scoped>
.branch-node {
  padding: 1.35rem;
  border-width: 1px;
}

.branch-direct {
  border-radius: 2.7rem 2.1rem 2.8rem 2.2rem;
}

.branch-distant {
  border-radius: 2.1rem 2.8rem 2.2rem 3rem;
}

.branch-alternative {
  border-radius: 2.8rem 2.2rem 3rem 2.1rem;
}
</style>
