import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Plus, TrendingUp, Eye, BarChart3 } from 'lucide-react';
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
import toast from 'react-hot-toast';

const VitalSignsSection = ({ 
  vitalSigns = [], 
  surgery,
  onVitalSignsChange,
  autoSave 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [endTime, setEndTime] = useState('');
  const [manualTime, setManualTime] = useState('');
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    fc: '',
    ritmo: 'Sinusal',
    pasSistolica: '',
    pasDiastolica: '',
    spo2: '',
    etco2: '',
    temperatura: '',
    bis: '',
    diurese: ''
  });

  // Calcular próximo horário sugerido baseado nos registros existentes
  const getNextSuggestedTime = () => {
    if (vitalSigns.length === 0) {
      // Primeiro registro: usar horário base da cirurgia
      return getSurgeryBaseTime();
    }
    
    // Pegar o último registro e adicionar 5 minutos
    const lastRecord = vitalSigns[vitalSigns.length - 1];
    const [hours, minutes] = lastRecord.time.split(':').map(Number);
    const nextDate = new Date();
    nextDate.setHours(hours, minutes + 5, 0, 0);
    
    return nextDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Quando abre o formulário, pré-preencher horário no modo manual
  useEffect(() => {
    if (showForm && !isAutoMode && !manualTime) {
      setManualTime(getNextSuggestedTime());
    }
  }, [showForm, isAutoMode, manualTime, vitalSigns.length]);
  const ritmosCardiacos = [
    'Sinusal',
    'Taquicardia Sinusal',
    'Bradicardia Sinusal',
    'Fibrilação Atrial',
    'Flutter Atrial',
    'Taquicardia Supraventricular',
    'Extrassístoles',
    'Ritmo Nodal'
  ];

  // Calcular duração da cirurgia baseado no horário de fim
  const calculateDurationMinutes = () => {
    if (!surgery?.createdAt || !endTime) return 90; // fallback
    
    let startDate;
    if (surgery.createdAt.seconds) {
      startDate = new Date(surgery.createdAt.seconds * 1000);
    } else if (typeof surgery.createdAt === 'string') {
      startDate = new Date(surgery.createdAt);
    } else {
      startDate = new Date(surgery.createdAt);
    }
    
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const endDate = new Date(startDate);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // Se horário de fim for no dia seguinte
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    return Math.floor((endDate - startDate) / 1000 / 60);
  };
  const calcularPAM = (sistolica, diastolica) => {
    if (!sistolica || !diastolica) return '';
    const pam = Math.round((2 * diastolica + sistolica) / 3);
    return pam;
  };

  // Função para obter horário base da cirurgia
  const getSurgeryBaseTime = () => {
    if (!surgery?.createdAt) {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    let surgeryDate;
    if (surgery.createdAt.seconds) {
      surgeryDate = new Date(surgery.createdAt.seconds * 1000);
    } else if (typeof surgery.createdAt === 'string') {
      surgeryDate = new Date(surgery.createdAt);
    } else {
      surgeryDate = new Date(surgery.createdAt);
    }
    
    return surgeryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Validações
  const validateForm = () => {
    const { fc, pasSistolica, pasDiastolica, spo2, ritmo } = formData;
    
    if (!fc || !pasSistolica || !pasDiastolica || !spo2 || !ritmo) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }
    
    if (parseInt(pasSistolica) <= parseInt(pasDiastolica)) {
      toast.error('PA Sistólica deve ser maior que Diastólica');
      return false;
    }
    
    if (parseInt(fc) < 30 || parseInt(fc) > 200) {
      toast.error('FC deve estar entre 30 e 200 bpm');
      return false;
    }
    
    if (parseInt(spo2) < 70 || parseInt(spo2) > 100) {
      toast.error('SpO2 deve estar entre 70 e 100%');
      return false;
    }
    
    return true;
  };

  // Gerar registros automáticos
  const generateAutoVitalSigns = (baseData, duration) => {
    const records = [];
    const interval = duration < 60 ? 5 : 10; // 5min se <60min, 10min se >=60min
    const totalRecords = Math.floor(duration / interval);
    
    for (let i = 0; i <= totalRecords; i++) {
      const timeOffset = i * interval;
      const recordTime = addMinutesToTime(getSurgeryBaseTime(), timeOffset);
      
      // Primeiro registro usa dados originais
      if (i === 0) {
        records.push({
          id: Date.now() + i,
          time: recordTime,
          ...baseData,
          timestamp: new Date().toISOString()
        });
        continue;
      }
      
      // Gerar variações de 2-7% dos valores base
      const variation = () => (Math.random() * 5 + 2) / 100; // 2-7%
      const randomSign = () => Math.random() > 0.5 ? 1 : -1;
      
      const record = {
        id: Date.now() + i,
        time: recordTime,
        fc: Math.round(baseData.fc * (1 + variation() * randomSign())),
        ritmo: baseData.ritmo, // Ritmo não varia no automático
        pasSistolica: Math.round(baseData.pasSistolica * (1 + variation() * randomSign())),
        pasDiastolica: Math.round(baseData.pasDiastolica * (1 + variation() * randomSign())),
        spo2: Math.min(100, Math.max(90, Math.round(baseData.spo2 * (1 + variation() * randomSign())))),
        etco2: baseData.etco2 ? Math.round(baseData.etco2 * (1 + variation() * randomSign())) : '',
        temperatura: baseData.temperatura ? (baseData.temperatura * (1 + variation() * randomSign())).toFixed(1) : '',
        bis: baseData.bis ? Math.round(baseData.bis * (1 + variation() * randomSign())) : '',
        timestamp: new Date().toISOString()
      };
      
      // Calcular PAM para o registro gerado
      record.pam = calcularPAM(record.pasSistolica, record.pasDiastolica);
      
      records.push(record);
    }
    
    return records;
  };

  // Adicionar minutos ao horário
  const addMinutesToTime = (timeString, minutes) => {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Converte "HH:MM" em minutos decorridos desde o início da cirurgia
  const minutesSinceStart = (timeString, baseDate) => {
    const [h, m] = timeString.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return Math.round((d - baseDate) / 60000);
  };

  // Submeter formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (isAutoMode && !endTime) {
      toast.error('Informe o horário de fim da cirurgia para modo automático');
      return;
    }
    
    if (!isAutoMode && !manualTime) {
      toast.error('Informe o horário do registro no modo manual');
      return;
    }
    
    const pam = calcularPAM(parseInt(formData.pasSistolica), parseInt(formData.pasDiastolica));
    
    const baseRecord = {
      ...formData,
      fc: parseInt(formData.fc),
      pasSistolica: parseInt(formData.pasSistolica),
      pasDiastolica: parseInt(formData.pasDiastolica),
      spo2: parseInt(formData.spo2),
      etco2: formData.etco2 ? parseInt(formData.etco2) : '',
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : '',
      bis: formData.bis ? parseInt(formData.bis) : '',
      pam: pam
    };
    
    let newRecords;
    
    if (isAutoMode) {
      // Gerar registros automáticos baseado no horário de fim
      const duration = calculateDurationMinutes();
      newRecords = generateAutoVitalSigns(baseRecord, duration);
      toast.success(`${newRecords.length} registros gerados automaticamente (${duration} min)`);
    } else {
      // Modo manual - apenas um registro com horário editável
      newRecords = [{
        id: Date.now(),
        time: manualTime,
        ...baseRecord,
        timestamp: new Date().toISOString()
      }];
      toast.success('Registro de sinais vitais adicionado');
    }
    
    const updatedVitalSigns = [...vitalSigns, ...newRecords];
    onVitalSignsChange(updatedVitalSigns);
    
    if (autoSave) {
      await autoSave({ vitalSigns: updatedVitalSigns });
    }
    
    // Resetar formulário apenas se for modo automático
    if (isAutoMode) {
      setFormData({
        fc: '', ritmo: 'Sinusal', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', temperatura: '', bis: '', diurese: ''
      });
      setEndTime('');
    } else {
      // No modo manual, só limpa os campos mas mantém o formulário aberto
      setFormData({
        fc: '', ritmo: 'Sinusal', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', temperatura: '', bis: '', diurese: ''
      });
      setManualTime('');
    }
  };

  // Remover registro de sinais vitais
  const removeVitalSign = async (recordId) => {
    const updatedVitalSigns = vitalSigns.filter(record => record.id !== recordId);
    onVitalSignsChange(updatedVitalSigns);
    
    if (autoSave) {
      await autoSave({ vitalSigns: updatedVitalSigns });
    }
    
    toast.success('Registro removido');
  };

  // Data de início da cirurgia como Date
  const surgeryStartDate = useMemo(() => {
    if (!surgery?.createdAt) return null;
    if (surgery.createdAt.seconds) return new Date(surgery.createdAt.seconds * 1000);
    if (typeof surgery.createdAt === 'string') return new Date(surgery.createdAt);
    return new Date(surgery.createdAt);
  }, [surgery]);

  // Dados para o gráfico Recharts
  const chartData = useMemo(() => {
    if (!surgeryStartDate) return [];
    return vitalSigns.map(v => ({
      tMin: minutesSinceStart(v.time, surgeryStartDate),
      pas : v.pasSistolica,
      pad : v.pasDiastolica,
      pam : v.pam,
      fc  : v.fc,
      spo2: v.spo2,
      labelTime: v.time // Adiciona o horário real formatado
    }));
  }, [vitalSigns, surgeryStartDate]);

  // Calcular PAM em tempo real
  const currentPAM = calcularPAM(parseInt(formData.pasSistolica), parseInt(formData.pasDiastolica));

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Sinais Vitais ({vitalSigns.length} registros)
          </h3>
          <div className="flex gap-2">
            {vitalSigns.length > 0 && (
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
          </div>
        </div>
      </div>

      {/* Formulário de entrada */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">
              Registrar Sinais Vitais
              {isAutoMode && ` - ${getSurgeryBaseTime()}`}
            </h4>
            {!isAutoMode && (
              <div className="ml-auto">
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Cardiovasculares - Obrigatórios */}
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <h5 className="text-sm font-medium text-red-800 mb-3">
                📊 Cardiovasculares (Obrigatórios)
              </h5>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    FC (bpm) *
                  </label>
                  <input
                    type="number"
                    value={formData.fc}
                    onChange={(e) => setFormData({...formData, fc: e.target.value})}
                    placeholder="Ex: 72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ritmo *
                  </label>
                  <select
                    value={formData.ritmo}
                    onChange={(e) => setFormData({...formData, ritmo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {ritmosCardiacos.map(ritmo => (
                      <option key={ritmo} value={ritmo}>{ritmo}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PA Sistólica *
                  </label>
                  <input
                    type="number"
                    value={formData.pasSistolica}
                    onChange={(e) => setFormData({...formData, pasSistolica: e.target.value})}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PA Diastólica *
                  </label>
                  <input
                    type="number"
                    value={formData.pasDiastolica}
                    onChange={(e) => setFormData({...formData, pasDiastolica: e.target.value})}
                    placeholder="80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    PAM (calculada)
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 flex items-center justify-center">
                    {currentPAM || '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Respiratórios */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h5 className="text-sm font-medium text-blue-800 mb-3">
                🫁 Respiratórios
              </h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    SpO2 (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.spo2}
                    onChange={(e) => setFormData({...formData, spo2: e.target.value})}
                    placeholder="98"
                    min="70"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    EtCO2 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.etco2}
                    onChange={(e) => setFormData({...formData, etco2: e.target.value})}
                    placeholder="35"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Outros parâmetros */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">
                🔍 Outros Parâmetros (Opcionais)
              </h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) => setFormData({...formData, temperatura: e.target.value})}
                    placeholder="36.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    BIS (0-100)
                  </label>
                  <input
                    type="number"
                    value={formData.bis}
                    onChange={(e) => setFormData({...formData, bis: e.target.value})}
                    placeholder="45"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Opção de modo automático */}
            <div className="bg-primary-50 p-3 rounded-lg border border-primary-200">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAutoMode}
                  onChange={(e) => setIsAutoMode(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-primary-800">
                    🤖 Modo Automático
                  </span>
                  <p className="text-xs text-primary-600">
                    Gerar registros automáticos com variações de 2-7% dos valores base
                  </p>
                </div>
              </label>
              
              {/* Campo de horário de fim - apenas no modo automático */}
              {isAutoMode && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Horário de fim da cirurgia *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Registros serão gerados do início até este horário
                  </p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    fc: '', ritmo: 'Sinusal', pasSistolica: '', pasDiastolica: '',
                    spo2: '', etco2: '', temperatura: '', bis: '', diurese: ''
                  });
                  setEndTime('');
                  setManualTime('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {isAutoMode ? 'Gerar Automático' : 'Adicionar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualização gráfica */}
      {showGraphs && vitalSigns.length > 0 && (
        <VitalChart chartData={chartData} />
      )}

      {/* Lista de registros */}
      {vitalSigns.length > 0 ? (
        <div className="space-y-2">
          {vitalSigns.map((record) => (
            <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-medium text-blue-600">
                  {record.time}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {record.ritmo}
                  </span>
                  <button
                    onClick={() => removeVitalSign(record.id)}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-full transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">FC:</span>
                  <span className="font-medium ml-1">{record.fc} bpm</span>
                </div>
                <div>
                  <span className="text-gray-600">SpO2:</span>
                  <span className="font-medium ml-1">{record.spo2}%</span>
                </div>
                <div>
                  <span className="text-gray-600">PA:</span>
                  <span className="font-medium ml-1">
                    {record.pasSistolica}/{record.pasDiastolica} (PAM: {record.pam})
                  </span>
                </div>
                {record.etco2 && (
                  <div>
                    <span className="text-gray-600">EtCO2:</span>
                    <span className="font-medium ml-1">{record.etco2} mmHg</span>
                  </div>
                )}
              </div>
              
              {(record.temperatura || record.bis) && (
                <div className="grid grid-cols-2 gap-4 text-xs mt-2 pt-2 border-t border-gray-100">
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
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhum registro de sinais vitais ainda</p>
          <p className="text-xs">Clique em "Novo Registro" para começar</p>
        </div>
      )}
    </div>
  );
};

// --- Componente de gráfico usando Recharts ------------------------------
const VitalChart = ({ chartData }) => {
  const TriangleDown = ({ cx, cy, ...rest }) => (
    <path d={`M${cx - 6},${cy - 18} L${cx + 6},${cy - 18} L${cx},${cy} Z`} fill="#d63031" {...rest} />
  );
  const TriangleUp = ({ cx, cy, ...rest }) => (
    <path d={`M${cx - 6},${cy + 18} L${cx + 6},${cy + 18} L${cx},${cy} Z`} fill="#d63031" {...rest} />
  );

  // Dynamic Y axis maximum based on PAS values
  const maxPas = Math.max(...chartData.map(d => d.pas || 0));
  const yMax = Math.ceil((maxPas + 30) / 10) * 10;
  const yTicks = Array.from({ length: Math.floor(yMax / 10) + 1 }, (_, i) => i * 10);

  // Compute xMin, xMax, xDomain, xTicks for XAxis
  const xMin = Math.min(...chartData.map(d => d.tMin));
  const xMax = Math.max(...chartData.map(d => d.tMin));
  const xDomain = [Math.max(0, xMin - 10), xMax + 10];
  const xTicks = Array.from(
    { length: Math.floor((xDomain[1] - xDomain[0]) / 10) + 1 },
    (_, i) => xDomain[0] + i * 10
  );

  // Obter a data de início da cirurgia para o tickFormatter
  // Busca o menor labelTime para obter a base real, mas como tMin=0 é o início, pega o primeiro ponto
  const surgeryStartDate =
    chartData && chartData.length > 0
      ? (() => {
          // Achar o tMin==0 se existir, senão pega o menor tMin
          let minTMin = Math.min(...chartData.map(d => d.tMin));
          let base = chartData.find(d => d.tMin === 0) || chartData.find(d => d.tMin === minTMin);
          // Como não temos acesso direto à Date, usamos o labelTime do ponto tMin==0
          if (base && base.labelTime) {
            // Tenta criar uma data "hoje" com o horário de base.labelTime
            const [h, m] = base.labelTime.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          }
          return null;
        })()
      : null;

  return (
    <div className="bg-white px-2 py-3 rounded-lg border border-gray-200 shadow-sm">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        Gráfico de Sinais Vitais
      </h4>

      <div className="w-full flex justify-center">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 25, left: 30 }}>
            <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />

            {/* Eixo X – minutos desde o início (adaptativo) */}
            <XAxis
              type="number"
              dataKey="tMin"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={(tMin) => {
                if (!surgeryStartDate) return '';
                const realTime = new Date(surgeryStartDate.getTime() + tMin * 60000);
                return realTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              }}
              label={{ value: 'Tempo (min)', position: 'insideBottom', offset: -30 }}
              tick={{ fontSize: 10 }}
            />

            {/* Eixo Y – domínio dinâmico baseado no maior PAS */}
            <YAxis
              domain={[0, yMax]}
              ticks={yTicks}
              tickCount={10}
              tick={{ fontSize: 10 }}
            />

            {/* Séries */}
            <Scatter name="PAS" data={chartData} dataKey="pas" shape={TriangleDown} />
            <Scatter name="PAD" data={chartData} dataKey="pad" shape={TriangleUp} />
            <Scatter data={chartData} dataKey="pam" shape={() => null}>
              <LabelList dataKey="pam" position="bottom" fontSize={10} offset={60} />
            </Scatter>
            <Scatter name="FC"  data={chartData} dataKey="fc"
                     shape={(p) => <circle {...p} r={5} fill="#000" />} />

            {/* SpO₂ – somente rótulo numérico acima do ponto */}
            <Scatter data={chartData} dataKey="spo2" shape={() => null}>
              <LabelList dataKey="spo2" position="top" formatter={(value) => `${value}%`} fontSize={10} offset={60} />
            </Scatter>

            <Tooltip cursor={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VitalSignsSection;