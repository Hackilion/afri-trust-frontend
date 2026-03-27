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
        'Typical first call when a customer taps “Verify identity” in your app. AfriTrust returns a hosted flow URL and expiry.',
      request: {
        method: 'POST',
        url: `${baseUrl}/verification/sessions`,
        headers: {
          Authorization: 'Bearer aft_test_sk_••••••••••••7n2p',
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem_${rid()}`,
        },
        body: {
          organization_id: organizationId,
          tier: 'standard',
          applicant: {
            external_id: 'cust_8821',
            email: 'customer@example.com',
            country: 'GH',
          },
          success_redirect_url: 'https://yourapp.com/kyc/complete',
          cancel_redirect_url: 'https://yourapp.com/kyc/cancel',
        },
      },
      response: {
        id: sessionId,
        status: 'open',
        portal_url: `https://verify.afritrust.io/session/${sessionId}`,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        organization_id: organizationId,
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
      detail: 'After the user finishes the flow, poll or wait for applicant.verified via webhook.',
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
      title: 'Webhook: applicant.verified',
      detail: 'Use this to unlock accounts, issue wallets, or continue onboarding in your product.',
      webhookPayload: {
        id: `evt_${rid()}`,
        type: 'applicant.verified',
        api_version: '2026-03-01',
        created_at: new Date().toISOString(),
        data: {
          object: 'applicant',
          id: applicantId,
          organization_id: organizationId,
          status: 'verified',
          external_reference: 'cust_8821',
        },
      },
      request: {
        method: 'POST',
        url: 'https://api.yourapp.com/webhooks/afritrust',
        headers: {
          'Content-Type': 'application/json',
          'X-AfriTrust-Signature': 't=1730000001,v1=mock_hmac_signature_for_demo',
        },
      },
      response: { received: true, http_status_from_your_server: 200 },
    },
  ];
}

export function sampleCurlCreateSession(organizationId: string): string {
  return `curl -sS -X POST 'https://api.afritrust.io/v1/verification/sessions' \\
  -H 'Authorization: Bearer YOUR_TEST_SECRET_KEY' \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: $(uuidgen)' \\
  -d '{
    "organization_id": "${organizationId}",
    "tier": "standard",
    "applicant": { "external_id": "your_customer_id", "email": "user@example.com", "country": "NG" },
    "success_redirect_url": "https://yourapp.com/done",
    "cancel_redirect_url": "https://yourapp.com/cancel"
  }'`;
}
