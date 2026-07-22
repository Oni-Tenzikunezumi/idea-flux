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
      <div v-if="open && association" class="dialog-backdrop" @click.self="emit('cancel')">
        <section
          class="dialog-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-description"
        >
          <span class="dialog-kicker">Continue exploring</span>
          <h2 id="confirm-title">
            「{{ association.label }}」から<br>
            連想を続けますか？
          </h2>
          <p id="confirm-description">
            現在のカードを起点に、新しい3つの方向を生成します。
          </p>
          <div class="dialog-actions">
            <button type="button" class="cancel-button" autofocus @click="emit('cancel')">
              キャンセル
            </button>
            <button type="button" class="confirm-button" @click="emit('confirm')">
              この項目から続ける
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(19, 31, 25, 0.56);
  backdrop-filter: blur(7px);
}

.dialog-panel {
  width: min(500px, 100%);
  padding: 35px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 22px;
  background: #fffefa;
  box-shadow: 0 28px 90px rgba(12, 26, 18, 0.3);
}

.dialog-kicker {
  color: #b0542e;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

h2 {
  margin: 13px 0 15px;
  color: #18241e;
  font-family: Georgia, "Yu Mincho", serif;
  font-size: clamp(1.55rem, 5vw, 2rem);
  font-weight: 550;
  line-height: 1.5;
}

p {
  margin: 0;
  color: #6c7871;
  font-size: 0.88rem;
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

button {
  min-height: 45px;
  padding: 10px 17px;
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 750;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #ced5cf;
  color: #536159;
  background: transparent;
}

.confirm-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #276144;
  color: #fff;
  background: #276144;
}

button:hover { filter: brightness(0.94); }
button:focus-visible { outline: 3px solid rgba(48, 116, 79, 0.3); outline-offset: 2px; }

.dialog-enter-active,
.dialog-leave-active { transition: opacity 160ms ease; }
.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel { transition: transform 180ms ease, opacity 180ms ease; }
.dialog-enter-from,
.dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel { opacity: 0; transform: translateY(12px) scale(0.98); }

@media (max-width: 480px) {
  .dialog-backdrop { padding: 12px; align-items: end; }
  .dialog-panel { padding: 28px 20px 20px; border-radius: 20px; }
  .dialog-actions { flex-direction: column-reverse; }
  button { width: 100%; justify-content: center; }
}
</style>
