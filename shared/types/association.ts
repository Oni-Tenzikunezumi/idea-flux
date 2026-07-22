export type AssociationType =
  | 'direct'
  | 'distant'
  | 'alternative'

export interface AssociationItem {
  id: string
  type: AssociationType
  label: string
  description: string
}

export interface AssociationRequest {
  prompt: string
}

export interface AssociationResponse {
  sourcePrompt: string
  associations: [
    AssociationItem,
    AssociationItem,
    AssociationItem,
  ]
}

export interface ApiErrorResponse {
  error: {
    code:
      | 'INVALID_PROMPT'
      | 'AI_REQUEST_FAILED'
      | 'INTERNAL_ERROR'
    message: string
  }
}
