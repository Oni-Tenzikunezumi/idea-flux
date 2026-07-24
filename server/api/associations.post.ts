import type {
  ApiErrorResponse,
  AssociationRequest,
  AssociationResponse,
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
    message: '連想を生成できませんでした。時間をおいてもう一度お試しください。',
  },
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const parseRequest = (body: unknown): AssociationRequest | null => {
  if (!isPlainObject(body)) {
    return null
  }

  const keys = Object.keys(body)
  if (keys.length !== 1 || keys[0] !== 'prompt' || typeof body.prompt !== 'string') {
    return null
  }

  const prompt = body.prompt.trim()
  if (prompt.length < 1 || prompt.length > 500) {
    return null
  }

  return { prompt }
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
      return createDummyAssociations(request.prompt)
    }

    if (provider === 'gemini') {
      try {
        return await createGeminiAssociations(request.prompt, {
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
