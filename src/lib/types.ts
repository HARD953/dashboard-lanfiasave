export type Membership = {
  id: string;
  organization: string;
  organization_name: string;
  role: string;
  role_label: string;
  program: string | null;
  program_name: string | null;
  permissions: string[];
};

export type Me = {
  id: string;
  username: string;
  full_name: string;
  kind: "staff" | "beneficiary";
  memberships: Membership[];
};

export type Person = {
  id: string;
  organization: string;
  public_code: string;
  is_provisional: boolean;
  enrollment_context: string;
  first_name: string;
  last_name: string;
  usual_name: string;
  display_name: string;
  sex: "F" | "M" | "U";
  birth_date: string | null;
  estimated_age: number | null;
  age: number | null;
  phone: string;
  language: string;
  territory: string | null;
  territory_name: string | null;
  residence_status: string;
  health_coverage_number: string;
  has_identity_document: boolean;
  status: string;
  status_label: string;
  merged_into: string | null;
  household: { id: string; code: string; relation: string } | null;
  has_beneficiary_access: boolean;
  open_duplicates: number;
  latest_score: { id: string; total: number; band: string; is_reliable: boolean } | null;
  masked?: boolean;
  created_at: string;
};

export type ScoreDimension = {
  code: string;
  label: string;
  cap: number;
  score: number;
  completeness: number;
  contributions: { question: string; value: unknown; points: number; max: number }[];
  missing: { question: string; reason: string }[];
};

export type ScoreResult = {
  id: string;
  person: string;
  survey_response: string;
  scoring_version_label: string;
  total: number;
  band: string;
  completeness: string;
  is_reliable: boolean;
  details: { dimensions: ScoreDimension[]; missing: { dimension: string; question: string; reason: string }[] };
  computed_by_name: string | null;
  created_at: string;
  disclaimer: string;
};

export type SurveyResponse = {
  id: string;
  person: string;
  questionnaire: string;
  questionnaire_label: string;
  answers: Record<string, unknown>;
  collected_at: string;
  collected_by_name: string | null;
};

export type Program = {
  id: string;
  organization: string;
  code: string;
  name: string;
  description: string;
  sector: string;
  sector_label: string;
  status: string;
  status_label: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: string | null;
  currency: string;
  target_beneficiaries: number | null;
  territories: string[];
  eligibility_summary: string;
  funders: string;
  applications_count: number;
  current_rule: { id: string; version: number; effective_from: string; description: string } | null;
};

export type Decision = {
  id: string;
  application: string;
  person_name: string;
  program_name: string;
  outcome: "approved" | "rejected" | "deferred";
  outcome_label: string;
  motive: string;
  internal_notes: string;
  decided_by_name: string;
  committee_members: string[];
  quorum_met: boolean;
  score_snapshot: { total: number; band: string; version: string } | null;
  supersedes: string | null;
  created_at: string;
};

export type Application = {
  id: string;
  organization: string;
  program: string;
  program_name: string;
  person: string;
  person_name: string;
  person_code: string;
  status: string;
  status_label: string;
  status_reason: string;
  score: string | null;
  score_summary: { total: number; band: string; completeness: number; is_reliable: boolean } | null;
  social_opinion: string;
  current_decision: Decision | null;
  history: { from_status: string; to_status: string; reason: string; actor_name: string | null; created_at: string }[];
  created_at: string;
};

export type Appeal = {
  id: string;
  decision: string;
  person_name: string;
  motive: string;
  filed_via: string;
  filed_by_name: string | null;
  status: string;
  status_label: string;
  due_date: string;
  resolution: string;
  resolved_at: string | null;
  created_at: string;
};

export type Territory = { id: string; code: string; name: string; level: string; level_label: string; parent: string | null };

export type Questionnaire = {
  id: string;
  code: string;
  version: number;
  definition: {
    sections: {
      code: string;
      title: string;
      questions: { code: string; label: string; type: string; options?: { value: string; label: string }[] }[];
    }[];
    special_values: Record<string, string>;
  };
};
