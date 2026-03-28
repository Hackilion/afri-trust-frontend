import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers } from 'lucide-react';

import { TabGuide } from '../../components/shared/TabGuide';
import { TierProfilesTab } from '../Settings/TierProfilesTab';
import { cn } from '../../lib/utils';

export default function TierProfilesPage() {
  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 p-6 shadow-lg shadow-indigo-500/[0.07] ring-1 ring-indigo-100/60 sm:p-7"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25">
              <Layers className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600/90">
                Verification templates
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.65rem]">
                Tier profiles
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                Reusable KYC packages — required checks, attributes, and document types. Attach them to workflow steps
                so every verification run stays consistent.
              </p>
            </div>
          </div>
          <Link
            to="/settings/check-catalogue"
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-indigo-200/80 bg-white/90 px-4 py-2.5 text-[13px] font-medium text-indigo-700',
              'shadow-sm transition-all hover:border-indigo-300 hover:bg-white hover:shadow-md sm:self-auto'
            )}
          >
            Check catalogue
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>
      </motion.header>

      <TabGuide title="Guide: Tier profiles" defaultOpen={false}>
        <p>
          Each tier is a reusable bundle of <strong>required checks</strong> (from the check catalogue),{' '}
          <strong>attributes</strong> to collect, and <strong>accepted ID types</strong>. Published workflows attach
          these tiers to steps so every verification uses the same rules.
        </p>
        <p className="text-gray-600">
          Create tiers before building workflow steps. Archived tiers stay for history but won’t appear for new
          assignments.
        </p>
      </TabGuide>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32, delay: 0.05 }}
        className="rounded-2xl border border-gray-200/90 bg-white/90 p-5 shadow-md shadow-gray-200/50 backdrop-blur-sm sm:p-6"
        aria-label="Tier profile list"
      >
        <TierProfilesTab hideHeading />
      </motion.section>
    </div>
  );
}
