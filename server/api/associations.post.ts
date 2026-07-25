import type {
  ApiErrorResponse,
  AssociationRequest,
  AssociationResponse,
  FocusedCellContext,
  FocusedCellKind,
  FocusedCellSource,
} from '../../shared/types/association'
import { createDummyAssociations } from '../services/dummy-association'
import { createGeminiAssociations } from '../services/gemini-association'

const invalidPromptResponse: ApiErrorResponse = {
  error: {
    code: 'INVALID_PROMPT',
    message: '入力内容を確認してください。',
  },
}

const internalErrorResponse: ApiErrorResponse = {
  error: {
    code: 'INTERNAL_ERROR',
    message: '処理中にエラーが発生しました。',
  },
}

const aiRequestFailedResponse: ApiErrorResponse = {
  error: {
    code: 'AI_REQUEST_FAILED',
    message: 'アイデアを生成できませんでした。時間をおいてもう一度お試しください。',
  },
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const focusedCellSources = new Set<FocusedCellSource>([
  'initial',
  'ai',
  'user',
])

const focusedCellKinds = new Set<FocusedCellKind>([
  'root',
  'direct',
  'distant',
  'alternative',
  'custom',
])

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: string[],
): boolean => Object.keys(value).every(key => allowedKeys.includes(key))

const parseFocusedCell = (value: unknown): FocusedCellContext | null => {
  if (!isPlainObject(value)) return null
  if (!hasOnlyKeys(value, ['label', 'description', 'source', 'kind'])) {
    return null
  }

  const focusedCell: FocusedCellContext = {}

  if ('label' in value) {
    if (typeof value.label !== 'string') return null
    const label = value.label.trim()
    if (label.length < 1 || label.length > 30) return null
    focusedCell.label = label
  }

  if ('description' in value) {
    if (typeof value.description !== 'string') return null
    const description = value.description.trim()
    if (description.length < 1 || description.length > 160) return null
    focusedCell.description = description
  }

  if ('source' in value) {
    if (
      typeof value.source !== 'string'
      || !focusedCellSources.has(value.source as FocusedCellSource)
    ) {
      return null
    }
    focusedCell.source = value.source as FocusedCellSource
  }

  if ('kind' in value) {
    if (
      typeof value.kind !== 'string'
      || !focusedCellKinds.has(value.kind as FocusedCellKind)
    ) {
      return null
    }
    focusedCell.kind = value.kind as FocusedCellKind
  }

  return focusedCell
}

const parseRequest = (body: unknown): AssociationRequest | null => {
  if (!isPlainObject(body)) {
    return null
  }

  if (
    !hasOnlyKeys(body, ['theme', 'prompt', 'focusedCell'])
    || typeof body.theme !== 'string'
    || typeof body.prompt !== 'string'
  ) {
    return null
  }

  const theme = body.theme.trim()
  const prompt = body.prompt.trim()
  if (
    theme.length < 1
    || theme.length > 500
    || prompt.length < 1
    || prompt.length > 500
  ) {
    return null
  }

  if (!('focusedCell' in body)) {
    return { theme, prompt }
  }

  const focusedCell = parseFocusedCell(body.focusedCell)
  if (!focusedCell) return null

  return { theme, prompt, focusedCell }
}

export default defineEventHandler(async (event): Promise<AssociationResponse | ApiErrorResponse> => {
  let body: unknown

  try {
    body = await readBody(event)
  }
  catch {
    setResponseStatus(event, 400)
    return invalidPromptResponse
  }

  const request = parseRequest(body)
  if (!request) {
    setResponseStatus(event, 400)
    return invalidPromptResponse
  }

  try {
    const config = useRuntimeConfig(event)
    const provider = String(config.associationProvider || 'dummy').trim()

    if (provider === 'dummy') {
      return createDummyAssociations(request)
    }

    if (provider === 'gemini') {
      try {
        return await createGeminiAssociations(request, {
          apiKey: String(config.geminiApiKey || ''),
          model: String(config.geminiModel || ''),
        })
      }
      catch {
        setResponseStatus(event, 502)
        return aiRequestFailedResponse
      }
    }

    setResponseStatus(event, 500)
    return internalErrorResponse
  }
  catch {
    setResponseStatus(event, 500)
    return internalErrorResponse
  }
})
