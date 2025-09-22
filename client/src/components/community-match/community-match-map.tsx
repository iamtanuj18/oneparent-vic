// interactive map component for community matching feature
'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Pane, Tooltip as LeafletTooltip, GeoJSON, useMap } from 'react-leaflet'
import L, { GeoJSON as LGeoJSON, LeafletEvent, LeafletMouseEvent } from 'leaflet'
import type { Top3Item, SuburbSummary, SchoolRow } from '@/lib/api/community-match'
import {
  getSuburbSummary,
  useCouncilSuburbRows,
  getSuburbSchools,
  useSchoolCounts,
  useHousingMedians,
} from '@/lib/api/community-match'
import type { GCollection, GFeature } from './geo-utils'
import { getLgaGeo, getSuburbsGeo, filterBySuburbRows, getSuburbName } from './geo-utils'

// Instruction message component for map
const InstructionMessage: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const instructionControl = new L.Control({ position: 'topright' });
    
    instructionControl.onAdd = () => {
      const el = L.DomUtil.create('div', 'instruction-message');
      el.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: Inter, system-ui;
        font-size: 13px;
        color: #374151;
        max-width: 250px;
        border: 1px solid #e5e7eb;
        backdrop-filter: blur(8px);
        margin-top: 10px;
      `;
      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">👆</span>
          <span>Click on council highlighted area to see more details</span>
        </div>
      `;
      
      // Prevent map events on this control
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
      
      return el;
    };
    
    instructionControl.addTo(map);
    
    return () => {
      map.removeControl(instructionControl);
    };
  }, [map]);
  
  return null;
};

// Component to handle council clicks with map access
function CouncilClickHandler({ 
  onPickCouncil,
  top3Features,
  top3
}: {
  onPickCouncil: (council: string) => void;
  top3Features: GFeature[];
  top3: Top3Item[];
}) {
  const map = useMap();
  const lastClickedRef = useRef<string>('');
  const lastClickTimeRef = useRef<number>(0);
  
  const handleCouncilClick = useCallback((lgaName: string) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // Prevent rapid clicks on same council (debounce) or different councils (throttle)
    if (timeSinceLastClick < 500) {
      return;
    }
    
    // Prevent duplicate clicks on same council
    if (lastClickedRef.current === lgaName && timeSinceLastClick < 2000) {
      return;
    }
    
    lastClickedRef.current = lgaName;
    lastClickTimeRef.current = now;
    
    // Find the matching council from top3 data to get the proper name format
    const matchingCouncil = top3.find(council => 
      normName(council.council) === normName(lgaName)
    );
    
    const properCouncilName = matchingCouncil ? matchingCouncil.council : lgaName;
    
    // Find the clicked council feature and zoom to it
    const clickedFeature = top3Features.find(f => 
      normName(getProp(f.properties, LGA_KEYS)) === normName(lgaName)
    );
    
    if (clickedFeature) {
      try {
        // Create temporary GeoJSON layer to get bounds
        const tempLayer = L.geoJSON(clickedFeature);
        const bounds = tempLayer.getBounds();
        
        // Zoom to the clicked council area with proper padding
        map.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 13 // Prevent over-zooming
        });
      } catch (error) {
        console.error('Error zooming to council area:', error);
      }
    }
    
    // Call parent handler with the proper council name format
    onPickCouncil(properCouncilName);
  }, [onPickCouncil, top3Features, top3, map]);

  // Store the handler in map instance for access by GeoJSON
  useEffect(() => {
    (map as any)._councilClickHandler = handleCouncilClick;

    return () => {
      delete (map as any)._councilClickHandler;
    };
  }, [map, handleCouncilClick]);

  return null;
}

// utility functions and constants for map functionality

// property keys to search for lga names in geojson data
const LGA_KEYS = ['LGA_NAME', 'lga_name', 'Council', 'council', 'NAME', 'name']

// extract property value from object using multiple possible key names
function getProp(obj: any, keys: string[]) {
  for (const key of keys) {
    if (obj && obj[key] != null) return obj[key]
  }
  return ''
}

