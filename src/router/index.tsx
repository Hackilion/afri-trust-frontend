import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { RequireSuperAdmin } from '../components/auth/RequireSuperAdmin';

const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const AcceptInvite = lazy(() => import('../pages/AcceptInvite'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Assistant = lazy(() => import('../pages/Assistant'));
const Reports = lazy(() => import('../pages/Reports'));
const Applicants = lazy(() => import('../pages/Applicants'));
const ApplicantDetail = lazy(() => import('../pages/ApplicantDetail'));
const Settings = lazy(() => import('../pages/Settings'));
const Workflows = lazy(() => import('../pages/Workflows'));
const WorkflowBuilder = lazy(() => import('../pages/Workflows/WorkflowBuilder'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const CompanyOnboarding = lazy(() => import('../pages/CompanyOnboarding'));
const PlatformOverview = lazy(() => import('../pages/Platform/PlatformOverview'));
const PlatformOrganizations = lazy(() => import('../pages/Platform/PlatformOrganizations'));
const PlatformUsers = lazy(() => import('../pages/Platform/PlatformUsers'));

const ApiKeysTab = lazy(() => import('../pages/Settings/ApiKeysTab').then(m => ({ default: m.ApiKeysTab })));
const WebhooksTab = lazy(() => import('../pages/Settings/WebhooksTab').then(m => ({ default: m.WebhooksTab })));
const TeamTab = lazy(() => import('../pages/Settings/TeamTab').then(m => ({ default: m.TeamTab })));
const AppearanceTab = lazy(() =>
  import('../pages/Settings/AppearanceTab').then(m => ({ default: m.AppearanceTab }))
);
const TierProfilesTab = lazy(() => import('../pages/Settings/TierProfilesTab').then(m => ({ default: m.TierProfilesTab })));
const CheckCatalogueTab = lazy(() => import('../pages/Settings/CheckCatalogueTab').then(m => ({ default: m.CheckCatalogueTab })));
const IntegrationDemoTab = lazy(() =>
  import('../pages/Settings/IntegrationDemoTab').then(m => ({ default: m.IntegrationDemoTab }))
);
const ConsentIdentityTab = lazy(() =>
  import('../pages/Settings/ConsentIdentityTab').then(m => ({ default: m.ConsentIdentityTab }))
);

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingSpinner className="py-32" />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: wrap(Landing) },
      { path: 'login', element: wrap(Login) },
      { path: 'register', element: wrap(Register) },
      { path: 'verify-email', element: wrap(VerifyEmail) },
      { path: 'accept-invite', element: wrap(AcceptInvite) },
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: 'assistant', element: wrap(Assistant) },
      { path: 'reports', element: wrap(Reports) },
      { path: 'applicants', element: wrap(Applicants) },
      { path: 'applicants/:id', element: wrap(ApplicantDetail) },
      { path: 'workflows', element: wrap(Workflows) },
      { path: 'workflows/:id', element: wrap(WorkflowBuilder) },
      { path: 'audit-logs', element: wrap(AuditLogs) },
      { path: 'company-onboarding', element: wrap(CompanyOnboarding) },
      {
        path: 'platform',
        element: <RequireSuperAdmin />,
        children: [
          { index: true, element: wrap(PlatformOverview) },
          { path: 'organizations', element: wrap(PlatformOrganizations) },
          { path: 'users', element: wrap(PlatformUsers) },
        ],
      },
      {
        path: 'settings',
        element: wrap(Settings),
        children: [
          { index: true, element: <Navigate to="/settings/api-keys" replace /> },
          { path: 'api-keys', element: wrap(ApiKeysTab) },
          { path: 'webhooks', element: wrap(WebhooksTab) },
          { path: 'consent-identity', element: wrap(ConsentIdentityTab) },
          { path: 'team', element: wrap(TeamTab) },
          { path: 'appearance', element: wrap(AppearanceTab) },
          { path: 'tier-profiles', element: wrap(TierProfilesTab) },
          { path: 'check-catalogue', element: wrap(CheckCatalogueTab) },
          { path: 'integration-demo', element: wrap(IntegrationDemoTab) },
        ],
      },
    ],
  },
]);
