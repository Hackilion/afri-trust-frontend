import { useCheckCatalogue } from '../../hooks/useWorkflows';
import { SkeletonCard } from '../../components/shared/LoadingSpinner';

export function CheckCatalogueTab() {
  const { data: catalogue, isLoading } = useCheckCatalogue();

  if (isLoading) return <div className="space-y-3">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Check Catalogue</h2>
        <p className="text-xs text-gray-500 mt-0.5">Reference of all available verification checks. These checks can be assigned to Tier Profiles.</p>
      </div>

      <div className="grid gap-3">
        {(catalogue ?? []).map(check => (
          <div key={check.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{check.name}</span>
                <code className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{check.id}</code>
                {check.requiresDocument && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Requires Document</span>
                )}
                {check.requiresBiometric && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">Biometric</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{check.description}</p>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0 capitalize">
              {check.category.replace(/_/g, ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
