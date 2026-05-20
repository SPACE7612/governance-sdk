declare module '@buildpaid/governance-sdk' {
  interface BuildPaidOptions {
    apiKey: string;
    sdkSecret?: string;
    verifySignatures?: boolean;
    baseUrl?: string;
    timeout?: number;
  }

  interface ScoreResult {
    ok: boolean;
    method: string;
    data: {
      score: number;
      grade: string;
      [key: string]: any;
    };
    kernel_event: string;
    timestamp: string;
  }

  interface FundabilityResult {
    ok: boolean;
    method: string;
    data: {
      score: number;
      verdict: 'FUNDABLE' | 'BLOCKED';
      pral_decision: string;
      [key: string]: any;
    };
    kernel_event: string;
    timestamp: string;
  }

  interface ComplianceResult {
    ok: boolean;
    method: string;
    data: {
      rails: Record<string, 'CLEAR' | 'BLOCKED' | 'PENDING'>;
      [key: string]: any;
    };
    kernel_event: string;
    timestamp: string;
  }

  interface ProvenanceResult {
    ok: boolean;
    method: string;
    data: {
      status: 'AUTHENTIC' | 'TAMPERED';
      chain_depth: number;
      anchor_time: string;
      [key: string]: any;
    };
    kernel_event: string;
    timestamp: string;
  }

  interface EventsResult {
    ok: boolean;
    method: string;
    data: {
      events: Array<{
        type: string;
        entity_id: string;
        timestamp: string;
        provenance_hash: string;
        [key: string]: any;
      }>;
    };
    kernel_event: string;
    timestamp: string;
  }

  class BuildPaid {
    constructor(options: BuildPaidOptions);

    score: {
      compliance(params: { project_id: string }): Promise<ScoreResult>;
      fundability(params: { contract_id: string }): Promise<FundabilityResult>;
      bpi(params: { project_id: string }): Promise<ScoreResult>;
      exposure(params: { project_id?: string }): Promise<ScoreResult>;
    };

    compliance: {
      status(params: { project_id: string }): Promise<ComplianceResult>;
      gates(params: { project_id: string }): Promise<ComplianceResult>;
      documents(params: { entity_id: string }): Promise<ComplianceResult>;
      cpral(params: { project_id: string }): Promise<ComplianceResult>;
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
