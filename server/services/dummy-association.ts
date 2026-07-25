import type {
  AssociationRequest,
  AssociationResponse,
} from '../../shared/types/association'

const compactPrompt = (prompt: string) => {
  const singleLine = prompt.replace(/\s+/g, ' ')

  return singleLine.length > 18
    ? `${singleLine.slice(0, 18)}…`
    : singleLine
}

export const createDummyAssociations = (
  request: AssociationRequest,
): AssociationResponse => {
  const subject = compactPrompt(request.prompt)
  const theme = compactPrompt(request.theme)

  return {
    sourcePrompt: request.prompt,
    associations: [
      {
        id: globalThis.crypto.randomUUID(),
        type: 'direct',
        label: `${subject}を深める`,
        description: `「${subject}」を具体化し、「${theme}」を実現・発展させるための次の手がかりにします。`,
      },
      {
        id: globalThis.crypto.randomUUID(),
        type: 'distant',
        label: `${subject}を別分野へ`,
        description: `別分野の仕組みや素材を「${subject}」へ取り込み、「${theme}」の選択肢を広げます。`,
      },
      {
        id: globalThis.crypto.randomUUID(),
        type: 'alternative',
        label: `${subject}を逆から見る`,
        description: `「${subject}」の前提や立場を変え、「${theme}」を別の角度から前進させます。`,
      },
    ],
  }
}
