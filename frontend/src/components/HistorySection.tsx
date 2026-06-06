import React from 'react';
import { SensorChart } from './SensorChart';
import { TimeRangeFilter } from './TimeRangeFilter';
import type { TimeRange } from './TimeRangeFilter';
import type { SensorReading, ThresholdConfig } from '../types';
import { METRICS } from '../utils/dashboard';

interface HistorySectionProps {
  data: SensorReading[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  thresholds?: ThresholdConfig | null;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ data, timeRange, onTimeRangeChange, thresholds }) => {
  const [isGuideOpen, setIsGuideOpen] = React.useState(() => {
    const saved = localStorage.getItem('bsf_chart_guide_collapsed');
    return saved ? saved === 'false' : true;
  });

  const toggleGuide = () => {
    const newState = !isGuideOpen;
    setIsGuideOpen(newState);
    localStorage.setItem('bsf_chart_guide_collapsed', (!newState).toString());
  };

  const climateMetrics = METRICS.filter(m => m.key === 'temperature' || m.key === 'humidity');
  const lightMetrics = METRICS.filter(m => m.key === 'light_intensity');

  return (
    <div className="card-base mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Historical Trends</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor all metrics over time</p>
        </div>
        <TimeRangeFilter value={timeRange} onChange={onTimeRangeChange} />
      </div>
      
      {/* Chart Reading Guide */}
      <div className="mb-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">CARA MEMBACA GRAFIK</h4>
          <button 
            onClick={toggleGuide}
            aria-expanded={isGuideOpen}
            className="text-xs font-medium text-[#0F766E] hover:text-[#0D655E] flex items-center gap-1 transition-colors"
          >
            {isGuideOpen ? 'Sembunyikan panduan' : 'Tampilkan panduan'}
            <i className={`ti ti-chevron-${isGuideOpen ? 'up' : 'down'}`} aria-hidden="true"></i>
          </button>
        </div>
        
        <div 
          className="transition-all duration-300 ease-in-out"
          style={{ maxHeight: isGuideOpen ? '500px' : '0px', opacity: isGuideOpen ? 1 : 0 }}
        >
          <div className="px-4 pb-5">
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Grafik menampilkan tiga metrik sekaligus. Gunakan filter waktu untuk melihat tren jangka pendek maupun panjang. Perhatikan jika garis suhu dan kelembaban bergerak berlawanan arah — ini bisa menandakan masalah ventilasi.
            </p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[#0F766E]"></div>
                <span className="text-xs"><strong className="text-slate-700">Suhu</strong> <span className="text-slate-500">— ideal: &le; {thresholds?.temp_warning ?? 30}°C, kritis: &gt; {thresholds?.temp_critical ?? 32}°C</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[#8B5CF6]"></div>
                <span className="text-xs"><strong className="text-slate-700">Kelembaban</strong> <span className="text-slate-500">— ideal: &ge; {thresholds?.humid_warning ?? 60}%, kritis: &lt; {thresholds?.humid_critical ?? 50}%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[#F59E0B]"></div>
                <span className="text-xs"><strong className="text-slate-700">Intensitas Cahaya</strong> <span className="text-slate-500">— ideal: &ge; {thresholds?.light_warning ?? 2500}, kritis: &lt; {thresholds?.light_critical ?? 2000}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Climate (Temperature & Humidity)</h3>
          <SensorChart data={data} timeRange={timeRange} metrics={climateMetrics} />
        </div>
        <div className="border-t border-slate-100 pt-8">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Environment (Light Intensity)</h3>
          <SensorChart data={data} timeRange={timeRange} metrics={lightMetrics} />
        </div>
      </div>
    </div>
  );
};

