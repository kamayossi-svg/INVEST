import { useEffect } from 'react';
import { useLanguage } from '../i18n';
import { useRecommendationStats, type PerformanceBucket } from '../hooks/useApi';

/**
 * Whether the scanner's own recommendations actually worked.
 *
 * Every threshold in the scoring engine was hand-tuned and never validated.
 * This panel is the feedback loop: it reads the append-only recommendation log,
 * where each past BUY_NOW / WAIT_FOR_DIP is scored against what price did next.
 */
export default function RecommendationPerformance() {
  const { t, isRTL } = useLanguage();
  const { data, loading, error, refresh } = useRecommendationStats();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading && !data) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <div className="h-4 w-40 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-700/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5 border border-red-500/30">
        <h3 className="text-white font-semibold mb-1">{t('recPerformanceTitle')}</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const hasResults = data.evaluated > 0;

  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-white font-semibold">{t('recPerformanceTitle')}</h3>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {t('recHorizon').replace('{days}', String(data.horizonDays))}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">{t('recPerformanceSubtitle')}</p>

      {!hasResults ? (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <p className="text-gray-300 text-sm">{t('recNoDataYet')}</p>
          <p className="text-gray-500 text-xs mt-2">
            {t('recPendingCount').replace('{n}', String(data.pending))}
          </p>
        </div>
      ) : (
        <>
          <StatRow label={t('recOverall')} bucket={data.overall} t={t} highlight />
          {Object.entries(data.byVerdict).map(([verdict, bucket]) => (
            <StatRow key={verdict} label={verdict.replace('_', ' ')} bucket={bucket} t={t} />
          ))}
          <p className="text-xs text-gray-500 mt-3">
            {t('recPendingCount').replace('{n}', String(data.pending))}
          </p>
        </>
      )}

      <p className={`text-xs text-gray-600 mt-4 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
        {t('recExplainer')}
      </p>
    </div>
  );
}

function StatRow({
  label,
  bucket,
  t,
  highlight = false,
}: {
  label: string;
  bucket: PerformanceBucket;
  t: (key: 'recHitTarget' | 'recHitStop' | 'recAvgR' | 'recSamples') => string;
  highlight?: boolean;
}) {
  // Average R above zero means the calls made money per unit of risk taken -
  // the only number here that says whether there is an edge.
  const r = bucket.avgRMultiple;
  const rColor = r === null ? 'text-gray-400' : r > 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`rounded-xl p-3 mb-2 border ${highlight ? 'bg-gray-900/70 border-gray-600' : 'bg-gray-900/40 border-gray-700/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs text-gray-500">
          {bucket.count} {t('recSamples')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">{t('recHitTarget')}</p>
          <p className="text-green-400 font-semibold">
            {bucket.targetHitRate === null ? '—' : `${bucket.targetHitRate}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('recHitStop')}</p>
          <p className="text-red-400 font-semibold">
            {bucket.stopHitRate === null ? '—' : `${bucket.stopHitRate}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('recAvgR')}</p>
          <p className={`font-semibold ${rColor}`}>
            {r === null ? '—' : `${r > 0 ? '+' : ''}${r}R`}
          </p>
        </div>
      </div>
    </div>
  );
}
