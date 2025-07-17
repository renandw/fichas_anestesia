import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from 'recharts';

const VitalChart = ({ 
  vitalSigns = [], 
  surgery,
  showTitle = true,
  height = 320,
  compact = false // Para versão de impressão
}) => {
  // Calcular data de início da cirurgia
  const surgeryStartDate = useMemo(() => {
    const base = surgery?.startTime || surgery?.createdAt;
    if (!base) return null;
    if (base.seconds) return new Date(base.seconds * 1000);
    if (typeof base === 'string') return new Date(base);
    return new Date(base);
  }, [surgery]);

  // Converter tempo "HH:MM" em minutos desde o início
  const minutesSinceStart = (timeString, baseDate) => {
    if (!baseDate) return 0;
    const [h, m] = timeString.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return Math.round((d - baseDate) / 60000);
  };

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (!surgeryStartDate || vitalSigns.length === 0) return [];
    
    return vitalSigns.map(v => ({
      tMin: minutesSinceStart(v.time, surgeryStartDate),
      pas: v.pasSistolica,
      pad: v.pasDiastolica,
      pam: v.pam,
      fc: v.fc,
      spo2: v.spo2,
      etco2: v.etco2 || null,
      labelTime: v.time,
      rawData: v // Para tooltip detalhado
    }));
  }, [vitalSigns, surgeryStartDate]);

  // Componentes de forma customizados
  const TriangleDown = ({ cx, cy, tooltipPosition, tooltipPayload, rawData, labelTime, tMin, ...rest }) => (
    <path 
      d={`M${cx - 6},${cy - 18} L${cx + 6},${cy - 18} L${cx},${cy} Z`} 
      fill="#d63031" 
      {...rest} 
    />
  );
  
  const TriangleUp = ({ cx, cy, tooltipPosition, tooltipPayload, rawData, labelTime, tMin, ...rest }) => (
    <path 
      d={`M${cx - 6},${cy + 18} L${cx + 6},${cy + 18} L${cx},${cy} Z`} 
      fill="#d63031" 
      {...rest} 
    />
  );

  const HeartShape = ({ cx, cy, tooltipPosition, tooltipPayload, rawData, labelTime, tMin, ...rest }) => (
    <circle {...rest} cx={cx} cy={cy} r={5} fill="#000" />
  );

  // Calcular domínios dos eixos
  const maxPas = chartData.length > 0 ? Math.max(...chartData.map(d => d.pas || 0)) : 120;
  const yMax = Math.ceil((maxPas + 30) / 10) * 10;
  const yTicks = Array.from({ length: Math.floor(yMax / 10) + 1 }, (_, i) => i * 10);

  const xMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.tMin)) : 0;
  const xMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.tMin)) : 60;
  const xDomain = [Math.max(0, xMin - 10), xMax + 10];
  const xTicks = Array.from(
    { length: Math.floor((xDomain[1] - xDomain[0]) / 10) + 1 },
    (_, i) => xDomain[0] + i * 10
  );

  // Formatter para o eixo X (horários)
  const xAxisTickFormatter = (tMin) => {
    if (!surgeryStartDate) return '';
    const realTime = new Date(surgeryStartDate.getTime() + tMin * 60000);
    return realTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0]?.payload;
    if (!data || !data.rawData) return null;

    const record = data.rawData;
    
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-xs">
        <div className="font-semibold text-gray-900 mb-2">
          {record.time} ({data.tMin >= 0 ? '+' : ''}{data.tMin} min)
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-gray-600">PA:</span>
            <span className="font-medium ml-1">
              {record.pasSistolica}/{record.pasDiastolica} (PAM: {record.pam})
            </span>
          </div>
          <div>
            <span className="text-gray-600">FC:</span>
            <span className="font-medium ml-1">{record.fc} bpm ({record.ritmo})</span>
          </div>
          <div>
            <span className="text-gray-600">SpO2:</span>
            <span className="font-medium ml-1">{record.spo2}%</span>
          </div>
          {record.etco2 && (
            <div>
              <span className="text-gray-600">EtCO2:</span>
              <span className="font-medium ml-1">{record.etco2} mmHg</span>
            </div>
          )}
          {record.temperatura && (
            <div>
              <span className="text-gray-600">Temp:</span>
              <span className="font-medium ml-1">{record.temperatura}°C</span>
            </div>
          )}
          {record.bis && (
            <div>
              <span className="text-gray-600">BIS:</span>
              <span className="font-medium ml-1">{record.bis}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Se não há dados, mostrar mensagem
  if (chartData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {showTitle && (
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Gráfico de Sinais Vitais
          </h4>
        )}
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhum dado de sinais vitais para exibir</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {showTitle && (
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Gráfico de Sinais Vitais
        </h4>
      )}

      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart 
            margin={{ top: 4, right: 0, bottom: 12, left: 0 }}
          >
            <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />

            {/* Eixo X - Tempo */}
            <XAxis
              type="number"
              dataKey="tMin"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={xAxisTickFormatter}
              label={{ 
                value: 'Horário', 
                position: 'insideBottom', 
                offset: compact ? -15 : -20 
              }}
              tick={{ fontSize: compact ? 8 : 10 }}
            />

            {/* Eixo Y - Valores */}
            <YAxis
              domain={[0, yMax]}
              ticks={yTicks}
              tickCount={10}
              tick={{ fontSize: compact ? 8 : 10 }}
            />

            {/* Séries de dados */}
            
            {/* PAS - Triângulo para baixo */}
            <Scatter 
              name="PAS" 
              data={chartData} 
              dataKey="pas" 
              shape={TriangleDown}
            />
            
            {/* PAD - Triângulo para cima */}
            <Scatter 
              name="PAD" 
              data={chartData} 
              dataKey="pad" 
              shape={TriangleUp}
            />
            
            {/* PAM - Apenas label */}
            <Scatter data={chartData} dataKey="pam" shape={() => null}>
              <LabelList 
                dataKey="pam" 
                position="bottom" 
                fontSize={compact ? 8 : 10} 
                offset={compact ? 50 : 60} 
              />
            </Scatter>
            
            {/* FC - Círculo preto */}
            <Scatter 
              name="FC" 
              data={chartData} 
              dataKey="fc" 
              shape={HeartShape}
            />

            {/* SpO2 - Apenas label em porcentagem */}
            <Scatter data={chartData} dataKey="spo2" shape={() => null}>
              <LabelList 
                dataKey="spo2" 
                position="top" 
                formatter={(value) => `${value}%`} 
                fontSize={compact ? 8 : 10} 
                offset={compact ? 50 : 60} 
              />
            </Scatter>

            {/* EtCO2 - Se disponível, mostrar como pontos pequenos */}
            {chartData.some(d => d.etco2) && (
              <Scatter 
                name="EtCO2" 
                data={chartData.filter(d => d.etco2)} 
                dataKey="etco2" 
                shape={(props) => <circle {...props} r={3} fill="#9b59b6" />}
              />
            )}

            {/* Tooltip */}
            {!compact && <Tooltip content={<CustomTooltip />} cursor={false} />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda manual */}
      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-600 justify-center leading-tight">
        <div className="flex items-center gap-1">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-600"></div>
          <span>PAS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-600"></div>
          <span>PAD</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-black rounded-full"></div>
          <span>FC</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold">%</span>
          <span>SpO2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-700">123</span>
          <span>PAM</span>
        </div>
        {chartData.some(d => d.etco2) && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <span>EtCO2</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalChart;