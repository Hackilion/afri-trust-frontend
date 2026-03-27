/**
 * Mock payloads for the Settings → Integration demo (no real network calls).
 * Embeds the active workspace organisation so tenants see their own scope.
 */

export type DemoLogKind = 'info' | 'success' | 'webhook';

export type IntegrationDemoLogEntry = {
  id: string;
  at: string;
  kind: DemoLogKind;
  title: string;
  detail?: string;
  request?: unknown;
  response?: unknown;
  webhookPayload?: unknown;
};

function rid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function buildIntegrationDemoSequence(
  organizationId: string,
  organizationName: string
): Omit<IntegrationDemoLogEntry, 'id' | 'at'>[] {
  const sessionId = `sess_${organizationId.replace(/[^a-z0-9]/gi, '').slice(0, 6)}_${rid().slice(-6)}`;
  const applicantId = `APL-DEMO-${rid().slice(-8).toUpperCase()}`;

  const baseUrl = 'https://api.afritrust.io/v1';

  return [
    {
      kind: 'info',
      title: 'API authentication',
      detail: 'Your server sends the secret key in the Authorization header. Keys are scoped to this organisation only.',
      request: {
        method: 'GET',
        url: `${baseUrl}/workspace`,
        headers: {
          Authorization: 'Bearer aft_test_sk_••••••••••••7n2p',
          'X-AfriTrust-Org': organizationId,
        },
      },
      response: {
        id: organizationId,
        name: organizationName,
        environment: 'test',
        region: 'sandbox',
      },
    },
    {
      kind: 'success',
      title: 'Create verification session',
      detail:
        'POST with an existing applicant UUID and a published workflow UUID. The API returns session id, status, and step progress; drive the flow with attributes, documents, and biometrics endpoints.',
      request: {
        method: 'POST',
        url: `${baseUrl}/verifications`,
        headers: {
          Authorization: 'Bearer aft_test_sk_••••••••••••7n2p',
          'Content-Type': 'application/json',
        },
        body: {
          applicant_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          workflow_id: '11111111-2222-3333-4444-555555555555',
        },
      },
      response: {
        id: sessionId,
        org_id: organizationId,
        applicant_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        workflow_id: '11111111-2222-3333-4444-555555555555',
        workflow_version: 1,
        current_step_order: 1,
        status: 'created',
        result: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      kind: 'webhook',
      title: 'Webhook: applicant.created',
      detail:
        'AfriTrust signs this POST with HMAC-SHA256 (header X-AfriTrust-Signature). Your endpoint should verify the signature, then 2xx quickly.',
      webhookPayload: {
        id: `evt_${rid()}`,
        type: 'applicant.created',
        api_version: '2026-03-01',
        created_at: new Date().toISOString(),
        data: {
          object: 'applicant',
          id: applicantId,
          organization_id: organizationId,
          status: 'pending',
          external_reference: 'cust_8821',
          intake_channel: 'web_portal',
        },
      },
      request: {
        method: 'POST',
        url: 'https://api.yourapp.com/webhooks/afritrust',
        headers: {
          'Content-Type': 'application/json',
          'X-AfriTrust-Signature': 't=1730000000,v1=mock_hmac_signature_for_demo',
          'X-AfriTrust-Delivery': `del_${rid().slice(0, 12)}`,
        },
      },
      response: { received: true, http_status_from_your_server: 200 },
    },
    {
      kind: 'success',
      title: 'Fetch applicant status',
      detail: 'After the user finishes the flow, poll or wait for verification.approved via webhook.',
      request: {
        method: 'GET',
        url: `${baseUrl}/applicants/${applicantId}`,
        headers: {
          Authorization: 'Bearer aft_test_sk_••••••••••••7n2p',
        },
      },
      response: {
        id: applicantId,
        organization_id: organizationId,
        status: 'verified',
        tier: 'standard',
        risk_score: 14,
        verified_at: new Date().toISOString(),
      },
    },
    {
      kind: 'webhook',
      title: 'Webhook: verification.approved',
      detail: 'AfriTrust POSTs JSON with X-AfriTrust-Event and X-AfriTrust-Signature (HMAC-SHA256 of the body).',
      webhookPayload: {
        session_id: `ses_${rid().slice(0, 12)}`,
        applicant_id: applicantId,
      },
      request: {
        method: 'POST',
        url: 'https://api.yourapp.com/webhooks/afritrust',
        headers: {
          'Content-Type': 'application/json',
          'X-AfriTrust-Event': 'verification.approved',
          'X-AfriTrust-Signature': 'hex_hmac_sha256_of_raw_body',
        },
      },
      response: { received: true, http_status_from_your_server: 200 },
    },
  ];
}

export function sampleCurlCreateSession(_organizationId: string): string {
  return `curl -sS -X POST 'https://api.afritrust.io/v1/verifications' \\
  -H 'Authorization: Bearer YOUR_TEST_SECRET_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "applicant_id": "YOUR_APPLICANT_UUID",
    "workflow_id": "YOUR_PUBLISHED_WORKFLOW_UUID"
  }'`;
}
