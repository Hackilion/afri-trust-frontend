import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Applicants = lazy(() => import('../pages/Applicants'));
const ApplicantDetail = lazy(() => import('../pages/ApplicantDetail'));
const Settings = lazy(() => import('../pages/Settings'));
const Workflows = lazy(() => import('../pages/Workflows'));
const WorkflowBuilder = lazy(() => import('../pages/Workflows/WorkflowBuilder'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const CompanyOnboarding = lazy(() => import('../pages/CompanyOnboarding'));

const ApiKeysTab = lazy(() => import('../pages/Settings/ApiKeysTab').then(m => ({ default: m.ApiKeysTab })));
const WebhooksTab = lazy(() => import('../pages/Settings/WebhooksTab').then(m => ({ default: m.WebhooksTab })));
const TeamTab = lazy(() => import('../pages/Settings/TeamTab').then(m => ({ default: m.TeamTab })));
const TierProfilesTab = lazy(() => import('../pages/Settings/TierProfilesTab').then(m => ({ default: m.TierProfilesTab })));
const CheckCatalogueTab = lazy(() => import('../pages/Settings/CheckCatalogueTab').then(m => ({ default: m.CheckCatalogueTab })));

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
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: 'applicants', element: wrap(Applicants) },
      { path: 'applicants/:id', element: wrap(ApplicantDetail) },
      { path: 'workflows', element: wrap(Workflows) },
      { path: 'workflows/:id', element: wrap(WorkflowBuilder) },
      { path: 'audit-logs', element: wrap(AuditLogs) },
      { path: 'company-onboarding', element: wrap(CompanyOnboarding) },
      {
        path: 'settings',
        element: wrap(Settings),
        children: [
          { index: true, element: <Navigate to="/settings/api-keys" replace /> },
          { path: 'api-keys', element: wrap(ApiKeysTab) },
          { path: 'webhooks', element: wrap(WebhooksTab) },
          { path: 'team', element: wrap(TeamTab) },
          { path: 'tier-profiles', element: wrap(TierProfilesTab) },
          { path: 'check-catalogue', element: wrap(CheckCatalogueTab) },
        ],
      },
    ],
  },
]);
