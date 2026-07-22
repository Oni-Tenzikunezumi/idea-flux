import type { AssociationResponse } from '../../shared/types/association'

const compactPrompt = (prompt: string) => {
  const singleLine = prompt.replace(/\s+/g, ' ')

  return singleLine.length > 18
    ? `${singleLine.slice(0, 18)}…`
    : singleLine
}

export const createDummyAssociations = (prompt: string): AssociationResponse => {
  const subject = compactPrompt(prompt)

  return {
    sourcePrompt: prompt,
    associations: [
      {
        id: globalThis.crypto.randomUUID(),
        type: 'direct',
        label: `${subject}を深める`,
        description: `「${subject}」の中心的な特徴を掘り下げ、具体的な形へ発展させるアイデアです。`,
      },
      {
        id: globalThis.crypto.randomUUID(),
        type: 'distant',
        label: `${subject}を別分野へ`,
        description: `「${subject}」の要素を少し離れた分野と組み合わせ、新しいつながりを探るアイデアです。`,
      },
      {
        id: globalThis.crypto.randomUUID(),
        type: 'alternative',
        label: `${subject}を逆から見る`,
        description: `「${subject}」の前提や立場を反転させ、別の視点から捉え直すアイデアです。`,
      },
    ],
  }
}
