'use client'

import { useSuburbSummary, useSuburbSchools } from '@/lib/api/community-match'

export default function SuburbInfoPanel({
  suburb,
  showSchools,
}: {
  suburb?: string | null
  showSchools: boolean
}) {
  if (!suburb) return null

  const { data: summary } = useSuburbSummary(suburb)
  const { data: schools } = useSuburbSchools(suburb, showSchools)

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
      <h3 className="m-0 text-lg font-semibold text-gray-900">{suburb}</h3>

      {!summary ? (
        <p className="mt-1.5 text-gray-600">Loading…</p>
      ) : summary.notFound ? (
        <p className="mt-1.5 text-gray-600">No housing data.</p>
      ) : (
        <p className="my-1.5 text-gray-700">
          Median price:{' '}
          {summary.medianHousing
            ? `$${summary.medianHousing.toLocaleString()}`
            : 'N/A'}
        </p>
      )}

      {showSchools && (
        <>
          <h4 className="mt-3 mb-1.5 text-base font-medium text-gray-900">Schools</h4>
          {!schools ? (
            <p className="text-gray-600">Loading…</p>
          ) : schools.length === 0 ? (
            <p className="text-gray-600">No schools found.</p>
          ) : (
            <ul className="m-0 pl-4.5 space-y-1">
              {schools.map((s) => (
                <li key={`${s.school_name}-${s.address_postcode ?? ''}`} className="text-sm text-gray-700">
                  {s.school_name}
                  {s.school_type ? ` (${s.school_type})` : ''}{' '}
                  {s.education_sector ? `· ${s.education_sector}` : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}