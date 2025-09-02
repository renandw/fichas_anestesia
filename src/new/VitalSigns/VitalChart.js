import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ReferenceLine
} from 'recharts';

// Normalizador seguro para Date/Timestamp/ISO
const safeToDate = (val) => {
  if (!val) return null;
  try {
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (typeof val === 'object' && val !== null) {
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1e6) : 0));
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000 + (val._nanoseconds ? Math.floor(val._nanoseconds / 1e6) : 0));
    }
    if (typeof val === 'number') return new Date(val < 1e12 ? val * 1000 : val);
    if (typeof val === 'string') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
  } catch (e) {
    // silencioso
  }
  return null;
};

const VitalChart = ({ 
  vitalSigns = [], 
  surgery,
  anesthesia,
  compact = false,
  showTooltip = true,
  showReferenceLines = true
}) => {
  // Calcular data-âncora
  const anchorDate = useMemo(() => {
    const cand = anesthesia?.anesthesiaStart ?? surgery?.anesthesiaStart ?? surgery?.startTime ?? surgery?.createdAt;
    return safeToDate(cand);
  }, [anesthesia, surgery]);

  // Converter tempo absoluto em minutos desde o início
  const minutesSinceStart = (absoluteTimestamp, baseDate) => {
    if (!baseDate || !absoluteTimestamp) return 0;
    const base = safeToDate(baseDate);
    const ts = safeToDate(absoluteTimestamp);
    if (!base || !ts) return 0;
    return Math.round((ts - base) / 60000);
  };

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (!anchorDate || vitalSigns.length === 0) return [];
    
    return vitalSigns.map(v => ({
      tMin: minutesSinceStart(v.absoluteTimestamp, anchorDate),
      pas: v.pasSistolica,
      pad: v.pasDiastolica,
      pam: v.pam,
      fc: v.fc,
      spo2: v.spo2,
      etco2: v.etco2 || null,
      rawData: v
    }));
  }, [vitalSigns, anchorDate]);

  // Configurações baseadas no modo compact
  const settings = useMemo(() => {
    if (compact) {
      return {
        fontSize: 8,
        tickFontSize: 8,
        labelOffset: { spo2: 25, pam: 30 },
        margins: { top: 40, right: 20, bottom: 18, left: 0 },
        minGap: { pam: 12, spo2: 10 }
      };
    }
    
    return {
      fontSize: 10,
      tickFontSize: 10,
      labelOffset: { spo2: 35, pam: 42 },
      margins: { top: 50, right: 25, bottom: 25, left: 0 },
      minGap: { pam: 8, spo2: 6 }
    };
  }, [compact]);

  // Filtrar dados para labels (evitar sobreposição)
  const pamLabelData = useMemo(() => {
    const filtered = [];
    const minGap = settings.minGap.pam;
    for (let i = 0; i < chartData.length; i++) {
      const curr = chartData[i];
      const last = filtered[filtered.length - 1];
      if (!last || (curr.tMin - last.tMin) >= minGap) {
        filtered.push(curr);
      }
    }
    return filtered;
  }, [chartData, settings.minGap.pam]);

  const spo2LabelData = useMemo(() => {
    const filtered = [];
    const minGap = settings.minGap.spo2;
    for (let i = 0; i < chartData.length; i++) {
      const curr = chartData[i];
      const last = filtered[filtered.length - 1];
      if (!last || (curr.tMin - last.tMin) >= minGap) {
        filtered.push(curr);
      }
    }
    return filtered;
  }, [chartData, settings.minGap.spo2]);

  // Componentes de forma customizados
  const TriangleDown = ({ cx, cy }) => (
    <path 
      d={`M${cx - 6},${cy - 18} L${cx + 6},${cy - 18} L${cx},${cy} Z`} 
      fill="#d63031" 
      aria-label="PAS (sistólica)"
    />
  );
  
  const TriangleUp = ({ cx, cy }) => (
    <path 
      d={`M${cx - 6},${cy + 18} L${cx + 6},${cy + 18} L${cx},${cy} Z`} 
      fill="#d63031" 
      aria-label="PAD (diastólica)"
    />
  );
  
  const HeartShape = ({ cx, cy }) => (
    <circle cx={cx} cy={cy} r={5} fill="#000" aria-label="FC" />
  );

  const Etco2Dot = ({ cx, cy, r = 3, fill = '#9b59b6' }) => (
    <circle cx={cx} cy={cy} r={r} fill={fill} />
  );

  const DiamondShape = ({ cx, cy }) => (
    <path 
      d={`M${cx},${cy - 6} L${cx + 6},${cy} L${cx},${cy + 6} L${cx - 6},${cy} Z`} 
      fill="#2563eb" 
      aria-label="PAM"
    />
  );

  const CrossShape = ({ cx, cy }) => (
    <g fill="#059669" aria-label="SpO2">
      <rect x={cx - 5} y={cy - 1} width={10} height={2} />
      <rect x={cx - 1} y={cy - 5} width={2} height={10} />
    </g>
  );

  // Calcular domínios dos eixos
  const maxPas = chartData.length > 0 ? Math.max(...chartData.map(d => d.pas || 0)) : 120;
  const yMax = Math.ceil((maxPas + 30) / 10) * 10;
  const yTicks = Array.from({ length: Math.floor(yMax / 10) + 1 }, (_, i) => i * 10);

  const xMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.tMin)) : 0;
  const xMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.tMin)) : 60;
  const xDomain = [Math.max(0, xMin - 10), xMax + 10];
  const xTicks = useMemo(() => {
    const start = Math.floor(xDomain[0] / 10) * 10;
    const end = Math.ceil(xDomain[1] / 10) * 10;
    const ticks = [];
    
    for (let t = start; t <= end; t += 10) {
      if (t >= xDomain[0] && t <= xDomain[1]) {
        ticks.push(t);
      }
    }
    
    return ticks;
  }, [xDomain]);

  // Formatter para o eixo X (horários)
  const xAxisTickFormatter = (tMin) => {
    if (!anchorDate) return '';
    // Remove: if (Math.abs(tMin % 30) !== 0) return '';
    const realTime = new Date(anchorDate.getTime() + tMin * 60000);
    return realTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0]?.payload;
    if (!data || !data.rawData) return null;

    const record = data.rawData;
    
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-xs">
        <div className="font-semibold text-gray-900 mb-2">
          {record.absoluteTimestamp?.toDate?.()?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? new Date(record.absoluteTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {' '}({data.tMin >= 0 ? '+' : ''}{data.tMin} min)
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
            <span className="font-medium ml-1">{record.fc} bpm{record.ritmo ? ` (${record.ritmo})` : ''}</span>
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

  // Se não há dados, não renderiza nada (deixa o componente pai cuidar do estado vazio)
  if (chartData.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={settings.margins}>
        <CartesianGrid 
          stroke="#d4d4d4" 
          strokeDasharray="3 3"
          horizontal
          vertical
        />

        {/* Marcadores de referência */}
        {showReferenceLines && (
          <>
            <ReferenceLine
              x={0}
              stroke="#2563eb"
              strokeDasharray="4 4"
              label={{ 
                value: 'Início Anestesia', 
                position: 'top', 
                fontSize: settings.fontSize 
              }}
            />

            <ReferenceLine
              x={Math.max(...chartData.map(d => d.tMin))}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ 
                value: 'Último Registro', 
                position: 'top', 
                fontSize: settings.fontSize 
              }}
            />
          </>
        )}

        {/* Eixo X - Tempo */}
        <XAxis
          type="number"
          dataKey="tMin"
          domain={xDomain}
          ticks={xTicks}
          tickFormatter={xAxisTickFormatter}
          angle={-35}
          textAnchor="end"
          tickMargin={2}
          tick={{ fontSize: settings.tickFontSize }}
        />

        {/* Eixo Y - Valores */}
        <YAxis
          domain={[0, yMax]}
          ticks={yTicks}
          interval={0}
          allowDecimals={false}
          tick={{ fontSize: settings.tickFontSize }}
        />

        {/* Séries de dados */}
        <Scatter name="PAS" data={chartData} dataKey="pas" shape={TriangleDown} />
        <Scatter name="PAD" data={chartData} dataKey="pad" shape={TriangleUp} />
        <Scatter name="FC" data={chartData} dataKey="fc" shape={HeartShape} />
        
        {/* PAM - Losango + Labels */}
        <Scatter name="PAM" data={chartData} dataKey="pam" shape={DiamondShape} />
        <Scatter data={pamLabelData} dataKey="pam" shape={() => null}>
          <LabelList 
            dataKey="pam" 
            position="bottom" 
            formatter={(value) => (value == null ? '' : String(value))}
            fontSize={settings.fontSize}
            offset={settings.labelOffset.pam}
          />
        </Scatter>

        {/* SpO2 - Cruz + Labels */}
        <Scatter name="SpO2" data={chartData} dataKey="spo2" shape={CrossShape} />
        <Scatter data={spo2LabelData} dataKey="spo2" shape={() => null}>
          <LabelList 
            dataKey="spo2" 
            position="top" 
            formatter={(value) => (value == null ? '' : `${value}%`)} 
            fontSize={settings.fontSize}
            offset={settings.labelOffset.spo2}
          />
        </Scatter>

        {/* EtCO2 */}
        {chartData.some(d => d.etco2) && (
          <Scatter 
            name="EtCO2" 
            data={chartData.filter(d => d.etco2)} 
            dataKey="etco2" 
            shape={Etco2Dot}
          />
        )}

        {/* Tooltip */}
        {showTooltip && <Tooltip content={<CustomTooltip />} cursor={false} />}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default VitalChart;