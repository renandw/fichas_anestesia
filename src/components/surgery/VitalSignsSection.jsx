import React, { useState, useEffect } from 'react';
import { Activity, Plus, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import VitalChart from './VitalChart'; // Importar o novo componente

const VitalSignsSection = ({ 
  vitalSigns = [], 
  surgery,
  onVitalSignsChange,
  autoSave 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [simDuration, setSimDuration] = useState('');
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
    const baseDate = surgeryStartDate;
    if (!baseDate) return getSurgeryBaseTime();

    if (vitalSigns.length === 0) return getSurgeryBaseTime();

    const lastRecord = vitalSigns[vitalSigns.length - 1];
    const elapsed = minutesSinceStart(lastRecord.time, baseDate);
    const increment = elapsed < 30 ? 5 : 10;

    return addMinutesToTime(lastRecord.time, increment);
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

  // Retorna a duração em minutos solicitada pelo usuário para o modo automático
  const calculateDurationMinutes = () => {
    if (!simDuration) return 90; // fallback
    return parseInt(simDuration);
  };

  const calcularPAM = (sistolica, diastolica) => {
    if (!sistolica || !diastolica) return '';
    const pam = Math.round((2 * diastolica + sistolica) / 3);
    return pam;
  };

  // Função para obter horário base da cirurgia
  const getSurgeryBaseTime = () => {
    const base = surgery?.startTime || surgery?.createdAt;
    if (!base) {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    let surgeryDate;
    if (base.seconds) {
      surgeryDate = new Date(base.seconds * 1000);
    } else if (typeof base === 'string') {
      surgeryDate = new Date(base);
    } else {
      surgeryDate = new Date(base);
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

  // `startTime` define a hora inicial (HH:MM) para geração dos registros;
  // quando omitido, o horário base da cirurgia é usado.
  const generateAutoVitalSigns = (
    baseData,
    duration,
    startTime = getSurgeryBaseTime(),
    existingTimes = []
  ) => {
    const records = [];
    let offset = 0;
    let i = 0;

    const variation = () => (Math.random() * 5 + 2) / 100;
    const randomSign = () => (Math.random() > 0.5 ? 1 : -1);

    while (offset <= duration) {
      const recordTime = addMinutesToTime(startTime, offset);

      if (!existingTimes.includes(recordTime)) {
        const record =
          i === 0
            ? {
                id: Date.now() + i,
                time: recordTime,
                ...baseData,
                timestamp: new Date().toISOString()
              }
            : {
                id: Date.now() + i,
                time: recordTime,
                fc: Math.round(baseData.fc * (1 + variation() * randomSign())),
                ritmo: baseData.ritmo,
                pasSistolica: Math.round(
                  baseData.pasSistolica * (1 + variation() * randomSign())
                ),
                pasDiastolica: Math.round(
                  baseData.pasDiastolica * (1 + variation() * randomSign())
                ),
                spo2: Math.min(
                  100,
                  Math.max(
                    90,
                    Math.round(baseData.spo2 * (1 + variation() * randomSign()))
                  )
                ),
                etco2: baseData.etco2
                  ? Math.round(baseData.etco2 * (1 + variation() * randomSign()))
                  : '',
                temperatura: baseData.temperatura
                  ? (
                      baseData.temperatura *
                      (1 + variation() * randomSign())
                    ).toFixed(1)
                  : '',
                bis: baseData.bis
                  ? Math.round(baseData.bis * (1 + variation() * randomSign()))
                  : '',
                timestamp: new Date().toISOString(),
                pam: calcularPAM(
                  Math.round(
                    baseData.pasSistolica * (1 + variation() * randomSign())
                  ),
                  Math.round(
                    baseData.pasDiastolica * (1 + variation() * randomSign())
                  )
                )
              };

        records.push(record);
      }

      // Incremento: 5min até 30min de cirurgia, depois 10min
      const increment = offset < 30 ? 5 : 10;
      offset += increment;
      i += 1;
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

  // Data de início da cirurgia como Date
  const surgeryStartDate = (() => {
    const base = surgery?.startTime || surgery?.createdAt;
    if (!base) return null;
    if (base.seconds) return new Date(base.seconds * 1000);
    if (typeof base === 'string') return new Date(base);
    return new Date(base);
  })();

  // Submeter formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isAutoMode && (!simDuration || parseInt(simDuration) <= 0)) {
      toast.error('Informe a duração (min) para simulação automática');
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
      // Define o horário inicial da geração automática:
      // se já existe algum registro, começa a partir do último;
      // caso contrário, usa o horário base da cirurgia.
      const startTimeForAuto = vitalSigns.length > 0
        ? vitalSigns[vitalSigns.length - 1].time
        : getSurgeryBaseTime();

      const duration = calculateDurationMinutes();

      // Gera os registros automáticos a partir do último horário existente
      newRecords = generateAutoVitalSigns(baseRecord, duration, startTimeForAuto);
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
      setSimDuration('');
    } else {
      // No modo manual, só limpa os campos mas mantém o formulário aberto
      setFormData({
        fc: '', ritmo: 'Sinusal', pasSistolica: '', pasDiastolica: '',
        spo2: '', etco2: '', temperatura: '', bis: '', diurese: ''
      });
      setManualTime('');
    }
  };

  const removeVitalSign = async (recordId) => {
    const updatedVitalSigns = vitalSigns.filter(record => record.id !== recordId);
    onVitalSignsChange(updatedVitalSigns);
    
    if (autoSave) {
      await autoSave({ vitalSigns: updatedVitalSigns });
    }
    
    toast.success('Registro removido');
  };

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
            <button
              onClick={async () => {
                if (autoSave) {
                  await autoSave({ endTime: new Date().toISOString() });
                }
                toast.success('Registros encerrados');
              }}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Encerrar
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
              
              {/* Campo de duração - apenas no modo automático */}
              {isAutoMode && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Duração a simular (min) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={simDuration}
                    onChange={(e) => setSimDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Serão gerados registros automáticos por esse intervalo
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
                  setSimDuration('');
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

      {/* Visualização gráfica usando o novo componente */}
      {showGraphs && vitalSigns.length > 0 && (
        <VitalChart 
          vitalSigns={vitalSigns} 
          surgery={surgery}
          showTitle={true}
          height={320}
          compact={false}
        />
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

export default VitalSignsSection;