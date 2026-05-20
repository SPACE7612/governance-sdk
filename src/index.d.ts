declare module '@buildpaid/governance-sdk' {

  // ─── SDK Configuration ───────────────────────────────────

  interface BuildPaidOptions {
    apiKey: string;
    sdkSecret?: string;
    verifySignatures?: boolean;
    baseUrl?: string;
    timeout?: number;
  }

  // ─── Kernel Record Types ─────────────────────────────────
  // Every governed event produces a typed, immutable, cryptographically
  // anchored record. These are compilation artifacts, not database rows.

  /** Provenance anchor attached to every kernel record */
  interface ProvenanceAnchor {
    sha256: string;
    sha3_256: string;
    blake2b_512: string;
    parent_hash: string | null;
    chain_depth: number;
    anchor_time: string;
    kernel_sequence: number;
  }

  /** Verdict issued by the governance compiler */
  interface VerdictRecord {
    verdict_id: string;
    entity_id: string;
    verdict: 'FUNDABLE' | 'BLOCKED' | 'REVIEW' | 'CONDITIONAL';
    score: number;
    grade: string;
    compiler_version: string;
    engines_invoked: number;
    findings: FindingRecord[];
    evidence: EvidenceRecord[];
    provenance: ProvenanceAnchor;
    issued_at: string;
    immutable: true;
  }

  /** Individual finding within a verdict */
  interface FindingRecord {
    finding_id: string;
    engine: string;
    severity: 'CLEAR' | 'WARNING' | 'VIOLATION' | 'BLOCK';
    rail: string;
    description: string;
    evidence_refs: string[];
  }

  /** Evidence accumulated during compilation — append-only */
  interface EvidenceRecord {
    evidence_id: string;
    type: 'DOCUMENT' | 'INSPECTION' | 'FINANCIAL' | 'LABOR' | 'THERMAL' | 'TEMPORAL' | 'SIGNATURE';
    source: string;
    content_hash: string;
    ingested_at: string;
    provenance: ProvenanceAnchor;
  }

  /** Adequacy vector — 6-dimensional governance fitness */
  interface AdequacyRecord {
    entity_id: string;
    dimensions: {
      documentation: number;
      compliance: number;
      financial: number;
      temporal: number;
      labor: number;
      provenance: number;
    };
    composite_score: number;
    sufficient: boolean;
    threshold: number;
    provenance: ProvenanceAnchor;
    assessed_at: string;
  }

  /** Risk delta between consecutive governance states */
  interface RiskDeltaRecord {
    entity_id: string;
    previous_score: number;
    current_score: number;
    delta: number;
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    drift_rate: number;
    contributing_factors: string[];
    provenance: ProvenanceAnchor;
    computed_at: string;
  }

  /** Payment instruction produced by the verdict compiler */
  interface PaymentInstructionRecord {
    instruction_id: string;
    verdict_id: string;
    entity_id: string;
    amount: number;
    currency: string;
    rail: 'ACH' | 'WIRE' | 'CHECK' | 'HOLDBACK';
    status: 'EXECUTABLE' | 'GATED' | 'BLOCKED';
    gate_conditions: string[];
    lien_waiver_required: boolean;
    retainage_held: number;
    provenance: ProvenanceAnchor;
    compiled_at: string;
    immutable: true;
  }

  /** Governance credit score for an entity */
  interface GovernanceCreditRecord {
    entity_id: string;
    entity_type: 'CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'PROJECT';
    credit_score: number;
    tier: 'PRIME' | 'STANDARD' | 'WATCH' | 'RESTRICTED';
    factors: {
      compliance_history: number;
      payment_velocity: number;
      documentation_quality: number;
      dispute_frequency: number;
      provenance_integrity: number;
      temporal_reliability: number;
    };
    trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    observation_window_days: number;
    provenance: ProvenanceAnchor;
    scored_at: string;
  }

  /** Governance profile — industry-specific compilation rules */
  interface GovernanceProfile {
    profile_id: string;
    industry: 'CONSTRUCTION' | 'TREASURY' | 'INSURANCE' | 'GOVERNMENT' | 'SUPPLY_CHAIN';
    engines: string[];
    engine_count: number;
    compilation_rules: number;
    adequacy_threshold: number;
    payment_rails: string[];
    regulatory_framework: string;
  }

  // ─── API Response Types ──────────────────────────────────

  interface ApiResponse<T> {
    ok: boolean;
    method: string;
    data: T;
    kernel_event: string;
    timestamp: string;
  }

  type ScoreResult = ApiResponse<{
    score: number;
    grade: string;
    rails?: Record<string, 'CLEAR' | 'BLOCKED' | 'PENDING'>;
    provenance_hash?: string;
    [key: string]: any;
  }>;

  type FundabilityResult = ApiResponse<{
    score: number;
    verdict: 'FUNDABLE' | 'BLOCKED';
    pral_decision: string;
    provenance_hash?: string;
    [key: string]: any;
  }>;

  type ComplianceResult = ApiResponse<{
    rails: Record<string, 'CLEAR' | 'BLOCKED' | 'PENDING'>;
    [key: string]: any;
  }>;

  type ProvenanceResult = ApiResponse<{
    status: 'AUTHENTIC' | 'TAMPERED';
    chain_depth: number;
    anchor_time: string;
    [key: string]: any;
  }>;

  type EventsResult = ApiResponse<{
    events: Array<{
      type: string;
      entity_id: string;
      timestamp: string;
      provenance_hash: string;
      [key: string]: any;
    }>;
  }>;

  type CreditResult = ApiResponse<GovernanceCreditRecord>;
  type AdequacyResult = ApiResponse<AdequacyRecord>;
  type ProfileResult = ApiResponse<GovernanceProfile>;
  type PaymentResult = ApiResponse<PaymentInstructionRecord>;
  type VerdictResult = ApiResponse<VerdictRecord>;

  // ─── Client ──────────────────────────────────────────────

  class BuildPaid {
    constructor(options: BuildPaidOptions);

    score: {
      compliance(params: { project_id: string }): Promise<ScoreResult>;
      fundability(params: { contract_id: string }): Promise<FundabilityResult>;
      bpi(params: { project_id: string }): Promise<ScoreResult>;
      exposure(params: { project_id?: string }): Promise<ScoreResult>;
      credit(params: { entity_id: string }): Promise<CreditResult>;
      adequacy(params: { entity_id: string }): Promise<AdequacyResult>;
    };

    compliance: {
      status(params: { project_id: string }): Promise<ComplianceResult>;
      gates(params: { project_id: string }): Promise<ComplianceResult>;
      documents(params: { entity_id: string }): Promise<ComplianceResult>;
      cpral(params: { project_id: string }): Promise<ComplianceResult>;
    };

    governance: {
      profile(params: { industry: string }): Promise<ProfileResult>;
      compile(params: { project_id: string; profile?: string }): Promise<VerdictResult>;
      payment(params: { verdict_id: string }): Promise<PaymentResult>;
    };

    provenance: {
      verify(params: { hash: string }): Promise<ProvenanceResult>;
      export(params: { project_id: string }): Promise<ProvenanceResult>;
      chain(params: { project_id: string }): Promise<ProvenanceResult>;
    };

    events: {
      subscribe(params: { events: string[]; webhook_url: string }): Promise<any>;
      recent(params: { entity_id: string; limit?: number }): Promise<EventsResult>;
    };

    verifyWebhook(payload: string, signature: string): boolean;

    static VERSION: string;
    static BuildPaidError: typeof BuildPaidError;
    static SignatureError: typeof SignatureError;
  }

  class BuildPaidError extends Error {
    code: string;
    method: string;
  }

  class SignatureError extends BuildPaidError {}

  export = BuildPaid;
}
