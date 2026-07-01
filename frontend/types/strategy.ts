export type RiskProfile = "low" | "medium" | "high"

export interface Strategy {
  id: number
  name: string
  description: string | null
  risk_profile: RiskProfile
  qc_project_id: string | null
  compile_id: string | null
  code_hash: string | null
  compiled_at: string | null
  is_active: boolean
  is_live: boolean
}
