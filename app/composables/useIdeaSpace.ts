import type {
  ApiErrorResponse,
  AssociationRequest,
  AssociationResponse,
  AssociationType,
} from '../../shared/types/association'

export const GENERATED_ASSOCIATION_COUNT = 3
export const MAX_VISIBLE_CELLS = 50

export type IdeaNodeSource = 'initial' | 'ai' | 'user'

export type IdeaNodeKind =
  | 'root'
  | AssociationType
  | 'custom'

export interface IdeaNode {
  id: string
  label: string
  description?: string
  source: IdeaNodeSource
  kind: IdeaNodeKind
  parentId: string | null
  depth: number
  createdAt: number
}

export interface IdeaEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  kind: IdeaNodeKind
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: ApiErrorResponse }).data
    if (data?.error?.message) return data.error.message
  }

  return '連想を生成できませんでした。時間をおいてもう一度お試しください。'
}

export function useIdeaSpace() {
  const initialPrompt = ref('')
  const manualInput = ref('')
  const nodes = ref<IdeaNode[]>([])
  const edges = ref<IdeaEdge[]>([])
  const focusedNodeId = ref<string | null>(null)
  const errorMessage = ref('')
  const isGenerating = ref(false)

  const hasSpace = computed(() => nodes.value.length > 0)
  const focusedNode = computed(
    () => nodes.value.find(node => node.id === focusedNodeId.value) ?? null,
  )
  const remainingCapacity = computed(
    () => Math.max(0, MAX_VISIBLE_CELLS - nodes.value.length),
  )
  const canGenerate = computed(
    () =>
      Boolean(focusedNode.value)
      && !isGenerating.value
      && remainingCapacity.value >= GENERATED_ASSOCIATION_COUNT,
  )
  const canAddManual = computed(
    () =>
      Boolean(focusedNode.value)
      && !isGenerating.value
      && remainingCapacity.value >= 1,
  )
  const capacityMessage = computed(() => {
    if (remainingCapacity.value === 0) {
      return '表示できるセルの上限に達しました。'
    }

    if (remainingCapacity.value < GENERATED_ASSOCIATION_COUNT) {
      return `AI生成には3つ分の空きが必要です。残り${remainingCapacity.value}件は手動で追加できます。`
    }

    return ''
  })

  async function requestAssociations(sourcePrompt: string): Promise<AssociationResponse> {
    const body: AssociationRequest = { prompt: sourcePrompt }
    return await $fetch<AssociationResponse>('/api/associations', {
      method: 'POST',
      body,
    })
  }

  async function generateChildren(parentId: string) {
    if (isGenerating.value) return

    const parent = nodes.value.find(node => node.id === parentId)
    if (!parent) return

    if (remainingCapacity.value < GENERATED_ASSOCIATION_COUNT) {
      errorMessage.value = capacityMessage.value
      return
    }

    errorMessage.value = ''
    isGenerating.value = true

    try {
      const response = await requestAssociations(parent.label)
      const createdAt = Date.now()
      const childNodes: IdeaNode[] = response.associations.map((association, index) => ({
        id: association.id,
        label: association.label,
        description: association.description,
        source: 'ai',
        kind: association.type,
        parentId: parent.id,
        depth: parent.depth + 1,
        createdAt: createdAt + index,
      }))
      const childEdges: IdeaEdge[] = childNodes.map(node => ({
        id: globalThis.crypto.randomUUID(),
        fromNodeId: parent.id,
        toNodeId: node.id,
        kind: node.kind,
      }))

      nodes.value = [...nodes.value, ...childNodes]
      edges.value = [...edges.value, ...childEdges]
    }
    catch (error: unknown) {
      errorMessage.value = getErrorMessage(error)
    }
    finally {
      isGenerating.value = false
    }
  }

  async function startSpace() {
    if (hasSpace.value || isGenerating.value) return

    const label = initialPrompt.value.trim()
    if (!label) return

    const root: IdeaNode = {
      id: globalThis.crypto.randomUUID(),
      label,
      source: 'initial',
      kind: 'root',
      parentId: null,
      depth: 0,
      createdAt: Date.now(),
    }

    nodes.value = [root]
    edges.value = []
    focusedNodeId.value = root.id
    initialPrompt.value = label
    errorMessage.value = ''

    await generateChildren(root.id)
  }

  async function generateFromFocusedNode() {
    if (!focusedNodeId.value) return
    await generateChildren(focusedNodeId.value)
  }

  function focusNode(nodeId: string) {
    if (isGenerating.value) return
    if (!nodes.value.some(node => node.id === nodeId)) return

    focusedNodeId.value = nodeId
    errorMessage.value = ''
  }

  function addManualNode() {
    if (!canAddManual.value || !focusedNode.value) return

    const label = manualInput.value.trim()
    if (!label || label.length > 30) return

    const parent = focusedNode.value
    const node: IdeaNode = {
      id: globalThis.crypto.randomUUID(),
      label,
      source: 'user',
      kind: 'custom',
      parentId: parent.id,
      depth: parent.depth + 1,
      createdAt: Date.now(),
    }
    const edge: IdeaEdge = {
      id: globalThis.crypto.randomUUID(),
      fromNodeId: parent.id,
      toNodeId: node.id,
      kind: 'custom',
    }

    nodes.value = [...nodes.value, node]
    edges.value = [...edges.value, edge]
    manualInput.value = ''
    errorMessage.value = ''
  }

  return {
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
    maxVisibleCells: MAX_VISIBLE_CELLS,
    startSpace,
    generateFromFocusedNode,
    focusNode,
    addManualNode,
  }
}
