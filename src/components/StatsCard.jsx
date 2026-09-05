import React from 'react';

export default function StatsCard({ title, value, icon: Icon, trend, trendType = 'up', variant = 'primary' }) {
  return (
    <div className={`glass-panel metric-card ${variant}`}>
      <div className="metric-header">
        <span>{title}</span>
        {Icon && <Icon size={20} />}
      </div>
      <div className="metric-val">{value}</div>
      {trend && (
        <div className="metric-trend">
          <span className={`trend-${trendType}`}>
            {trendType === 'up' ? '↑' : '↓'} {trend}
          </span>
          <span>outreach change</span>
        </div>
      )}
    </div>
  );
}
