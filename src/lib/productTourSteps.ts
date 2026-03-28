import type { Capability } from './capabilities';

export type TourStepDef = {
  id: string;
  title: string;
  body: string;
  /** CSS selector for [data-tour="…"] */
  target: string | null;
  /** Route to navigate to before highlighting (optional) */
  navigateTo?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** If set, step is only shown when this capability passes */
  requiresCap?: Capability;
  /** Only for platform super-admin steps */
  platformOnly?: boolean;
  /** Hidden for platform super-admin */
  tenantOnly?: boolean;
};

/** In-tab Guide panels (same `data-tour="tab-guide-panel"` on each route after navigate). */
function settingsTabGuideTourSteps(): TourStepDef[] {
  return [
    {
      id: 'guide-tab-api-keys',
      title: 'Guide: API keys',
      body: 'Expand this Guide for issuing keys, choosing scopes, and storing secrets safely. The same expandable Guide appears on every settings tab you can access.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/api-keys',
      placement: 'bottom',
      requiresCap: 'settings.api_keys',
    },
    {
      id: 'guide-tab-webhooks',
      title: 'Guide: Webhooks',
      body: 'Learn how deliveries, signatures, and retries work before you register production URLs.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/webhooks',
      placement: 'bottom',
      requiresCap: 'settings.webhooks',
    },
    {
      id: 'guide-tab-consent',
      title: 'Guide: Consent & identity',
      body: 'Understand org-wide consent grants and when to use the identity attribute tools.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/consent-identity',
      placement: 'bottom',
      requiresCap: 'settings.consent_identity',
    },
    {
      id: 'guide-tab-integration-demo',
      title: 'Guide: Integration demo',
      body: 'Walk through a scripted sandbox of API + webhook flow — ideal for demos without real traffic.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/integration-demo',
      placement: 'bottom',
      requiresCap: 'settings.integration_demo',
    },
    {
      id: 'guide-tab-team',
      title: 'Guide: Team',
      body: 'Invites, roles, and who can change workspace configuration — all summarised in this tab’s Guide.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/team',
      placement: 'bottom',
      requiresCap: 'settings.team',
    },
    {
      id: 'guide-tab-appearance',
      title: 'Guide: Appearance',
      body: 'Workspace colours and branding: what applies to the dashboard and who may edit it.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/appearance',
      placement: 'bottom',
      requiresCap: 'settings.appearance',
    },
    {
      id: 'guide-tab-tier-profiles',
      title: 'Guide: Tier profiles',
      body: 'How tiers bundle checks and documents — the foundation workflows use when resolving verification levels.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/tier-profiles',
      placement: 'bottom',
      requiresCap: 'settings.tier_profiles',
    },
    {
      id: 'guide-tab-check-catalogue',
      title: 'Guide: Check catalogue',
      body: 'A reference of every check ID and requirement flag your compliance team can align on.',
      target: '[data-tour="tab-guide-panel"]',
      navigateTo: '/settings/check-catalogue',
      placement: 'bottom',
      requiresCap: 'settings.check_catalogue',
    },
  ];
}

