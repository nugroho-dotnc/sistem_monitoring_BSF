import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  isWarning?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, isWarning = false }) => {
  return (
    <div className="card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      border: isWarning ? '2px solid var(--color-error)' : '1px solid transparent'
    }}>
      <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--color-muted)' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span className="text-display" style={{ 
          fontSize: '48px', 
          color: isWarning ? 'var(--color-error)' : 'var(--color-ink)',
          lineHeight: 1
        }}>
          {value}
        </span>
        <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-muted)' }}>
          {unit}
        </span>
      </div>
    </div>
  );
};