// normalize string for comparison
function normName(str: any) {
  return String(str || '')
    .toLowerCase()
    .replace(/city of |shire of | city| shire| council/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
    .trim()
}

// create leaflet marker icon for ranking display
function rankIcon(rank: number) {
  return L.divIcon({
    className: 'rank-marker',
    html: `<div class="rank-icon">${rank}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

// Removed SCHOOL_ICON since we no longer show school markers

// color scale generation for choropleth mapping
const makeColorScale = (min: number, max: number, hue = 210) => {
  const dataRange = Math.max(1e-6, max - min)
  return (value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, (value - min) / dataRange))
    const lightness = Math.round(90 - normalizedValue * 60)
    return `hsl(${hue},92%,${lightness}%)`
  }
}

// map legend component for explaining color scales
function MapLegend({ title, min, max, hue = 210 }: { title: string; min: string; max: string; hue?: number }) {
  const map = useMap()
  
  useEffect(() => {
    const legendControl = new L.Control({ position: 'bottomright' })
    legendControl.onAdd = () => {
      const element = L.DomUtil.create('div', 'legend')
      element.className = 'legend'
      element.style.cssText = 'background:#fff;padding:8px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);font:12px/1.2 Inter,system-ui'
      
      const titleDiv = L.DomUtil.create('div', '', element)
      titleDiv.style.cssText = 'font-weight:600;margin-bottom:6px'
      titleDiv.textContent = title
      
      const contentDiv = L.DomUtil.create('div', '', element)
      contentDiv.style.cssText = 'display:flex;align-items:center;gap:8px'
      
      const minSpan = L.DomUtil.create('span', '', contentDiv)
      minSpan.textContent = min
      
      const gradientDiv = L.DomUtil.create('div', '', contentDiv)
      gradientDiv.style.cssText = `height:10px;width:140px;border-radius:6px;background:linear-gradient(90deg,hsl(${hue},90%,78%) 0%,hsl(${hue},90%,40%) 100%)`
      
      const maxSpan = L.DomUtil.create('span', '', contentDiv)
      maxSpan.textContent = max
      
      return element
    }
    legendControl.addTo(map)
    return () => {
      map.removeControl(legendControl)
    }
  }, [map, title, min, max, hue])
  
  return null
}

// subcomponents

function AutoFit({ features }: { features: GFeature[] }) {
  const map = useMap();
  useEffect(() => {
    if (!features?.length) return;
    
    // Small delay to ensure features are fully rendered
    const timeoutId = setTimeout(() => {
      const b = new L.LatLngBounds([]);
      features.forEach((f) => {
        try {
          b.extend(L.geoJSON(f).getBounds());
        } catch {}
      });
      if (b.isValid()) {
        map.fitBounds(b, { 
          padding: [20, 20],
          maxZoom: 13 // Prevent over-zooming when showing suburbs
        });
      }
    }, 300); // Slightly longer delay for suburb data to load
    
    return () => clearTimeout(timeoutId);
  }, [map, features]);
  return null;
}

function RankMarkers({ features, top3 }: { features: GFeature[]; top3: Top3Item[] }) {
  const map = useMap();
  useEffect(() => {
    const markers: L.Marker[] = [];
    features.forEach((f) => {
      const lgaName = getProp(f.properties, LGA_KEYS);
      const rank = top3.find((t) => normName(t.council) === normName(lgaName))?.rank;
      if (!rank) return;
      let center: L.LatLng;
      try {
        center = (L.geoJSON(f) as LGeoJSON).getBounds().getCenter();
      } catch {
        return;
      }
      const m = L.marker(center, {
        icon: rankIcon(rank),
        interactive: false,
        pane: "markerPane",
        zIndexOffset: 1000,
      }).addTo(map);
      markers.push(m);
    });
    return () => markers.forEach((m) => m.remove());
  }, [map, features, top3]);
  return null;
}

// main component

export default function MapView({
  top3,
  activeCouncil,
  onPickCouncil,
  onPickSuburb,
  // Optional: allow parent to control initial metric, showLegend/showMetricToggle and map height
  initialMetric = "schools",
  showLegend = true,
  showMetricToggle = true,
  height = 520,
}: {
  top3: Top3Item[];
  activeCouncil: string | null;
  onPickCouncil: (c: string) => void;
  onPickSuburb: (s: string) => void;
  initialMetric?: "schools" | "housing";
  showLegend?: boolean;
  showMetricToggle?: boolean;
  height?: number;
}) {
  const [lgaGeo, setLgaGeo] = useState<GCollection | null>(null);
  const [subGeo, setSubGeo] = useState<GCollection | null>(null);

  // Currently selected LGA (local for highlighting on the map)
  const [selectedLga, setSelectedLga] = useState<string | null>(null);

  const summaryCacheRef = useRef<Map<string, SuburbSummary>>(new Map());
  // Removed schoolPins state to prevent map markers from appearing
  
  // Click protection refs for preventing aggressive API calls
  const lastSuburbClickedRef = useRef<string>('');
  const lastSuburbClickTimeRef = useRef<number>(0);

  // Currently selected suburb (after click) used to highlight the clicked suburb
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  // metric toggle (internal small control; does not affect parent)
  const [metric, setMetric] = useState<"schools" | "housing">(initialMetric);
  // loading state for suburb data
  const [isLoadingSuburbData, setIsLoadingSuburbData] = useState<boolean>(false);

  useEffect(() => {
    getLgaGeo().then(setLgaGeo);
    getSuburbsGeo().then(setSubGeo);
  }, []);

  // Clear selected suburb when language or LGA changes
  useEffect(() => {
    // Removed schoolPins clearing since we no longer use school markers
    setSelectedSuburb(null);
  }, [activeCouncil, top3]);

  // Sync selectedLga with activeCouncil to ensure proper highlighting
  useEffect(() => {
    setSelectedLga(activeCouncil);
  }, [activeCouncil]);

  // Top3 LGA features
  const top3Features = useMemo(() => {
    if (!lgaGeo || !top3?.length) return [];
    const want = new Set(top3.map((t) => normName(t.council)));
    return lgaGeo.features.filter((f: GFeature) => want.has(normName(getProp(f.properties, LGA_KEYS))));
  }, [lgaGeo, top3]);

  const top3Key = useMemo(
    () => "top3-" + (top3?.length ? top3.map((t) => normName(t.council)).sort().join("|") : "none"),
    [top3]
  );

  // Selected LGA -> fetch its suburbs from the DB
  const { data: councilSuburbs } = useCouncilSuburbRows(activeCouncil || undefined);

  // Suburbs for the current LGA
  const suburbsInCouncil = useMemo(() => {
    if (!subGeo || !activeCouncil) return [];
    if (councilSuburbs && councilSuburbs.length) {
      return filterBySuburbRows(subGeo, councilSuburbs);
    }
    return [];
  }, [subGeo, councilSuburbs, activeCouncil]);

  const fitTargets = suburbsInCouncil.length ? suburbsInCouncil : top3Features;

  // TEMPORARILY DISABLED - School counts & housing medians aggregations (causing 500 errors due to DB schema issues)
  // const { data: schoolCounts = [] } = useSchoolCounts(activeCouncil || undefined);
  const schoolCounts: { suburb: string; n: number }[] = []; // Empty array to prevent errors
  const schoolCountsMap = useMemo(() => new Map(schoolCounts.map((c) => [String(c.suburb).toLowerCase(), c.n])), [schoolCounts])
  const maxSchoolCount = useMemo(() => Math.max(1, ...schoolCounts.map((c) => c.n)), [schoolCounts])
  const countColor = useMemo(() => makeColorScale(0, maxSchoolCount, 210), [maxSchoolCount])

  // TEMPORARILY DISABLED - housing median price data (causing 500 errors due to DB schema issues)
  // const { data: medianPrices = [] } = useHousingMedians(
  //   activeCouncil ? { lga: activeCouncil, tenure: 'buy', dwelling: 'House', beds: 3 } : null
  // )
  const medianPrices: { suburb: string; median: number }[] = []; // Empty array to prevent errors
  const housingMedianMap = useMemo(() => new Map(medianPrices.map((m) => [String(m.suburb).toLowerCase(), m.median])), [medianPrices])
  const medianMin = useMemo(() => (medianPrices.length ? Math.min(...medianPrices.map((m) => m.median)) : 0), [medianPrices])
  const medianMax = useMemo(() => (medianPrices.length ? Math.max(...medianPrices.map((m) => m.median)) : 1), [medianPrices])
  const medianColor = useMemo(() => makeColorScale(medianMin, medianMax, 160), [medianMin, medianMax])

  // handle suburb click - highlight and show clean summary card
  async function handleSuburbClick(name: string, layer: any) {
    const now = Date.now();
    const timeSinceLastClick = now - lastSuburbClickTimeRef.current;
    
    // Prevent rapid clicks on same suburb (debounce) or different suburbs (throttle)
    if (timeSinceLastClick < 300) {
      return;
    }
    
    // Prevent duplicate clicks on same suburb
    if (lastSuburbClickedRef.current === name && timeSinceLastClick < 1500) {
      return;
    }
    
    lastSuburbClickedRef.current = name;
    lastSuburbClickTimeRef.current = now;
    
    setSelectedSuburb(name); // highlight the clicked suburb
    setIsLoadingSuburbData(true); // show loading indicator

    // Show loading tooltip immediately
    const loadingContainer = L.DomUtil.create('div');
    loadingContainer.style.cssText = 'background:#ffffff !important;background-color:#ffffff !important;color:#111;padding:16px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);min-width:200px;max-width:280px;font-family:Inter,system-ui;border:1px solid #e5e7eb;opacity:1 !important;z-index:10000 !important;position:relative !important';
    
    const loadingHeader = L.DomUtil.create('div', '', loadingContainer);
    loadingHeader.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:12px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px';
    loadingHeader.textContent = name;
    
    const loadingContent = L.DomUtil.create('div', '', loadingContainer);
    loadingContent.style.cssText = 'display:flex;align-items:center;gap:12px;padding:20px 0;color:#6b7280';
    loadingContent.innerHTML = `
      <div style="width:20px;height:20px;border:2px solid #e5e7eb;border-top:2px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite"></div>
      <span>Loading suburb information...</span>
    `;
    
    // Show loading tooltip
    layer.bindTooltip(loadingContainer, { sticky: true });
    layer.openTooltip();

    try {
      // calculate council-wide averages for context
      const councilAvgRent = medianPrices.length > 0 ? Math.round(medianPrices.reduce((sum, p) => sum + p.median, 0) / medianPrices.length) : null;
      const totalCouncilSchools = schoolCounts.reduce((sum, s) => sum + s.n, 0);
      const avgSchoolsPerSuburb = schoolCounts.length > 0 ? Math.round(totalCouncilSchools / schoolCounts.length) : null;

      // fetch suburb summary data
      const key = name.toLowerCase();
      let sum = summaryCacheRef.current.get(key);
      if (!sum) {
        try {
          sum = await getSuburbSummary(name);
          if (sum) summaryCacheRef.current.set(key, sum);
        } catch (e) {
          console.error("getSuburbSummary failed:", e);
        }
      }

    // load school data for statistics display (but don't add pins to map)
    let schoolDetails: SchoolRow[] = [];
    try {
      const rows = await getSuburbSchools(name);
      schoolDetails = (rows || [])
        .filter((s) => typeof s.lat === "number" && typeof s.lon === "number")
        .map((s) => ({ ...s, lat: s.lon, lon: s.lat }));
      // Note: We get school details for statistics but don't add pins to map
    } catch (e) {
      console.error("getSuburbSchools failed:", e);
      schoolDetails = [];
    }

    // process housing data
    const median = sum && !sum.notFound && sum.medianHousing != null ? Number(sum.medianHousing) : null;
    const rent = sum && sum.rent_allprop != null ? Number(sum.rent_allprop) : null;
    const flat = sum && sum.buy_flat != null ? Number(sum.buy_flat) : null;
    const house = sum && sum.buy_house != null ? Number(sum.buy_house) : null;

    // get school count and analyze breakdown
    const schoolCount = schoolCountsMap.get(name.toLowerCase()) ?? schoolDetails.length;
    const primarySchools = schoolDetails.filter(s => 
      s.school_type?.toLowerCase().includes('primary')
    ).length;
    const secondarySchools = schoolDetails.filter(s => 
      s.school_type?.toLowerCase().includes('secondary') ||
      s.school_name?.toLowerCase().includes('high')
    ).length;
    const governmentSchools = schoolDetails.filter(s => 
      s.education_sector?.toLowerCase().includes('government')
    ).length;
    const privateSchools = schoolDetails.filter(s => 
      s.education_sector?.toLowerCase().includes('independent') ||
      s.education_sector?.toLowerCase().includes('catholic')
    ).length;

    // create clean, organized tooltip content
    const container = L.DomUtil.create('div');
    container.style.cssText = 'background:#ffffff !important;background-color:#ffffff !important;color:#111;padding:16px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);min-width:280px;max-width:320px;font-family:Inter,system-ui;border:1px solid #e5e7eb;opacity:1 !important;z-index:10000 !important;position:relative !important';
    
    // suburb name header
    const header = L.DomUtil.create('div', '', container);
    header.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:12px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px';
    header.textContent = name;
    
    // housing section - always show if we have data
    const hasHousingData = median || rent || flat || house;
    
    if (hasHousingData) {
      const housingSection = L.DomUtil.create('div', '', container);
      housingSection.style.cssText = 'margin-bottom:12px';
      
      const housingTitle = L.DomUtil.create('div', '', housingSection);
      housingTitle.style.cssText = 'font-weight:600;font-size:14px;color:#374151;margin-bottom:8px;display:flex;align-items:center;gap:6px';
      housingTitle.innerHTML = '<span style="color:#3b82f6;">🏠</span> Housing Info';
      
      // Buying Prices section
      const hasBuyingData = house || flat;
      if (hasBuyingData) {
        const buyingSubtitle = L.DomUtil.create('div', '', housingSection);
        buyingSubtitle.style.cssText = 'font-weight:600;font-size:12px;color:#4b5563;margin-bottom:4px;margin-left:8px';
        buyingSubtitle.textContent = 'Buying Prices (Average)';
        
        if (house) {
          const houseDiv = L.DomUtil.create('div', '', housingSection);
          houseDiv.style.cssText = 'font-size:13px;color:#6b7280;margin-bottom:2px;display:flex;justify-content:space-between;margin-left:16px';
          houseDiv.innerHTML = `<span>House:</span><strong style="color:#1f2937;">$${house.toLocaleString()}</strong>`;
        }
        
        if (flat) {
          const flatDiv = L.DomUtil.create('div', '', housingSection);
          flatDiv.style.cssText = 'font-size:13px;color:#6b7280;margin-bottom:6px;display:flex;justify-content:space-between;margin-left:16px';
          flatDiv.innerHTML = `<span>Flat:</span><strong style="color:#1f2937;">$${flat.toLocaleString()}</strong>`;
        }
      }
      
      // Renting Prices section
      if (rent) {
        const rentingSubtitle = L.DomUtil.create('div', '', housingSection);
        rentingSubtitle.style.cssText = 'font-weight:600;font-size:12px;color:#4b5563;margin-bottom:4px;margin-left:8px';
        rentingSubtitle.textContent = 'Renting Prices (Average)';
        
        const rentDiv = L.DomUtil.create('div', '', housingSection);
        rentDiv.style.cssText = 'font-size:13px;color:#6b7280;margin-bottom:3px;margin-left:16px';
        rentDiv.innerHTML = `<div style="display:flex;justify-content:space-between;"><span>Weekly Rent:</span><strong style="color:#1f2937;">$${rent.toLocaleString()}</strong></div><div style="font-size:11px;color:#9ca3af;text-align:right;">(all property types)</div>`;
      }
      
      // Add council-wide context if we have data
      if (councilAvgRent && activeCouncil) {
        const contextDiv = L.DomUtil.create('div', '', housingSection);
        contextDiv.style.cssText = 'margin-top:8px;padding-top:6px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af';
        const comparisonText = median && median < councilAvgRent ? 'below' : median && median > councilAvgRent ? 'above' : 'near';
        const comparisonColor = median && median < councilAvgRent ? '#10b981' : median && median > councilAvgRent ? '#f59e0b' : '#6b7280';
        contextDiv.innerHTML = `<span style="color:${comparisonColor};">${comparisonText}</span> ${activeCouncil} average ($${councilAvgRent.toLocaleString()})`;
      }
    }
    
    // schools section - always show if we have data
    if (schoolCount > 0) {
      const schoolSection = L.DomUtil.create('div', '', container);
      schoolSection.style.cssText = 'margin-bottom:8px';
      
      const schoolTitle = L.DomUtil.create('div', '', schoolSection);
      schoolTitle.style.cssText = 'font-weight:600;font-size:14px;color:#374151;margin-bottom:6px;display:flex;align-items:center;gap:6px';
      schoolTitle.innerHTML = '<span style="color:#10b981;">�</span> Schools for Kids';
      
      const totalDiv = L.DomUtil.create('div', '', schoolSection);
      totalDiv.style.cssText = 'font-size:13px;color:#6b7280;margin-bottom:6px;display:flex;justify-content:space-between';
      totalDiv.innerHTML = `<span>Total nearby:</span><strong style="color:#1f2937;">${schoolCount}</strong>`;
      
      // show breakdown if we have detailed data
      if (schoolDetails.length > 0) {
        // School levels breakdown
        if (primarySchools > 0 || secondarySchools > 0) {
          const levelsHeader = L.DomUtil.create('div', '', schoolSection);
          levelsHeader.style.cssText = 'font-size:11px;color:#9ca3af;margin-bottom:2px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px';
          levelsHeader.textContent = 'By Level';
          
          if (primarySchools > 0) {
            const primaryDiv = L.DomUtil.create('div', '', schoolSection);
            primaryDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:2px;display:flex;justify-content:space-between;padding-left:8px';
            primaryDiv.innerHTML = `<span>Primary (K-6):</span><span style="color:#1f2937;">${primarySchools}</span>`;
          }
          
          if (secondarySchools > 0) {
            const secondaryDiv = L.DomUtil.create('div', '', schoolSection);
            secondaryDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:2px;display:flex;justify-content:space-between;padding-left:8px';
            secondaryDiv.innerHTML = `<span>High School:</span><span style="color:#1f2937;">${secondarySchools}</span>`;
          }
        }
        
        // School type breakdown
        if (governmentSchools > 0 || privateSchools > 0) {
          const typesHeader = L.DomUtil.create('div', '', schoolSection);
          typesHeader.style.cssText = 'font-size:11px;color:#9ca3af;margin:6px 0 2px 0;font-weight:500;text-transform:uppercase;letter-spacing:0.5px';
          typesHeader.textContent = 'By Type';
          
          if (governmentSchools > 0) {
            const govDiv = L.DomUtil.create('div', '', schoolSection);
            govDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:2px;display:flex;justify-content:space-between;padding-left:8px';
            govDiv.innerHTML = `<span>Public:</span><span style="color:#1f2937;">${governmentSchools}</span>`;
          }
          
          if (privateSchools > 0) {
            const privateDiv = L.DomUtil.create('div', '', schoolSection);
            privateDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:2px;display:flex;justify-content:space-between;padding-left:8px';
            privateDiv.innerHTML = `<span>Private:</span><span style="color:#1f2937;">${privateSchools}</span>`;
          }
        }
      }
      
      // Add council-wide context if we have data
      if (avgSchoolsPerSuburb && activeCouncil) {
        const contextDiv = L.DomUtil.create('div', '', schoolSection);
        contextDiv.style.cssText = 'margin-top:6px;padding-top:6px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af';
        const comparisonText = schoolCount < avgSchoolsPerSuburb ? 'below' : schoolCount > avgSchoolsPerSuburb ? 'above' : 'near';
        const comparisonColor = schoolCount > avgSchoolsPerSuburb ? '#10b981' : schoolCount < avgSchoolsPerSuburb ? '#f59e0b' : '#6b7280';
        contextDiv.innerHTML = `<span style="color:${comparisonColor};">${comparisonText}</span> ${activeCouncil} average (${avgSchoolsPerSuburb} schools) • ${totalCouncilSchools} total in area`;
      }
    }
    
    // footer note
    const footer = L.DomUtil.create('div', '', container);
    footer.style.cssText = 'margin-top:12px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center';
    footer.textContent = 'Click map to close • Scroll to zoom';

    const tip = layer.getTooltip?.();
    if (tip) tip.setContent(container);
    else layer.bindTooltip(container, { sticky: true });
    layer.openTooltip();
    
    } catch (error) {
      // Handle any errors during data loading
      console.error('Error loading suburb data:', error);
      
      // Show error message
      const errorContainer = L.DomUtil.create('div');
      errorContainer.style.cssText = 'background:#ffffff !important;background-color:#ffffff !important;color:#111;padding:16px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);min-width:200px;max-width:280px;font-family:Inter,system-ui;border:1px solid #e5e7eb;opacity:1 !important;z-index:10000 !important;position:relative !important';
      
      const errorHeader = L.DomUtil.create('div', '', errorContainer);
      errorHeader.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:8px;color:#dc2626;';
      errorHeader.textContent = 'Error Loading Data';
      
      const errorMessage = L.DomUtil.create('div', '', errorContainer);
      errorMessage.style.cssText = 'color:#6b7280;font-size:14px;';
      errorMessage.textContent = 'Unable to load suburb information. Please try again.';
      
      layer.bindTooltip(errorContainer, { sticky: true });
      layer.openTooltip();
    } finally {
      setIsLoadingSuburbData(false);
    }
  }

  // council area summary stats function
  async function showCouncilSummary(councilName: string, map: any) {
    if (!councilSuburbs?.length) return;
    
    // get all suburb names in this council
    const suburbNames = councilSuburbs.map(s => s.suburb.toLowerCase());
    
    // calculate aggregated stats from the existing maps
    let totalSchools = 0;
    let housingPrices: number[] = [];
    
    for (const suburbName of suburbNames) {
      // school count from existing map
      const schoolCount = schoolCountsMap.get(suburbName) ?? 0;
      totalSchools += schoolCount;
      
      // housing data from existing map
      const housing = housingMedianMap.get(suburbName);
      if (housing && housing > 0) housingPrices.push(housing);
    }
    
    // calculate median
    const medianHousing = housingPrices.length > 0 ? 
      housingPrices.sort((a, b) => a - b)[Math.floor(housingPrices.length / 2)] : null;
    
    // create council summary control
    const ctrl = new L.Control({ position: "topright" });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create("div", "council-summary");
      el.style.cssText = "background:#fff;padding:16px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);font-family:Inter,system-ui;min-width:280px;max-width:320px;margin-top:20px";
      
      // header
      const header = L.DomUtil.create('div', '', el);
      header.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:12px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px';
      header.textContent = `${councilName} Overview`;
      
      // stats content based on enabled filters
      if (totalSchools > 0) {
        const schoolSection = L.DomUtil.create('div', '', el);
        schoolSection.style.cssText = 'margin-bottom:12px';
        
        const schoolTitle = L.DomUtil.create('div', '', schoolSection);
        schoolTitle.style.cssText = 'font-weight:600;font-size:14px;color:#374151;margin-bottom:6px;display:flex;align-items:center;gap:6px';
        schoolTitle.innerHTML = '<span style="color:#10b981;">🏫</span> Education';
        
        const totalDiv = L.DomUtil.create('div', '', schoolSection);
        totalDiv.style.cssText = 'font-size:13px;color:#6b7280;display:flex;justify-content:space-between';
        totalDiv.innerHTML = `<span>Total schools:</span><strong style="color:#1f2937;">${totalSchools}</strong>`;
        
        const suburbDiv = L.DomUtil.create('div', '', schoolSection);
        suburbDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-top:3px;display:flex;justify-content:space-between;padding-left:8px';
        suburbDiv.innerHTML = `<span>Across suburbs:</span><span style="color:#1f2937;">${suburbNames.length}</span>`;
      }
      
      if (medianHousing) {
        const housingSection = L.DomUtil.create('div', '', el);
        housingSection.style.cssText = 'margin-bottom:12px';
        
        const housingTitle = L.DomUtil.create('div', '', housingSection);
        housingTitle.style.cssText = 'font-weight:600;font-size:14px;color:#374151;margin-bottom:6px;display:flex;align-items:center;gap:6px';
        housingTitle.innerHTML = '<span style="color:#3b82f6;">🏠</span> Housing Overview';
        
        const medianDiv = L.DomUtil.create('div', '', housingSection);
        medianDiv.style.cssText = 'font-size:13px;color:#6b7280;display:flex;justify-content:space-between';
        medianDiv.innerHTML = `<span>Area median:</span><strong style="color:#1f2937;">$${medianHousing.toLocaleString()}</strong>`;
        
        const rangeDiv = L.DomUtil.create('div', '', housingSection);
        rangeDiv.style.cssText = 'font-size:12px;color:#6b7280;margin-top:3px;display:flex;justify-content:space-between;padding-left:8px';
        const minPrice = Math.min(...housingPrices);
        const maxPrice = Math.max(...housingPrices);
        rangeDiv.innerHTML = `<span>Range:</span><span style="color:#1f2937;">$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}</span>`;
      }
      
      // footer
      const footer = L.DomUtil.create('div', '', el);
      footer.style.cssText = 'margin-top:12px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center';
      footer.textContent = 'Click suburbs for detailed info';
      
      return el;
    };
    
    ctrl.addTo(map);
    
    // store reference for cleanup
    (map as any)._councilSummaryControl = ctrl;
  }

  // cleanup council summary when needed
  function removeCouncilSummary(map: any) {
    if ((map as any)._councilSummaryControl) {
      map.removeControl((map as any)._councilSummaryControl);
      (map as any)._councilSummaryControl = null;
    }
  }

  // population-based color scale for top communities
  const populationRange = useMemo(() => {
    if (!top3?.length) return { min: 0, max: 1 }
    const populations = top3.map((item) => item.population)
    return { min: Math.min(...populations), max: Math.max(...populations) }
  }, [top3])
  const populationColor = useMemo(() => makeColorScale(populationRange.min, populationRange.max, 24), [populationRange])

  // metric-based value and color calculation for choropleth display
  const getMetricValue = (suburbName: string) =>
    metric === 'schools' ? (schoolCountsMap.get(suburbName.toLowerCase()) ?? 0) : (housingMedianMap.get(suburbName.toLowerCase()) ?? 0)
  const getMetricColor = (value: number) => (metric === 'schools' ? countColor(value) : medianColor(value))
  const getMetricTooltip = (suburbName: string) =>
    metric === 'schools'
      ? `${suburbName} · ${(schoolCountsMap.get(suburbName.toLowerCase()) ?? 0)} schools`
      : `${suburbName} · $${(housingMedianMap.get(suburbName.toLowerCase()) ?? 0).toLocaleString()} median`

  // top-left info card control
  function InfoControl({ title, subtitle }: { title: string; subtitle?: string }) {
    const map = useMap();
    useEffect(() => {
      const ctrl = new L.Control({ position: "topleft" });
      ctrl.onAdd = () => {
        const el = L.DomUtil.create("div", "info-card");
        el.style.cssText =
          "background:#fff;padding:10px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.12);font:14px/1.2 Inter,system-ui;min-width:160px";
        el.innerHTML = `<div style='font-weight:700;margin-bottom:6px'>${title}</div>${subtitle ? `<div style='color:#666;font-size:13px'>${subtitle}</div>` : ""}`;
        return el;
      };
      ctrl.addTo(map);
      // cleanup should not return map (avoid returning value)
      return () => { map.removeControl(ctrl); };
    }, [map, title, subtitle]);
    return null;
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {/* Add CSS animation for loading spinner and Leaflet tooltip overrides */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Force completely solid white background - no transparency */
        .leaflet-tooltip {
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #111 !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
          opacity: 1 !important;
          z-index: 10000 !important;
          position: relative !important;
        }
        
        /* Force tooltip content to have solid background */
        .leaflet-tooltip * {
          background: #ffffff !important;
          z-index: 10001 !important;
        }
        
        /* Remove any transparency from tooltip arrows */
        .leaflet-tooltip:before,
        .leaflet-tooltip:after {
          border-top-color: #ffffff !important;
          border-bottom-color: #ffffff !important;
          border-left-color: #ffffff !important;
          border-right-color: #ffffff !important;
          background: #ffffff !important;
          opacity: 1 !important;
        }
        
        /* Ensure tooltip wrapper has solid background */
        .leaflet-tooltip-pane {
          background: transparent !important;
        }
        
        /* Force any nested divs to have solid background */
        .leaflet-tooltip div {
          background: #ffffff !important;
          background-color: #ffffff !important;
          opacity: 1 !important;
        }
        
        /* Remove any filter or transform effects */
        .leaflet-tooltip,
        .leaflet-tooltip * {
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}</style>
      
      <MapContainer center={[-37.81, 144.96]} zoom={11} style={{ height, width: "100%", borderRadius: 12 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        
        {/* Council click handler to manage council area interactions */}
        <CouncilClickHandler 
          onPickCouncil={onPickCouncil}
          top3Features={top3Features}
          top3={top3}
        />
        
        {/* Show instruction message only when no council is selected */}
        {!activeCouncil && <InstructionMessage />}

        {/* display info panel */}
        <FilterControls />

      <AutoFit features={fitTargets} />

      {/* legend and info removed to keep map clean */}

      {/* lga layer with choropleth coloring - always interactive to allow council switching */}
      <Pane name="lga" style={{ zIndex: 300, pointerEvents: "auto" }}>
        {top3Features.length > 0 && (
          <>
              <GeoJSON
              pane="lga"
              key={top3Key}
              data={{ type: "FeatureCollection", features: top3Features } as any}
              style={(feature: any) => {
                const lgaName = String(getProp(feature.properties, LGA_KEYS))
                const population = top3.find((item) => normName(item.council) === normName(lgaName))?.population ?? populationRange.min
                const isActiveArea = selectedLga && normName(selectedLga) === normName(lgaName)
                return {
                  color: isActiveArea ? '#3388ff' : '#ff6a00', // Blue for active, orange for inactive
                  weight: isActiveArea ? 3.5 : 2.5,
                  fillOpacity: isActiveArea ? 0.1 : 0.28, // Much lower fill opacity for active to show suburbs clearly
                  fillColor: isActiveArea ? '#3388ff' : populationColor(population), // Blue fill for active area
                }
              }}
              interactive={true}
              onEachFeature={(f, layer) => {
                const lgaName = String(getProp(f.properties, LGA_KEYS));
                layer.on("click", () => {
                  // Use the stored council click handler that has access to map
                  const mapInstance = (layer as any)._map;
                  if (mapInstance && (mapInstance as any)._councilClickHandler) {
                    (mapInstance as any)._councilClickHandler(lgaName);
                  }
                });
                // Remove hover tooltip - click-only interaction
              }}
            />
            {/* numeric rank markers removed - lgas are colored continuously by population */}
          </>
        )}
      </Pane>

      {/* suburbs layer with metric-based choropleth */}
      <Pane name="suburbs" style={{ zIndex: 400 }}>
        {suburbsInCouncil.length > 0 && (
          <GeoJSON
            pane="suburbs"
            key={`subs-${normName(activeCouncil || "")}-${metric}`}
            data={{ type: "FeatureCollection", features: suburbsInCouncil } as any}
            style={(feature: any) => {
              const suburbName = getSuburbName(feature.properties)
              const metricValue = getMetricValue(suburbName)
              return {
                color: selectedSuburb && normName(selectedSuburb) === normName(suburbName) ? '#111' : '#3388ff',
                weight: selectedSuburb && normName(selectedSuburb) === normName(suburbName) ? 3.2 : 1.5,
                fillOpacity: selectedSuburb && normName(selectedSuburb) === normName(suburbName) ? 0.7 : 0.6,
                fillColor: selectedSuburb && normName(selectedSuburb) === normName(suburbName) ? '#ffffe6' : getMetricColor(metricValue),
              }
            }}
            onEachFeature={(f, layer) => {
              const name = getSuburbName(f.properties);
              
              // add hover effects for better UX
              layer.on("mouseover", () => {
                (layer as any).setStyle({
                  weight: 2.5,
                  fillOpacity: 0.8,
                });
              });
              
              layer.on("mouseout", () => {
                const isSelected = selectedSuburb && normName(selectedSuburb) === normName(name);
                (layer as any).setStyle({
                  weight: isSelected ? 3.2 : 1.5,
                  fillOpacity: isSelected ? 0.7 : 0.6,
                });
              });
              
              // click handler to show detailed info
              layer.on("click", () => {
                // Apply the same debouncing logic here before triggering any state changes
                const now = Date.now();
                const timeSinceLastClick = now - lastSuburbClickTimeRef.current;
                
                // Prevent rapid clicks on same suburb (debounce) or different suburbs (throttle)
                if (timeSinceLastClick < 300) {
                  return;
                }
                
                // Prevent duplicate clicks on same suburb
                if (lastSuburbClickedRef.current === name && timeSinceLastClick < 1500) {
                  return;
                }
                
                setSelectedSuburb(name);
                onPickSuburb(name);
                handleSuburbClick(name, layer);
              });
            }}
          />
        )}
      </Pane>

      {/* Removed schools pane - no longer showing school markers to prevent visual interference */}
    </MapContainer>
  </div>
  );
}

// display info panel - responsive positioning for mobile
function FilterControls() {
  const map = useMap();
  useEffect(() => {
    const ctrl = new L.Control({ position: "topleft" });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create("div", "showing-on-map");
      el.style.cssText = "background:#ffffff;padding:12px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.15);font:13px Inter,system-ui;min-width:200px;margin-top:60px;border:1px solid #e5e7eb";
      
      // Add responsive CSS for mobile
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 767px) {
          .showing-on-map {
            display: none !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .showing-on-map {
            min-width: 160px !important;
            padding: 8px !important;
            font-size: 12px !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // header
      const header = L.DomUtil.create("div", "", el);
      header.style.cssText = "font-weight:600;margin-bottom:8px;color:#1f2937;font-size:14px";
      header.textContent = "Showing on Map";
      
      const createDisplayItem = (label: string, icon: string) => {
        const item = L.DomUtil.create("div", "", el);
        item.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;color:#374151";
        item.innerHTML = `<span style="font-size:16px">${icon}</span><span>${label}</span>`;
        return item;
      };
      
      createDisplayItem("Housing Prices", "🏠");
      createDisplayItem("Rental Costs", "💰");
      createDisplayItem("Schools", "🏫");
      
      return el;
    };
    ctrl.addTo(map);
    return () => {
      map.removeControl(ctrl);
    };
  }, [map]);
  return null;
}

// minimal metric toggle control
function MetricToggle({ metric, onChange }: { metric: "schools" | "housing"; onChange: (m: "schools" | "housing") => void }) {
  const map = useMap();
  useEffect(() => {
    const ctrl = new L.Control({ position: "topright" });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create("div", "metric-toggle");
      el.style.cssText = "background:#fff;padding:6px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;gap:6px;font:12px Inter,system-ui";
      
      const createBtn = (txt: string, active: boolean) => {
        const btn = L.DomUtil.create("button", "", el);
        btn.setAttribute("data-k", txt);
        btn.style.cssText = `padding:6px 8px;border-radius:6px;border:1px solid ${active ? '#111' : '#e5e7eb'};background:${active ? '#111' : '#fff'};color:${active ? '#fff' : '#111'};cursor:pointer`;
        btn.textContent = txt;
        return btn;
      };
      
      createBtn("schools", metric === "schools");
      createBtn("housing", metric === "housing");
      
      el.onclick = (e: any) => {
        const k = e?.target?.getAttribute?.("data-k");
        if (k === "schools" || k === "housing") onChange(k);
      };
      return el;
    };
    ctrl.addTo(map);
    return () => {
      map.removeControl(ctrl);
    };
  }, [map, metric, onChange]);
  return null;
}