export function buildTourSteps(opts: {
  isSuperAdmin: boolean;
  can: (c: Capability) => boolean;
}): TourStepDef[] {
  const { isSuperAdmin, can } = opts;

  const tenantSteps: TourStepDef[] = [
    {
      id: 'welcome',
      title: 'Welcome to AfriTrust',
      body: 'We will tour navigation, each settings tab’s in-page Guide, workflows, and where to get help later. Use Next, or Skip — you can always open Help (bottom-right) to replay or jump to Settings / Workflows.',
      target: null,
    },
    {
      id: 'main',
      title: 'Your workspace',
      body: 'Page content loads here. Open any item from the left rail and work in this panel — it scrolls independently while the sidebar stays put.',
      target: '[data-tour="main-outlet"]',
      navigateTo: '/dashboard',
      placement: 'bottom',
      requiresCap: 'nav.dashboard',
    },
    {
      id: 'sidebar',
      title: 'Primary navigation',
      body: 'Jump between overview, applicants, workflows, audit, and settings. Items match your role — you only see what you are allowed to use.',
      target: '[data-tour="sidebar-nav"]',
      navigateTo: '/dashboard',
      placement: 'right',
    },
    {
      id: 'dashboard',
      title: 'Overview',
      body: 'Monitor verification volume, funnel health, and activity at a glance. Start here each day for a snapshot of your programme.',
      target: '[data-tour="tour-nav-dashboard"]',
      navigateTo: '/dashboard',
      placement: 'right',
      requiresCap: 'nav.dashboard',
    },
    {
      id: 'applicants',
      title: 'Applicants',
      body: 'Review each person’s journey, documents, and outcomes. Open a row to see timeline detail and manual review tools when enabled.',
      target: '[data-tour="tour-nav-applicants"]',
      navigateTo: '/applicants',
      placement: 'right',
      requiresCap: 'nav.applicants',
    },
    {
      id: 'workflows',
      title: 'Workflows',
      body: 'Design linear verification flows: tiers, steps, and checks. Draft safely, then publish when you are ready to send applicants through.',
      target: '[data-tour="tour-nav-workflows"]',
      navigateTo: '/workflows',
      placement: 'right',
      requiresCap: 'nav.workflows',
    },
    {
      id: 'settings',
      title: 'Settings',
      body: 'API keys, webhooks, team, appearance, tier profiles, and more live here. Next we visit each tab’s expandable Guide so you know where tips live later.',
      target: '[data-tour="tour-nav-settings"]',
      navigateTo: '/settings/api-keys',
      placement: 'right',
      requiresCap: 'nav.settings',
    },
    ...settingsTabGuideTourSteps(),
    {
      id: 'guide-workflow-list',
      title: 'Workflows & builder guide',
      body: 'Open any workflow from this list. On the detail screen, expand **Guide: workflow detail** for the step library, linear graph rules, validation, publishing, and integration preview.',
      target: '[data-tour="workflow-list"]',
      navigateTo: '/workflows',
      placement: 'bottom',
      requiresCap: 'nav.workflows',
    },
    {
      id: 'collapse',
      title: 'More room to work',
      body: 'Collapse the sidebar when you want a wider canvas — great on smaller screens or when focusing on tables and builders.',
      target: '[data-tour="sidebar-toggle"]',
      navigateTo: '/dashboard',
      placement: 'right',
    },
    {
      id: 'topbar',
      title: 'Context & account',
      body: 'The header shows where you are, the date, workspace context, and quick access to your profile and Settings.',
      target: '[data-tour="top-bar"]',
      navigateTo: '/dashboard',
      placement: 'bottom',
    },
    {
      id: 'done',
      title: 'You are set',
      body: 'Explore at your own pace. Use the **Help** button (bottom-right) anytime to replay this tour or open Settings / Workflows for the in-tab Guides.',
      target: null,
    },
  ];

  const platformSteps: TourStepDef[] = [
    {
      id: 'welcome',
      title: 'Platform console',
      body: 'You are in the AfriTrust platform workspace. This short tour covers cross-tenant navigation, picking a workspace, and daily use.',
      target: null,
    },
    {
      id: 'main',
      title: 'Workspace panel',
      body: 'Reports, org directories, and tools render in this main area after you pick a route from the left.',
      target: '[data-tour="main-outlet"]',
      navigateTo: '/platform',
      placement: 'bottom',
      requiresCap: 'nav.platform',
    },
    {
      id: 'platform-nav',
      title: 'Platform section',
      body: 'Overview, organisations, and platform user management — operate across all tenants from here.',
      target: '[data-tour="sidebar-platform"]',
      navigateTo: '/platform',
      placement: 'right',
      requiresCap: 'nav.platform',
    },
    {
      id: 'tenant-picker',
      title: 'Act as a tenant',
      body: 'Choose an organisation to load applicants, workflows, and company setup for that customer. Leave empty to stay in pure platform mode.',
      target: '[data-tour="top-tenant-picker"]',
      navigateTo: '/platform',
      placement: 'bottom',
      requiresCap: 'nav.platform',
    },
    {
      id: 'workspace-nav',
      title: 'Product tools',
      body: 'Once a tenant is selected, these links mirror the customer console — dashboard through settings for that org.',
      target: '[data-tour="sidebar-workspace"]',
      navigateTo: '/dashboard',
      placement: 'right',
    },
    {
      id: 'collapse',
      title: 'Sidebar width',
      body: 'Collapse the rail for more horizontal space when reviewing wide tables.',
      target: '[data-tour="sidebar-toggle"]',
      navigateTo: '/dashboard',
      placement: 'right',
    },
    {
      id: 'topbar',
      title: 'Header',
      body: 'Current page title, tenant context, and account shortcuts stay visible as you move around.',
      target: '[data-tour="top-bar"]',
      navigateTo: '/dashboard',
      placement: 'bottom',
    },
    {
      id: 'guides-tenant-context',
      title: 'Guides in customer workspaces',
      body: 'After you select a tenant, open **Settings** — each tab has an expandable Guide. Under **Workflows**, open any definition for **Guide: workflow detail**. Use **Help** (bottom-right) to replay this tour anytime.',
      target: null,
      navigateTo: '/platform',
    },
    {
      id: 'done',
      title: 'Ready to operate',
      body: 'Pick a tenant when you need to debug a flow or review applicants. Welcome aboard.',
      target: null,
    },
  ];

  const base = isSuperAdmin ? platformSteps : tenantSteps;
  return base.filter(step => {
    if (step.platformOnly && !isSuperAdmin) return false;
    if (step.tenantOnly && isSuperAdmin) return false;
    if (step.requiresCap && !can(step.requiresCap)) return false;
    return true;
  });
}
