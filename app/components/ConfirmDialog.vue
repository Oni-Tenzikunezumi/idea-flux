<script setup lang="ts">
import type { AssociationItem } from '../../shared/types/association'

const props = defineProps<{
  open: boolean
  association: AssociationItem | null
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('cancel')
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open && association"
        class="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-3 backdrop-blur-md sm:p-5"
        @click.self="emit('cancel')"
      >
        <section
          class="dialog-panel w-full max-w-lg rounded-[2rem] border border-white/40 bg-paper p-6 shadow-[0_30px_100px_rgba(12,35,24,0.34)] sm:p-9"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-description"
        >
          <p class="text-[0.68rem] font-extrabold tracking-[0.18em] text-clay uppercase">
            Continue exploring
          </p>
          <h2 id="confirm-title" class="mt-3 font-display text-2xl leading-normal font-semibold sm:text-3xl">
            「{{ association.label }}」から<br>
            連想を続けますか？
          </h2>
          <p id="confirm-description" class="mt-3 text-sm leading-7 text-muted">
            この方向を新しい起点にして、次の3つの探索方向を生成します。
          </p>
          <div class="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="min-h-11 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-muted transition hover:bg-ink/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-leaf/35"
              autofocus
              @click="emit('cancel')"
            >
              キャンセル
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-leaf px-5 py-2.5 text-sm font-bold text-white transition hover:bg-leaf-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-leaf/35"
              @click="emit('confirm')"
            >
              この方向へ進む <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 160ms ease;
}

.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel {
  transition: transform 180ms ease, opacity 180ms ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}

@media (max-width: 639px) {
  .dialog-panel {
    align-self: end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active,
  .dialog-leave-active,
  .dialog-enter-active .dialog-panel,
  .dialog-leave-active .dialog-panel {
    transition-duration: 0.01ms;
  }
}
</style>
