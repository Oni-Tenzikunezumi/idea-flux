import type {
  ApiErrorResponse,
  AssociationItem,
  AssociationRequest,
  AssociationResponse,
} from '../../shared/types/association'

export type AppStatus =
  | 'idle'
  | 'loading'
  | 'showing-results'
  | 'confirming'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: ApiErrorResponse }).data
    if (data?.error?.message) return data.error.message
  }

  return '連想を生成できませんでした。時間をおいてもう一度お試しください。'
}

export function useAssociation() {
  const prompt = ref('')
  const status = ref<AppStatus>('idle')
  const associations = ref<AssociationItem[]>([])
  const history = ref<string[]>([])
  const errorMessage = ref('')
  const selectedAssociation = ref<AssociationItem | null>(null)

  const isLoading = computed(() => status.value === 'loading')

  async function requestAssociations(sourcePrompt: string): Promise<AssociationResponse> {
    const body: AssociationRequest = { prompt: sourcePrompt }
    return await $fetch<AssociationResponse>('/api/associations', {
      method: 'POST',
      body,
    })
  }

  async function submitPrompt() {
    if (isLoading.value) return

    const sourcePrompt = prompt.value.trim()
    if (!sourcePrompt) return

    const fallbackStatus: AppStatus = associations.value.length ? 'showing-results' : 'idle'
    errorMessage.value = ''
    status.value = 'loading'

    try {
      const response = await requestAssociations(sourcePrompt)

      associations.value = response.associations
      history.value = [response.sourcePrompt]
      prompt.value = response.sourcePrompt
      selectedAssociation.value = null
      status.value = 'showing-results'
    } catch (error: unknown) {
      errorMessage.value = getErrorMessage(error)
      selectedAssociation.value = null
      status.value = fallbackStatus
    }
  }

  function selectAssociation(association: AssociationItem) {
    if (status.value !== 'showing-results') return

    errorMessage.value = ''
    selectedAssociation.value = association
    status.value = 'confirming'
  }

  function cancelSelection() {
    if (status.value !== 'confirming') return

    selectedAssociation.value = null
    status.value = associations.value.length ? 'showing-results' : 'idle'
  }

  async function continueFromSelection() {
    if (status.value !== 'confirming' || !selectedAssociation.value) return

    const selection = selectedAssociation.value
    errorMessage.value = ''
    status.value = 'loading'

    try {
      const response = await requestAssociations(selection.label)

      associations.value = response.associations
      history.value = [...history.value, selection.label]
      prompt.value = response.sourcePrompt
      selectedAssociation.value = null
      status.value = 'showing-results'
    } catch (error: unknown) {
      errorMessage.value = getErrorMessage(error)
      selectedAssociation.value = null
      status.value = 'showing-results'
    }
  }

  return {
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
  }
}
