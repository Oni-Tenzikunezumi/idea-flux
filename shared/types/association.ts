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

export type FocusedCellSource = 'initial' | 'ai' | 'user'

export type FocusedCellKind =
  | 'root'
  | AssociationType
  | 'custom'

export interface FocusedCellContext {
  label?: string
  description?: string
  source?: FocusedCellSource
  kind?: FocusedCellKind
}

export interface AssociationRequest {
  theme: string
  prompt: string
  focusedCell?: FocusedCellContext
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
