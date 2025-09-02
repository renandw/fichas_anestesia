import React from 'react';
import { BarChart3 } from 'lucide-react';
import VitalChart from './VitalChart'; // Componente puro

const VitalChartSection = ({ 
  vitalSigns = [],
  surgery,
  anesthesia,
  isLoading = false,
  error = null,
  height = 250,
  title = "GRÁFICO DE SINAIS VITAIS",
  showTitle = true,
  compact = false
}) => {
  
  // Estados de carregamento
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {showTitle && (
          <h4 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 mb-2">
            {title}
          </h4>
        )}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${height - (showTitle ? 35 : 0)}px` }}
        >
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Carregando sinais vitais...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estados de erro
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {showTitle && (
          <h4 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-red-500 mb-2">
            {title}
          </h4>
        )}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${height - (showTitle ? 35 : 0)}px` }}
        >
          <div className="text-center text-red-600">
            <p className="text-sm">Erro ao carregar sinais vitais: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado vazio
  if (!vitalSigns || vitalSigns.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {showTitle && (
          <h4 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 mb-2">
            {title}
          </h4>
        )}
        <div 
          className="flex items-center justify-center"
          style={{ height: `${height - (showTitle ? 35 : 0)}px` }}
        >
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum sinal vital registrado ainda.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se há dados para mostrar na legenda
  const hasData = {
    pas: vitalSigns.some(v => v.pasSistolica != null),
    pad: vitalSigns.some(v => v.pasDiastolica != null),
    fc: vitalSigns.some(v => v.fc != null),
    spo2: vitalSigns.some(v => v.spo2 != null),
    pam: vitalSigns.some(v => v.pam != null),
    etco2: vitalSigns.some(v => v.etco2 != null)
  };

  const legendHeight = compact ? 25 : 35;
  const titleHeight = showTitle ? 35 : 0;
  const chartHeight = height - titleHeight - legendHeight;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Título */}
      {showTitle && (
        <h4 className="bg-gray-200 px-2 py-1 font-bold text-xs text-gray-700 rounded-t border-l-4 border-blue-500 mb-2">
          {title}
        </h4>
      )}

      {/* Container do gráfico */}
      <div style={{ height: `${chartHeight}px` }}>
        <VitalChart
          vitalSigns={vitalSigns}
          surgery={surgery}
          anesthesia={anesthesia}
          compact={compact}
          showTooltip={!compact}
          showReferenceLines={true}
        />
      </div>

      {/* Legenda */}
      <div 
        className="flex flex-wrap gap-2 text-gray-600 justify-center leading-tight px-2 border-t border-gray-100"
        style={{ 
          height: `${legendHeight}px`,
          fontSize: compact ? '8px' : '10px',
          alignItems: 'center'
        }}
      >
        {hasData.pas && (
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-600"></div>
            <span>PAS</span>
          </div>
        )}
        {hasData.pad && (
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-600"></div>
            <span>PAD</span>
          </div>
        )}
        {hasData.fc && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <span>FC</span>
          </div>
        )}
        {hasData.spo2 && (
          <div className="flex items-center gap-1">
            <div className="relative w-3 h-3">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-600 transform -translate-y-1/2"></div>
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-green-600 transform -translate-x-1/2"></div>
            </div>
            <span>SpO2</span>
          </div>
        )}
        {hasData.pam && (
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-t-[6px] border-l-transparent border-r-transparent border-b-blue-600 border-t-blue-600 transform rotate-45"></div>
            <span>PAM</span>
          </div>
        )}
        {hasData.etco2 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <span>EtCO2</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalChartSection;