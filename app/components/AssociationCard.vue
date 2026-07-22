<script setup lang="ts">
import type { AssociationItem, AssociationType } from '../../shared/types/association'

const props = defineProps<{
  association: AssociationItem
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [association: AssociationItem]
}>()

const typeDetails: Record<AssociationType, { label: string, number: string }> = {
  direct: { label: '直接関係', number: '01' },
  distant: { label: '少し離れた', number: '02' },
  alternative: { label: '別観点', number: '03' },
}

const details = computed(() => typeDetails[props.association.type])
</script>

<template>
  <button
    class="association-card"
    :class="`is-${association.type}`"
    type="button"
    :disabled="disabled"
    :aria-label="`${details.label}のカード「${association.label}」を選択`"
    @click="emit('select', association)"
  >
    <span class="card-topline">
      <span class="type-label">{{ details.label }}</span>
      <span class="card-number">{{ details.number }}</span>
    </span>
    <span class="card-content">
      <strong>{{ association.label }}</strong>
      <span>{{ association.description }}</span>
    </span>
    <span class="card-action">
      このカードから続ける
      <span aria-hidden="true">→</span>
    </span>
  </button>
</template>

<style scoped>
.association-card {
  --accent: #2e7150;
  display: flex;
  min-height: 285px;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px;
  border: 1px solid rgba(41, 67, 53, 0.15);
  border-top: 4px solid var(--accent);
  border-radius: 17px;
  color: #19241e;
  background: rgba(255, 255, 252, 0.94);
  box-shadow: 0 14px 42px rgba(38, 58, 47, 0.075);
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.association-card.is-distant { --accent: #d69030; }
.association-card.is-alternative { --accent: #c65d3b; }

.association-card:not(:disabled):hover,
.association-card:not(:disabled):focus-visible {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--accent) 58%, transparent);
  box-shadow: 0 20px 50px rgba(38, 58, 47, 0.14);
  outline: none;
}

.association-card:disabled {
  cursor: wait;
}

.card-topline,
.card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.type-label {
  color: var(--accent);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.09em;
}

.card-number {
  color: #b3bbb5;
  font-family: Georgia, serif;
  font-size: 0.8rem;
  font-style: italic;
}

.card-content {
  display: block;
  margin: 25px 0;
}

.card-content strong,
.card-content > span {
  display: block;
}

.card-content strong {
  margin-bottom: 14px;
  font-family: Georgia, "Yu Mincho", serif;
  font-size: 1.36rem;
  font-weight: 600;
  line-height: 1.45;
}

.card-content > span {
  color: #65736b;
  font-size: 0.87rem;
  line-height: 1.75;
}

.card-action {
  padding-top: 15px;
  border-top: 1px solid #e1e5e1;
  color: #52645a;
  font-size: 0.75rem;
  font-weight: 750;
}

.card-action > span {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--accent);
  font-size: 0.9rem;
  transition: transform 180ms ease;
}

.association-card:hover .card-action > span {
  transform: translateX(3px);
}

@media (max-width: 760px) {
  .association-card { min-height: 235px; }
}
</style>
