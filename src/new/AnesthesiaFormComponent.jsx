import React, { useState } from 'react';
import { Save, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createAnesthesia, updateAnesthesia } from '../services/anesthesiaService';

// Função auxiliar para formatar horário
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const result = `${hours}:${minutes}`;
  console.log('🔧 formatTime input:', date, 'output:', result);
  return result;
};
// Componente Mobile View
const MobileView = ({ 
  anesthesiaData, 
  errors, 
  isSubmitting, 
  handleInputChange, 
  handleSubmit,
  mode = "create",
  surgeryDateLocked = false
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    {/* Header compacto */}
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm leading-tight">
            {mode === "edit" ? "Editar Anestesia" : "Dados da Anestesia"}
          </h3>
          <p className="text-purple-100 text-xs">
            {mode === "edit" ? "Altere as informações" : "Informações básicas"}
          </p>
        </div>
      </div>
    </div>

    <div className="p-3 space-y-3">
      {/* Data da Cirurgia */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Data da Cirurgia *</label>
        <input
          type="date"
          value={anesthesiaData.surgeryDate}
          onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
          className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.surgeryDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          disabled={isSubmitting || surgeryDateLocked}
        />
        {errors.surgeryDate && (
          <p className="mt-1 text-xs text-red-600">{errors.surgeryDate}</p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Início Anestesia *</label>
          <input
            type="time"
            value={anesthesiaData.anesthesiaTimeStart}
            onChange={(e) => handleInputChange('anesthesiaTimeStart', e.target.value)}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.anesthesiaTimeStart ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.anesthesiaTimeStart && (
            <p className="mt-1 text-xs text-red-600">{errors.anesthesiaTimeStart}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Início Cirurgia *</label>
          <input
            type="time"
            value={anesthesiaData.surgeryTimeStart}
            onChange={(e) => handleInputChange('surgeryTimeStart', e.target.value)}
            className={`w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.surgeryTimeStart ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.surgeryTimeStart && (
            <p className="mt-1 text-xs text-red-600">{errors.surgeryTimeStart}</p>
          )}
        </div>

      </div>

      {/* Fim dos Horários */}
      <div className="grid grid-cols-2 gap-2">
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fim Anestesia</label>
          <input
            type="time"
            value={anesthesiaData.anesthesiaTimeEnd}
            onChange={(e) => handleInputChange('anesthesiaTimeEnd', e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fim Cirurgia</label>
          <input
            type="time"
            value={anesthesiaData.surgeryTimeEnd}
            onChange={(e) => handleInputChange('surgeryTimeEnd', e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isSubmitting}
          />
        </div>

      </div>

      {/* Posições do Paciente */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Posições do Paciente *</label>
        <div className="grid grid-cols-2 gap-1 max-h-30 overflow-y-auto">
          {[
            'Decúbito Dorsal',
            'Decúbito Ventral', 
            'Decúbito Lateral direito',
            'Decúbito Lateral esquerdo',
            'Trendelenburg',
            'Proclive',
            'Canivete',
            'Litotomia',
            'Cadeira de Praia'
          ].map(position => (
            <label key={position} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={anesthesiaData.patientPosition.includes(position)}
                onChange={(e) => {
                  const newPositions = e.target.checked 
                    ? [...anesthesiaData.patientPosition, position]
                    : anesthesiaData.patientPosition.filter(p => p !== position);
                  handleInputChange('patientPosition', newPositions);
                }}
                className="w-3 h-3 text-purple-600 rounded"
                disabled={isSubmitting}
              />
              <span className="leading-tight">{position}</span>
            </label>
          ))}
        </div>
        {errors.patientPosition && (
          <p className="mt-1 text-xs text-red-600">{errors.patientPosition}</p>
        )}
      </div>

      {/* Técnica Anestésica */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Técnica Anestésica *</label>
        <div className="grid grid-cols-2 gap-1 max-h-30 overflow-y-auto">
          {[
            'Geral Balanceada',
            'Geral Venosa Total',
            'Raquianestesia',
            'Peridural',
            'Sedação',
            'Local',
            'Bloqueio nervos periféricos',
            'Combinada'
          ].map(technique => (
            <label key={technique} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={anesthesiaData.anestheticTechnique.includes(technique)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...anesthesiaData.anestheticTechnique, technique]
                    : anesthesiaData.anestheticTechnique.filter(t => t !== technique);
                  handleInputChange('anestheticTechnique', updated);
                }}
                className="w-3 h-3 text-purple-600 rounded"
                disabled={isSubmitting}
              />
              <span className="leading-tight">{technique}</span>
            </label>
          ))}
        </div>
        {errors.anestheticTechnique && (
          <p className="mt-1 text-xs text-red-600">{errors.anestheticTechnique}</p>
        )}
      </div>

      {/* Observações Iniciais */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações Iniciais</label>
        <textarea
          value={anesthesiaData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Observações sobre o início da anestesia..."
          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-16 resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Botão Submit */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {mode === "edit" ? "Salvando..." : "Criando..."}
            </>
          ) : (
            <>
              <Save className="w-3 h-3" />
              {mode === "edit" ? "Salvar Alterações" : "Criar Ficha"}
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// Componente Desktop View
const DesktopView = ({ 
  anesthesiaData, 
  errors, 
  isSubmitting, 
  handleInputChange, 
  handleSubmit,
  mode = "create",
  surgeryDateLocked = false
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {mode === "edit" ? "Editar Anestesia" : "Dados da Anestesia"}
          </h3>
          <p className="text-xs text-gray-600">
            {mode === "edit" ? "Altere as informações da anestesia" : "Preencha as informações básicas da anestesia"}
          </p>
        </div>
      </div>
    </div>

    <div className="p-4 space-y-4">
      {/* Data da Cirurgia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Data da Cirurgia *</label>
        <input
          type="date"
          value={anesthesiaData.surgeryDate}
          onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.surgeryDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          disabled={isSubmitting || surgeryDateLocked}
        />
        {errors.surgeryDate && (
          <p className="mt-1 text-sm text-red-600">{errors.surgeryDate}</p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Início da Anestesia *</label>
          <input
            type="time"
            value={anesthesiaData.anesthesiaTimeStart}
            onChange={(e) => handleInputChange('anesthesiaTimeStart', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.anesthesiaTimeStart ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.anesthesiaTimeStart && (
            <p className="mt-1 text-sm text-red-600">{errors.anesthesiaTimeStart}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Início da Cirurgia *</label>
          <input
            type="time"
            value={anesthesiaData.surgeryTimeStart}
            onChange={(e) => handleInputChange('surgeryTimeStart', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.surgeryTimeStart ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.surgeryTimeStart && (
            <p className="mt-1 text-sm text-red-600">{errors.surgeryTimeStart}</p>
          )}
        </div>
      </div>

      {/* Fim dos Horários */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Fim da Anestesia</label>
          <input
            type="time"
            value={anesthesiaData.anesthesiaTimeEnd}
            onChange={(e) => handleInputChange('anesthesiaTimeEnd', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Fim da Cirurgia</label>
          <input
            type="time"
            value={anesthesiaData.surgeryTimeEnd}
            onChange={(e) => handleInputChange('surgeryTimeEnd', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Posições e Técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Posições do Paciente *</label>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {[
              'Decúbito Dorsal',
              'Decúbito Ventral', 
              'Decúbito Lateral direito',
              'Decúbito Lateral esquerdo',
              'Trendelenburg',
              'Proclive',
              'Canivete',
              'Litotomia',
              'Cadeira de Praia'
            ].map(position => (
              <label key={position} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={anesthesiaData.patientPosition.includes(position)}
                  onChange={(e) => {
                    const newPositions = e.target.checked 
                      ? [...anesthesiaData.patientPosition, position]
                      : anesthesiaData.patientPosition.filter(p => p !== position);
                    handleInputChange('patientPosition', newPositions);
                  }}
                  className="w-4 h-4 text-purple-600 rounded"
                  disabled={isSubmitting}
                />
                <span>{position}</span>
              </label>
            ))}
          </div>
          {errors.patientPosition && (
            <p className="mt-1 text-sm text-red-600">{errors.patientPosition}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Técnica Anestésica *</label>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {[
              'Geral Balanceada',
              'Geral Venosa Total',
              'Raquianestesia',
              'Peridural',
              'Sedação',
              'Local',
              'Bloqueio nervos periféricos',
            ].map(technique => (
              <label key={technique} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={anesthesiaData.anestheticTechnique.includes(technique)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...anesthesiaData.anestheticTechnique, technique]
                      : anesthesiaData.anestheticTechnique.filter(t => t !== technique);
                    handleInputChange('anestheticTechnique', updated);
                  }}
                  className="w-4 h-4 text-purple-600 rounded"
                  disabled={isSubmitting}
                />
                <span>{technique}</span>
              </label>
            ))}
          </div>
          {errors.anestheticTechnique && (
            <p className="mt-1 text-sm text-red-600">{errors.anestheticTechnique}</p>
          )}
        </div>
      </div>

      {/* Observações Iniciais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Observações Iniciais</label>
        <textarea
          value={anesthesiaData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descreva observações sobre o início da anestesia, medicações utilizadas, intercorrências..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Botão Submit */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {mode === "edit" ? "Salvando alterações..." : "Criando ficha anestésica..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {mode === "edit" ? "Salvar Alterações" : "Criar Ficha Anestésica"}
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

/**
 * AnesthesiaFormComponent - Componente de Formulário de Anestesia
 * 
 * Responsabilidades:
 * - Gerenciar lógica de criação/edição de anestesia
 * - Validação de formulário
 * - Integração com Firebase
 * - Interface responsiva (Mobile/Desktop)
 */
const AnesthesiaFormComponent = ({
  mode = "create", // "create" | "edit"
  initialData = null,
  selectedPatient,
  selectedSurgery,
  onAnesthesiaCreated, // Para modo create
  onAnesthesiaUpdated  // Para modo edit
}) => {
  const { currentUserId } = useAuth();

  // Estados do formulário
  const [anesthesiaData, setAnesthesiaData] = useState(
    mode === "edit" && initialData
      ? {
          ...initialData,
          // Garantir que os campos de data/hora sejam Date ou null
          anesthesiaStart: initialData.anesthesiaStart ? new Date(initialData.anesthesiaStart) : null,
          anesthesiaEnd: initialData.anesthesiaEnd ? new Date(initialData.anesthesiaEnd) : null,
          surgeryStart: initialData.surgeryStart ? new Date(initialData.surgeryStart) : null,
          surgeryEnd: initialData.surgeryEnd ? new Date(initialData.surgeryEnd) : null,
        }
      : {
          anesthesiaStart: null,
          anesthesiaEnd: null,
          surgeryStart: null,
          surgeryEnd: null,
          patientPosition: [],
          anestheticTechnique: [],
          description: '',
          status: 'Em andamento'
        }
  );

  // Estados auxiliares para inputs de data/hora
  const todayStr = new Date().toISOString().split('T')[0];
  const [baseDate, setBaseDate] = useState(todayStr); // Data selecionada
  // Inputs controlados para data/hora (derivados do estado principal)
  const [auxInputs, setAuxInputs] = useState({
    surgeryDate: todayStr,
    anesthesiaTimeStart: '',
    anesthesiaTimeEnd: '',
    surgeryTimeStart: '',
    surgeryTimeEnd: '',
  });
  const surgeryDateFixed = selectedSurgery?.surgeryDate || auxInputs.surgeryDate;

  // Estados de controle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Função para criar Date a partir de data (YYYY-MM-DD) e hora (HH:mm)
  function dateTimeFrom(dateStr, timeStr) {
    console.log('🔧 dateTimeFrom input:', { dateStr, timeStr });
    if (!dateStr || !timeStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
    console.log('🔧 dateTimeFrom result:', result);
    return result;
  }

  // Cleanup do timer ao desmontar componente
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Atualizar campos auxiliares a partir do estado principal (usado em modo edit)
  React.useEffect(() => {
    // Só atualizar se há valores
    if (anesthesiaData.surgeryStart instanceof Date && !isNaN(anesthesiaData.surgeryStart)) {
      setAuxInputs((prev) => ({
        ...prev,
        surgeryDate: selectedSurgery?.surgeryDate || anesthesiaData.surgeryStart.toISOString().split('T')[0],
        surgeryTimeStart: formatTime(anesthesiaData.surgeryStart),
      }));
      setBaseDate(selectedSurgery?.surgeryDate || anesthesiaData.surgeryStart.toISOString().split('T')[0]);
    }
    if (anesthesiaData.surgeryEnd instanceof Date && !isNaN(anesthesiaData.surgeryEnd)) {
      setAuxInputs((prev) => ({
        ...prev,
        surgeryTimeEnd: formatTime(anesthesiaData.surgeryEnd),
      }));
    }
    if (anesthesiaData.anesthesiaStart instanceof Date && !isNaN(anesthesiaData.anesthesiaStart)) {
      setAuxInputs((prev) => ({
        ...prev,
        anesthesiaTimeStart: formatTime(anesthesiaData.anesthesiaStart),
      }));
    }
    if (anesthesiaData.anesthesiaEnd instanceof Date && !isNaN(anesthesiaData.anesthesiaEnd)) {
      setAuxInputs((prev) => ({
        ...prev,
        anesthesiaTimeEnd: formatTime(anesthesiaData.anesthesiaEnd),
      }));
    }
    // eslint-disable-next-line
  }, []);

  // Alteração nos campos
  const handleInputChange = (field, value) => {
    // Campos auxiliares de data/hora
    if (
      field === 'surgeryDate' ||
      field === 'anesthesiaTimeStart' ||
      field === 'anesthesiaTimeEnd' ||
      field === 'surgeryTimeStart' ||
      field === 'surgeryTimeEnd'
    ) {
      // Se a data da cirurgia vem da surgery selecionada, não permitir alteração
      if (field === 'surgeryDate' && selectedSurgery?.surgeryDate) {
        // Ignora mudanças manuais quando travado
        return;
      }

      setAuxInputs((prev) => ({ ...prev, [field]: value }));
      if (field === 'surgeryDate') {
        setBaseDate(value);
      }

      // Atualiza campos principais se possível
      let dateStr = field === 'surgeryDate' ? value : baseDate;
      // Força usar a data fixa da cirurgia quando disponível
      if (selectedSurgery?.surgeryDate) dateStr = selectedSurgery.surgeryDate;
      if (!dateStr) dateStr = todayStr;
      if (field === 'anesthesiaTimeStart') {
        const anesthesiaStartDate = dateTimeFrom(dateStr, value);
        console.log('🔧 Anestesia start date:', anesthesiaStartDate);

        // Limpar timer anterior se existir
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Atualizar estado imediatamente (para mostrar o valor no input)
        setAnesthesiaData((prev) => ({
          ...prev,
          anesthesiaStart: anesthesiaStartDate,
        }));

        // Configurar debounce para calcular sugestão após 500ms
        const newTimer = setTimeout(() => {
          console.log('🔧 Debounce executado para:', value);
          
          setAnesthesiaData((prev) => {
            const shouldSuggest = !prev.surgeryStart || isNaN(prev.surgeryStart);
            console.log('🔧 Should suggest:', shouldSuggest);
            let surgeryStart = prev.surgeryStart;

            if (shouldSuggest && anesthesiaStartDate) {
              console.log('🔧 Calculando sugestão...');
              const sug = new Date(anesthesiaStartDate);
              console.log('🔧 Antes de adicionar 10min:', sug);
              sug.setMinutes(sug.getMinutes() + 10);
              console.log('🔧 Depois de adicionar 10min:', sug);
              
              // Detectar mudança de dia
              const changedDay = sug.toDateString() !== anesthesiaStartDate.toDateString();
              console.log('🔧 Mudou de dia?', changedDay);
              console.log('🔧 Data anestesia:', anesthesiaStartDate.toDateString());
              console.log('🔧 Data cirurgia:', sug.toDateString());
              
              surgeryStart = sug;

              // Ajustar automaticamente + avisar
              const newSurgeryDate = sug.toISOString().split('T')[0];
              console.log('🔧 Nova data cirurgia:', newSurgeryDate);
              
              const formattedTime = formatTime(sug);
              console.log('🔧 Horário formatado:', formattedTime);
              
              setAuxInputs((auxPrev) => ({
                ...auxPrev,
                surgeryDate: changedDay ? newSurgeryDate : auxPrev.surgeryDate,
                surgeryTimeStart: formattedTime,
              }));
              
              // Avisar se mudou de dia
              if (changedDay) {
                setBaseDate(newSurgeryDate);
                setErrors(prev => ({
                  ...prev,
                  surgeryTimeStart: "ℹ️ Cirurgia ajustada para o dia seguinte"
                }));
              }
            }

            return {
              ...prev,
              anesthesiaStart: anesthesiaStartDate,
              surgeryStart,
            };
          });
        }, 500);

        setDebounceTimer(newTimer);
        return;
      } else if (field === 'anesthesiaTimeEnd') {
        setAnesthesiaData((prev) => ({
          ...prev,
          anesthesiaEnd: dateTimeFrom(dateStr, value),
        }));
      } else if (field === 'surgeryTimeStart') {
        const valueToSet = value ? dateTimeFrom(dateStr, value) : null;
        setAnesthesiaData((prev) => ({
          ...prev,
          surgeryStart: valueToSet,
        }));
      } else if (field === 'surgeryTimeEnd') {
        setAnesthesiaData((prev) => ({
          ...prev,
          surgeryEnd: dateTimeFrom(dateStr, value),
        }));
      } else if (field === 'surgeryDate') {
        if (selectedSurgery?.surgeryDate) {
          // Data está travada pela cirurgia selecionada; não recalcular
        } else {
          // Atualiza datas base para os demais campos
          setAnesthesiaData((prev) => ({
            ...prev,
            surgeryStart: auxInputs.surgeryTimeStart ? dateTimeFrom(value, auxInputs.surgeryTimeStart) : prev.surgeryStart,
            surgeryEnd: auxInputs.surgeryTimeEnd ? dateTimeFrom(value, auxInputs.surgeryTimeEnd) : prev.surgeryEnd,
            anesthesiaStart: auxInputs.anesthesiaTimeStart ? dateTimeFrom(value, auxInputs.anesthesiaTimeStart) : prev.anesthesiaStart,
            anesthesiaEnd: auxInputs.anesthesiaTimeEnd ? dateTimeFrom(value, auxInputs.anesthesiaTimeEnd) : prev.anesthesiaEnd,
          }));
        }
      }
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
      return;
    }
    // Outros campos (checkboxes, texto etc)
    setAnesthesiaData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};
    if (!auxInputs.surgeryDate) {
      newErrors.surgeryDate = 'Data da cirurgia é obrigatória';
    }
    if (!auxInputs.surgeryTimeStart) {
      newErrors.surgeryTimeStart = 'Hora de início da cirurgia é obrigatória';
    }
    if (!auxInputs.anesthesiaTimeStart) {
      newErrors.anesthesiaTimeStart = 'Hora de início da anestesia é obrigatória';
    }
    if (!anesthesiaData.patientPosition.length) {
      newErrors.patientPosition = 'Selecione ao menos uma posição';
    }
    if (!anesthesiaData.anestheticTechnique.length) {
      newErrors.anestheticTechnique = 'Técnica anestésica é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;
    // Validação de dependências
    if (mode === "create" && (!selectedPatient || !selectedSurgery)) {
      setErrors({ general: 'Paciente e cirurgia são obrigatórios' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Monta objeto para envio, usando os campos Date corretos
      const anesthesiaPayload = {
        ...anesthesiaData,
        anesthesiaStart: anesthesiaData.anesthesiaStart instanceof Date && !isNaN(anesthesiaData.anesthesiaStart)
          ? anesthesiaData.anesthesiaStart
          : dateTimeFrom(surgeryDateFixed, auxInputs.anesthesiaTimeStart),
        anesthesiaEnd: anesthesiaData.anesthesiaEnd instanceof Date && !isNaN(anesthesiaData.anesthesiaEnd)
          ? anesthesiaData.anesthesiaEnd
          : (auxInputs.anesthesiaTimeEnd ? dateTimeFrom(surgeryDateFixed, auxInputs.anesthesiaTimeEnd) : null),
        surgeryStart: anesthesiaData.surgeryStart instanceof Date && !isNaN(anesthesiaData.surgeryStart)
          ? anesthesiaData.surgeryStart
          : dateTimeFrom(surgeryDateFixed, auxInputs.surgeryTimeStart),
        surgeryEnd: anesthesiaData.surgeryEnd instanceof Date && !isNaN(anesthesiaData.surgeryEnd)
          ? anesthesiaData.surgeryEnd
          : (auxInputs.surgeryTimeEnd ? dateTimeFrom(surgeryDateFixed, auxInputs.surgeryTimeEnd) : null),
      };
      if (mode === "edit") {
        console.log('🔄 Atualizando anestesia...');
        const updatedAnesthesia = await updateAnesthesia(
          selectedPatient.id,
          selectedSurgery.id,
          initialData.id,
          anesthesiaPayload,
          currentUserId
        );
        console.log('✅ Anestesia atualizada:', updatedAnesthesia);
        if (onAnesthesiaUpdated) {
          onAnesthesiaUpdated(updatedAnesthesia);
        }
      } else {
        console.log('🆕 Criando nova anestesia...');
        const newAnesthesia = await createAnesthesia(
          selectedPatient.id,
          selectedSurgery.id,
          anesthesiaPayload,
          currentUserId
        );
        console.log('✅ Anestesia criada:', newAnesthesia);
        if (onAnesthesiaCreated) {
          onAnesthesiaCreated(newAnesthesia);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar anestesia:', error);
      setErrors({ general: `Erro ao ${mode === 'edit' ? 'atualizar' : 'criar'} ficha anestésica. Tente novamente.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validação de props obrigatórias
  if (mode === "create" && (!selectedPatient || !selectedSurgery)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: Paciente e cirurgia são obrigatórios para criar anestesia</p>
      </div>
    );
  }

  if (mode === "edit" && !initialData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800">Erro: Dados da anestesia não fornecidos para edição</p>
      </div>
    );
  }

  // Monta objeto para interface (MobileView/DesktopView) com campos auxiliares para inputs
  const anesthesiaDataForUI = {
    ...anesthesiaData,
    surgeryDate: surgeryDateFixed,
    anesthesiaTimeStart: auxInputs.anesthesiaTimeStart,
    anesthesiaTimeEnd: auxInputs.anesthesiaTimeEnd,
    surgeryTimeStart: auxInputs.surgeryTimeStart,
    surgeryTimeEnd: auxInputs.surgeryTimeEnd,
  };

  return (
    <div className="w-full">
      {/* Erro geral */}
      {errors.general && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}
      {/* Mobile View - visível apenas em telas pequenas */}
      <div className="block md:hidden">
        <MobileView
          anesthesiaData={anesthesiaDataForUI}
          errors={errors}
          isSubmitting={isSubmitting}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          mode={mode}
          surgeryDateLocked={!!selectedSurgery?.surgeryDate}
        />
      </div>
      {/* Desktop View - visível em telas médias e grandes */}
      <div className="hidden md:block">
        <DesktopView
          anesthesiaData={anesthesiaDataForUI}
          errors={errors}
          isSubmitting={isSubmitting}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          mode={mode}
          surgeryDateLocked={!!selectedSurgery?.surgeryDate}
        />
      </div>
    </div>
  );
};

export default AnesthesiaFormComponent;