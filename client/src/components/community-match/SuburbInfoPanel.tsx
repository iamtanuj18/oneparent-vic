"use client";

import { useSuburbSummary, useSuburbSchools } from "@/lib/api/community-match";

export default function SuburbInfoPanel({
  suburb,
  showSchools,
}: {
  suburb?: string | null;
  showSchools: boolean;
}) {
  if (!suburb) return null;

  const { data: summary } = useSuburbSummary(suburb);
  const { data: schools } = useSuburbSchools(suburb, showSchools);

  return (
    <section className="card" style={{ padding: 12, marginTop: 12 }}>
      <h3 style={{ margin: 0 }}>{suburb}</h3>

      {!summary ? (
        <p style={{ marginTop: 6 }}>Loading…</p>
      ) : summary.notFound ? (
        <p style={{ marginTop: 6 }}>No housing data.</p>
      ) : (
        <p style={{ margin: "6px 0" }}>
          Median price:{" "}
          {summary.medianHousing
            ? `$${summary.medianHousing.toLocaleString()}`
            : "N/A"}
        </p>
      )}

      {showSchools && (
        <>
          <h4 style={{ marginTop: 12, marginBottom: 6 }}>Schools</h4>
          {!schools ? (
            <p>Loading…</p>
          ) : schools.length === 0 ? (
            <p>No schools found.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {schools.map((s) => (
                <li key={`${s.school_name}-${s.address_postcode ?? ""}`}>
                  {s.school_name}
                  {s.school_type ? ` (${s.school_type})` : ""}{" "}
                  {s.education_sector ? `· ${s.education_sector}` : ""}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
