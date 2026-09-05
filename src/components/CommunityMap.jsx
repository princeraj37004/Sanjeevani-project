import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Activity as ActivityIcon, AlertTriangle, Layers, Map as MapIcon } from 'lucide-react';

export default function CommunityMap({ communities = [] }) {
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [viewMode, setViewMode] = useState('leaflet'); // 'leaflet' or 'svg'
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);

  const safeCommunities = Array.isArray(communities) ? communities : [];

  // Auto select first village if none selected
  useEffect(() => {
    if (safeCommunities.length > 0 && !selectedVillage) {
      setSelectedVillage(safeCommunities[0]);
    }
  }, [safeCommunities]);

  // Determine coverage status
  const getCoverageStatus = (c) => {
    const alerts = Number(c.pendingAlertsCount || 0);
    const activities = Number(c.activityCount || 0);
    if (alerts > 0) return { label: 'Urgent Attention', color: '#f43f5e', fillClass: 'urgent' };
    if (activities >= 10) return { label: 'High Coverage', color: '#10b981', fillClass: 'high' };
    if (activities >= 3) return { label: 'Moderate Coverage', color: '#f59e0b', fillClass: 'moderate' };
    return { label: 'Underserved (Gap)', color: '#ef4444', fillClass: 'underserved' };
  };

  // Initialize Leaflet OpenStreetMap View
  useEffect(() => {
    if (viewMode !== 'leaflet') return;

    let isMounted = true;

    const initLeaflet = () => {
      if (!window.L || !mapRef.current || !isMounted) return;

      // Reset existing Leaflet instance if present
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }

      // Valid coordinates check
      const validCoords = safeCommunities
        .map(c => ({ lat: parseFloat(c.lat), lng: parseFloat(c.lng), c }))
        .filter(item => !isNaN(item.lat) && !isNaN(item.lng) && item.lat !== 0 && item.lng !== 0);

      const centerLat = validCoords.length > 0 ? validCoords[0].lat : 25.5941;
      const centerLng = validCoords.length > 0 ? validCoords[0].lng : 85.1376;

      const map = window.L.map(mapRef.current, {
        scrollWheelZoom: false
      }).setView([centerLat, centerLng], 10);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const boundsGroup = [];

      safeCommunities.forEach(c => {
        const lat = parseFloat(c.lat);
        const lng = parseFloat(c.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

        const status = getCoverageStatus(c);

        // Custom colored circle marker
        const marker = window.L.circleMarker([lat, lng], {
          radius: 12,
          fillColor: status.color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 140px;">
            <strong style="font-size: 14px; color: #0f172a;">${c.name}</strong>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${c.district || 'Patna'} District</div>
            <div style="font-size: 12px; color: #334155; margin-bottom: 2px;">Worker: <b>${c.healthWorker || 'Unassigned'}</b></div>
            <div style="font-size: 12px; color: #334155;">Outreach: <b>${c.activityCount || 0} visits</b></div>
            <div style="font-size: 11px; font-weight: bold; color: ${status.color}; margin-top: 6px;">● ${status.label}</div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedVillage(c);
        });

        boundsGroup.push([lat, lng]);
      });

      if (boundsGroup.length > 0) {
        map.fitBounds(boundsGroup, { padding: [50, 50] });
      }

      leafletInstance.current = map;
    };

    // Dynamically load Leaflet assets if missing
    if (!window.L) {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initLeaflet();
        };
        document.body.appendChild(script);
      }
    } else {
      initLeaflet();
    }

    return () => {
      isMounted = false;
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [viewMode, safeCommunities]);

  // SVG dynamic bounding box calculation
  const lats = safeCommunities.map(c => parseFloat(c.lat)).filter(l => !isNaN(l) && l !== 0);
  const lngs = safeCommunities.map(c => parseFloat(c.lng)).filter(l => !isNaN(l) && l !== 0);

  let minLat = lats.length > 0 ? Math.min(...lats) : 25.54;
  let maxLat = lats.length > 0 ? Math.max(...lats) : 25.72;
  let minLng = lngs.length > 0 ? Math.min(...lngs) : 84.82;
  let maxLng = lngs.length > 0 ? Math.max(...lngs) : 85.22;

  if (maxLat === minLat) { maxLat += 0.05; minLat -= 0.05; }
  if (maxLng === minLng) { maxLng += 0.05; minLng -= 0.05; }

  const mapSvgCoords = (lat, lng, index) => {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);

    if (isNaN(pLat) || isNaN(pLng) || pLat === 0 || pLng === 0) {
      // Unmapped fallback grid position
      const col = index % 4;
      const row = Math.floor(index / 4);
      return { x: 80 + col * 130, y: 70 + row * 65, isFallback: true };
    }

    const x = ((pLng - minLng) / (maxLng - minLng)) * 480 + 60;
    const y = 300 - (((pLat - minLat) / (maxLat - minLat)) * 200 + 50);
    return { 
      x: Math.max(40, Math.min(560, x)), 
      y: Math.max(40, Math.min(260, y)), 
      isFallback: false 
    };
  };

  return (
    <div className="glass-panel map-container-grid">
      <div className="map-view">
        <div className="map-title-bar">
          <div>
            <h3>Community Outreach Geo-Map</h3>
            <span className="subtitle">Real-time Location Tracking & Field Coverage Index</span>
          </div>

          <div className="map-mode-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'leaflet' ? 'active' : ''}`}
              onClick={() => setViewMode('leaflet')}
            >
              <MapIcon size={14} /> OpenStreetMap
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'svg' ? 'active' : ''}`}
              onClick={() => setViewMode('svg')}
            >
              <Layers size={14} /> Density Diagram
            </button>
          </div>
        </div>

        {/* View Mode 1: OpenStreetMap Container */}
        {viewMode === 'leaflet' && (
          <div className="leaflet-wrapper">
            <div ref={mapRef} style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-sm)' }}></div>
          </div>
        )}

        {/* View Mode 2: SVG Vector Map Container */}
        {viewMode === 'svg' && (
          <div className="svg-wrapper">
            <svg viewBox="0 0 600 300" className="map-svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="300" fill="url(#grid)" />

              {/* Connecting paths */}
              <path 
                d="M 50 250 Q 200 200 300 150 T 550 50" 
                fill="none" 
                stroke="rgba(255,255,255,0.04)" 
                strokeWidth="2" 
                strokeDasharray="4,4" 
              />

              {safeCommunities.map((c, idx) => {
                const { x, y, isFallback } = mapSvgCoords(c.lat, c.lng, idx);
                const status = getCoverageStatus(c);
                const isSelected = selectedVillage?._id === c._id;

                return (
                  <g key={c._id || idx} className="map-node" onClick={() => setSelectedVillage(c)}>
                    {Number(c.pendingAlertsCount || 0) > 0 && (
                      <circle cx={x} cy={y} r="18" className="pulse-glow danger-pulse" />
                    )}
                    
                    {isSelected && (
                      <circle cx={x} cy={y} r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
                    )}

                    <circle 
                      cx={x} 
                      cy={y} 
                      r="9" 
                      fill={status.color} 
                      className={`node-dot ${status.fillClass}`} 
                    />
                    <circle cx={x} cy={y} r="3" fill="#ffffff" />
                    
                    <text 
                      x={x} 
                      y={y - 14} 
                      textAnchor="middle" 
                      className={`node-label ${isSelected ? 'selected' : ''}`}
                    >
                      {c.name} {isFallback ? '(Approx)' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-item"><span className="dot" style={{background: '#10b981'}}></span> High Coverage (10+)</div>
          <div className="legend-item"><span className="dot" style={{background: '#f59e0b'}}></span> Moderate Coverage (3-9)</div>
          <div className="legend-item"><span className="dot" style={{background: '#ef4444'}}></span> Underserved (&lt;3)</div>
          <div className="legend-item"><span className="dot pulsing" style={{background: '#f43f5e'}}></span> Critical Alert Active</div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="map-info-panel">
        {selectedVillage ? (
          <div className="village-details">
            <div className="header-details">
              <h4>{selectedVillage.name}</h4>
              <span className="badge-district">{selectedVillage.district || 'Patna'} District</span>
            </div>
            
            <div className="info-row">
              <Users size={16} />
              <div>
                <label>Village Population</label>
                <p>{Number(selectedVillage.population || 0).toLocaleString()} residents</p>
              </div>
            </div>

            <div className="info-row">
              <MapPin size={16} />
              <div>
                <label>Coordinates</label>
                <p>
                  {selectedVillage.lat && selectedVillage.lng && parseFloat(selectedVillage.lat) !== 0
                    ? `${Number(selectedVillage.lat).toFixed(4)}° N, ${Number(selectedVillage.lng).toFixed(4)}° E`
                    : 'Coordinates Pending'}
                </p>
              </div>
            </div>

            <div className="info-row">
              <Users size={16} className="worker-icon" />
              <div>
                <label>Assigned Health Worker</label>
                <p>{selectedVillage.healthWorker || 'Unassigned'}</p>
              </div>
            </div>

            <div className="info-row">
              <ActivityIcon size={16} />
              <div>
                <label>Total Outreach Activities</label>
                <p>{selectedVillage.activityCount || 0} visits / interventions</p>
              </div>
            </div>

            {Number(selectedVillage.pendingAlertsCount || 0) > 0 && (
              <div className="critical-warning-box">
                <AlertTriangle size={18} />
                <div>
                  <strong>{selectedVillage.pendingAlertsCount} Pending Emergency Cases</strong>
                  <p>Supervisor response/intervention required immediately.</p>
                </div>
              </div>
            )}

            <div className="coverage-bar-group">
              <div className="bar-labels">
                <span>Outreach Density</span>
                <span>{getCoverageStatus(selectedVillage).label}</span>
              </div>
              <div className="progress-bg">
                <div 
                  className={`progress-fill ${getCoverageStatus(selectedVillage).fillClass}`}
                  style={{ width: `${Math.min(((selectedVillage.activityCount || 0) / 15) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="map-placeholder">
            <MapPin size={40} className="floating-pin" />
            <p>Click on any community node on the map to inspect localized metrics, assigned health workers, and field coverage index.</p>
          </div>
        )}
      </div>

      <style>{`
        .map-container-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          overflow: hidden;
          margin-bottom: 2rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
        }

        @media (max-width: 868px) {
          .map-container-grid {
            grid-template-columns: 1fr;
          }
          .map-info-panel {
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
        }

        .map-view {
          padding: 1.5rem;
        }

        .map-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .map-title-bar h3 {
          font-size: 1.25rem;
          color: hsl(var(--text-primary));
        }

        .map-title-bar .subtitle {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .map-mode-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 3px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          border-radius: calc(var(--radius-sm) - 2px);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .toggle-btn.active {
          background: hsl(var(--primary));
          color: hsl(var(--bg-secondary));
          font-weight: 600;
        }

        .leaflet-wrapper {
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #0b1120;
        }

        .leaflet-container {
          background: #0b1120 !important;
        }

        .svg-wrapper {
          background: #080b11;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
        }

        .map-svg {
          width: 100%;
          display: block;
        }

        .map-node {
          cursor: pointer;
        }

        .node-dot {
          transition: transform 0.2s ease, r 0.2s ease;
        }

        .map-node:hover .node-dot {
          r: 11px;
        }

        .node-label {
          fill: hsl(var(--text-secondary));
          font-size: 9px;
          font-weight: 500;
          pointer-events: none;
        }

        .node-label.selected {
          fill: hsl(var(--primary));
          font-size: 11px;
          font-weight: 700;
        }

        .pulse-glow {
          fill: none;
          stroke-width: 2;
          opacity: 0;
          transform-origin: center;
          animation: mapPulse 2s infinite ease-out;
        }

        .danger-pulse { stroke: hsl(var(--danger)); }

        @keyframes mapPulse {
          0% { r: 9px; opacity: 0.8; }
          100% { r: 24px; opacity: 0; }
        }

        .map-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .legend-item .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-item .dot.pulsing {
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .map-info-panel {
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.3);
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .map-placeholder {
          text-align: center;
          color: hsl(var(--text-secondary));
          font-size: 0.85rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .floating-pin {
          color: hsl(var(--primary));
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .village-details h4 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          color: hsl(var(--text-primary));
        }

        .badge-district {
          display: inline-block;
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          color: hsl(var(--text-secondary));
          margin-bottom: 1.25rem;
          font-weight: 500;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .info-row svg {
          color: hsl(var(--primary));
          margin-top: 0.15rem;
        }

        .info-row label {
          display: block;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.1rem;
        }

        .info-row p {
          color: hsl(var(--text-primary));
          font-weight: 500;
        }

        .critical-warning-box {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-sm);
          margin: 1.25rem 0;
          color: hsl(var(--danger));
          font-size: 0.8rem;
        }

        .critical-warning-box svg { flex-shrink: 0; }
        .critical-warning-box strong { display: block; font-weight: 600; margin-bottom: 0.15rem; }
        .critical-warning-box p { color: hsl(var(--text-secondary)); }

        .coverage-bar-group { margin-top: 1.5rem; }
        .bar-labels { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.5rem; }

        .progress-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill { height: 100%; border-radius: var(--radius-full); }
        .progress-fill.high { background: hsl(var(--success)); }
        .progress-fill.moderate { background: hsl(var(--warning)); }
        .progress-fill.underserved { background: hsl(var(--danger)); }
        .progress-fill.urgent { background: hsl(var(--danger)); }
      `}</style>
    </div>
  );
}
