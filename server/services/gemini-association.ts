import { GoogleGenAI } from '@google/genai'
import type { AssociationResponse } from '../../shared/types/association'
import { ASSOCIATION_SYSTEM_INSTRUCTION } from '../prompts/association-prompt'
import {
  associationOutputJsonSchema,
  parseAssociationOutput,
} from '../schemas/association-schema'

interface GeminiAssociationOptions {
  apiKey: string
  model?: string
}

const defaultGeminiModel = 'gemini-3.5-flash-lite'

export async function createGeminiAssociations(
  prompt: string,
  options: GeminiAssociationOptions,
): Promise<AssociationResponse> {
  const apiKey = options.apiKey.trim()
  if (!apiKey) throw new Error('Gemini API key is not configured')

  const model = options.model?.trim() || defaultGeminiModel
  const client = new GoogleGenAI({ apiKey })
  const response = await client.models.generateContent({
    model,
    contents: `次の文字列を連想の起点として扱ってください。\n\n${prompt}`,
    config: {
      systemInstruction: ASSOCIATION_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: associationOutputJsonSchema,
      maxOutputTokens: 1024,
    },
  })

  const rawOutput = response.text
  if (!rawOutput) throw new Error('Gemini returned an empty response')

  const associations = parseAssociationOutput(rawOutput)

  return {
    sourcePrompt: prompt,
    associations: [
      { ...associations[0]!, id: globalThis.crypto.randomUUID() },
      { ...associations[1]!, id: globalThis.crypto.randomUUID() },
      { ...associations[2]!, id: globalThis.crypto.randomUUID() },
    ],
  }
}
