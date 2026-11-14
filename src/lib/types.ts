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
  is_superuser: boolean;
  must_change_password: boolean;
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
  questionnaire_variant: string;
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

export type Option = { value: string; label: string };

export type Catalogs = {
  vulnerabilities: { code: string; label: string; group: string; group_label: string; sensitive: boolean }[];
  assistance_categories: Option[];
  delivery_channels: Option[];
  operation_kinds: Option[];
  operation_statuses: Option[];
  case_statuses: Option[];
  case_needs: Option[];
  occupancy: Option[];
  partner_kinds: Option[];
  grievance_categories: Option[];
  grievance_channels: Option[];
  grievance_priorities: Option[];
  grievance_statuses: Option[];
  referral_services: Option[];
  referral_statuses: Option[];
  visit_kinds: Option[];
  visit_trends: Option[];
};

export type Partner = {
  id: string;
  organization: string;
  name: string;
  acronym: string;
  kind: string;
  kind_label: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  is_active: boolean;
};

export type Operation = {
  id: string;
  organization: string;
  code: string;
  title: string;
  kind: string;
  kind_label: string;
  status: string;
  status_label: string;
  description: string;
  initiated_by: string | null;
  initiated_by_name: string | null;
  partners: string[];
  partners_detail: Partner[];
  territory: string | null;
  territory_name: string | null;
  sites: string;
  legal_reference: string;
  notice_date: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_households: number | null;
  compensation_policy: string;
  compensation_amount_per_household: string | null;
  persons_count: number;
  created_at: string;
};

export type OperationStats = {
  persons: number;
  households: number;
  by_status: Record<string, number>;
  lost_housing: number;
  lost_livelihood: number;
  lost_documents: number;
  children_schooling_disrupted: number;
  needs: Record<string, number>;
  persons_helped: number;
  persons_without_aid: number;
  persons_compensated: number;
  compensation_due_total: number;
  aid_delivered_amount: number;
  aid_planned_amount: number;
  aid_by_category: Record<string, number>;
  lost_contact: number;
};

export type OperationCase = {
  id: string;
  operation: string;
  operation_title: string;
  operation_code: string;
  operation_kind: string;
  person: string;
  person_name: string;
  person_code: string;
  person_phone: string;
  household: string | null;
  household_code: string | null;
  case_number: string;
  status: string;
  status_label: string;
  occupancy: string;
  occupancy_label: string;
  lost_housing: boolean;
  lost_livelihood: boolean;
  lost_documents: boolean;
  children_schooling_disrupted: boolean;
  lost_assets: string;
  needs: string[];
  needs_labels: string[];
  current_location: string;
  relocation_site: string;
  compensation_due: string | null;
  notes: string;
  last_contact_at: string | null;
  aid_summary: { delivered: number; planned: number; delivered_amount: number };
  created_at: string;
};

export type Assistance = {
  id: string;
  person: string;
  person_name: string;
  person_code: string;
  operation_case: string | null;
  operation_title: string | null;
  program: string | null;
  program_name: string | null;
  provider: string | null;
  provider_name: string | null;
  category: string;
  category_label: string;
  description: string;
  quantity: string | null;
  unit: string;
  amount: string | null;
  status: "planned" | "delivered" | "cancelled";
  status_label: string;
  planned_date: string | null;
  delivered_at: string | null;
  delivery_proof: string;
  delivery_channel: string;
  cancel_reason: string;
  recorded_by_name: string | null;
  delivered_by_name: string | null;
  created_at: string;
};

export type Vulnerability = {
  id: string;
  person: string;
  category: string;
  label: string;
  group: string;
  status: "suspected" | "confirmed" | "resolved";
  status_label: string;
  source: string;
  source_label: string;
  notes: string;
  operation_title: string | null;
  recorded_by_name: string | null;
  created_at: string;
};

export type AdminUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_superuser: boolean;
  must_change_password: boolean;
  last_login: string | null;
  memberships: { id: string; organization: string; organization_name: string; role: string; role_label: string }[];
  temporary_password?: string;
};

export type RoleInfo = { value: string; label: string; permissions: { code: string; label: string }[] };

export type AdminOrganization = {
  id: string;
  code: string;
  name: string;
  kind: string;
  country: string;
  status: string;
  members_count: number;
  created_at: string;
};

export type Grievance = {
  id: string;
  organization: string;
  reference: string;
  person: string | null;
  person_name: string | null;
  person_code: string | null;
  operation: string | null;
  operation_title: string | null;
  territory: string | null;
  territory_name: string | null;
  anonymous: boolean;
  complainant_name: string;
  complainant_phone: string;
  channel: string;
  channel_label: string;
  category: string;
  category_label: string;
  priority: "urgent" | "high" | "normal";
  priority_label: string;
  subject: string;
  description: string;
  status: string;
  status_label: string;
  due_date: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  escalated_to: string;
  resolution: string;
  resolved_at: string | null;
  satisfaction: string;
  is_overdue: boolean;
  is_confidential: boolean;
  allowed_transitions: Option[];
  created_at: string;
};

export type Referral = {
  id: string;
  organization: string;
  reference: string;
  person: string;
  person_name: string;
  person_code: string;
  operation_case: string | null;
  service: string;
  service_label: string;
  partner: string | null;
  partner_name: string | null;
  service_name: string;
  reason: string;
  urgent: boolean;
  status: string;
  status_label: string;
  appointment_date: string | null;
  feedback: string;
  closed_at: string | null;
  referred_by_name: string | null;
  allowed_transitions: Option[];
  created_at: string;
};

export type Visit = {
  id: string;
  person: string;
  person_name: string;
  person_code: string;
  operation_case: string | null;
  kind: string;
  kind_label: string;
  visited_at: string;
  person_present: boolean;
  trend: "improved" | "stable" | "worsened" | "critical";
  trend_label: string;
  summary: string;
  next_visit_date: string | null;
  visited_by_name: string | null;
  overdue?: boolean;
  created_at: string;
};

export type TerritoryRow = {
  territory: string | null;
  name: string;
  level: string | null;
  households: number;
  persons: number | null;
  vulnerable_persons: number | null;
  vulnerability_rate: number | null;
  aids_delivered: number;
  aid_amount: number;
  open_cases: number;
  open_grievances: number;
  suppressed: boolean;
};
