import type { AssociationType } from '../../shared/types/association'

export interface GeneratedAssociation {
  type: AssociationType
  label: string
  description: string
}

const generatedItemProperties = {
  type: {
    type: 'string',
    enum: ['direct', 'distant', 'alternative'],
    description: 'The thinking direction type.',
  },
  label: {
    type: 'string',
    minLength: 1,
    maxLength: 30,
    description: 'A concise Japanese title without Markdown.',
  },
  description: {
    type: 'string',
    minLength: 1,
    maxLength: 120,
    description: 'A concise Japanese explanation of the idea and its contribution to the theme, without Markdown.',
  },
} as const

export const associationOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    associations: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: generatedItemProperties,
        required: ['type', 'label', 'description'],
      },
    },
  },
  required: ['associations'],
} as const

const expectedTypes: AssociationType[] = [
  'direct',
  'distant',
  'alternative',
]

const japanesePattern = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/[\p{P}\p{S}\s]/gu, '')
}

function createBigrams(value: string): Set<string> {
  const characters = [...value]
  const bigrams = new Set<string>()

  if (characters.length < 2) {
    if (value) bigrams.add(value)
    return bigrams
  }

  for (let index = 0; index < characters.length - 1; index += 1) {
    bigrams.add(`${characters[index]}${characters[index + 1]}`)
  }

  return bigrams
}

function similarity(left: string, right: string): number {
  const leftBigrams = createBigrams(left)
  const rightBigrams = createBigrams(right)

  if (!leftBigrams.size || !rightBigrams.size) return 0

  let intersection = 0
  for (const bigram of leftBigrams) {
    if (rightBigrams.has(bigram)) intersection += 1
  }

  return (2 * intersection) / (leftBigrams.size + rightBigrams.size)
}

function parseItem(value: unknown, expectedType: AssociationType): GeneratedAssociation {
  if (!isPlainObject(value)) throw new Error('Invalid association item')

  const keys = Object.keys(value).sort()
  if (keys.join(',') !== 'description,label,type') {
    throw new Error('Unexpected association fields')
  }

  if (
    value.type !== expectedType
    || typeof value.label !== 'string'
    || typeof value.description !== 'string'
  ) {
    throw new Error('Invalid association values')
  }

  const label = value.label.trim()
  const description = value.description.trim()

  if (
    label.length < 1
    || label.length > 30
    || description.length < 1
    || description.length > 120
    || !japanesePattern.test(label)
    || !japanesePattern.test(description)
  ) {
    throw new Error('Association text is outside the allowed format')
  }

  return { type: expectedType, label, description }
}

export function parseAssociationOutput(rawOutput: string): GeneratedAssociation[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawOutput)
  }
  catch {
    throw new Error('Gemini output is not valid JSON')
  }

  if (!isPlainObject(parsed) || Object.keys(parsed).join(',') !== 'associations') {
    throw new Error('Invalid Gemini output object')
  }

  if (!Array.isArray(parsed.associations) || parsed.associations.length !== 3) {
    throw new Error('Gemini output must contain three associations')
  }

  const associations = parsed.associations.map((item, index) =>
    parseItem(item, expectedTypes[index]!),
  )

  const normalizedLabels = associations.map(item => normalizeText(item.label))
  const normalizedDescriptions = associations.map(item => normalizeText(item.description))
  if (
    new Set(normalizedLabels).size !== associations.length
    || new Set(normalizedDescriptions).size !== associations.length
  ) {
    throw new Error('Gemini output contains duplicate associations')
  }

  const combined = associations.map(item =>
    normalizeText(`${item.label}${item.description}`),
  )

  for (let left = 0; left < combined.length; left += 1) {
    for (let right = left + 1; right < combined.length; right += 1) {
      if (similarity(combined[left]!, combined[right]!) >= 0.82) {
        throw new Error('Gemini output associations are too similar')
      }
    }
  }

  return associations
}
