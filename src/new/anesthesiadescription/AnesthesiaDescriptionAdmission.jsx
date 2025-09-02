import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const VENT_MAP = {
  espontanea: 'ventilação espontânea',
  vm_invasiva: 'ventilação mecânica invasiva',
  vm_nao_invasiva: 'ventilação mecânica não invasiva',
};

const OXYGEN_MAP = {
  ar_ambiente: 'ar ambiente',
  cateter_2l: 'O₂ por cateter nasal 2 L/min',
  mascara_5l: 'O₂ por máscara facial 5 L/min',
  fio2: 'FiO₂ 100%',
};

const HEMO_MAP = {
  estavel: 'hemodinamicamente estável',
  instavel: 'hemodinamicamente instável',
};

const AIRWAY_MAP = {
  pervia_sem_obstrucao: 'via aérea pérvia, sem sinais de obstrução',
  pervia_risco_obstrucao: 'via aérea pérvia com risco de obstrução',
  protegida_artificialmente_iot: 'paciente protegida artificialmente (em IOT)',
  protegida_artificialmente_traqueostomia: 'paciente protegida artificialmente (traqueostomia)',
  necessidade_imediata_intervencao: 'necessidade imediata de intervenção',
};

const CONSC_MAP = {
  lucido_orientado: 'lúcido e orientado',
  agitado: 'agitado',
  confuso_desorientado: 'confuso e desorientado',
  sedado: 'sedado',
};

// Opções de Consciência (Adulto) e Reatividade (Pediátrico)
const CONSC_OPTIONS_ADULT = [
  { value: 'lucido_orientado', label: 'lúcido e orientado', text: 'lúcido e orientado' },
  { value: 'agitado', label: 'agitado', text: 'agitado' },
  { value: 'confuso_desorientado', label: 'confuso e desorientado', text: 'confuso e desorientado' },
  { value: 'sedado', label: 'sedado', text: 'sedado' },
  { value: 'torporoso', label: 'torporoso', text: 'torporoso' },
];

const REACTIVITY_OPTIONS_CHILD = [
  { value: 'vigilia_tranquila', label: 'vigília tranquila', text: 'em vigília tranquila' },
  { value: 'vigilia_ativa', label: 'vigília ativa/irritável', text: 'em vigília ativa/irritável' },
  { value: 'chora_ao_estimulo', label: 'chora ao estímulo', text: 'chora ao estímulo' },
  { value: 'hiporresponsivo', label: 'hiporresponsivo', text: 'hiporresponsivo' },
  { value: 'letargico', label: 'letárgico', text: 'letárgico' },
  { value: 'sedado', label: 'sedado', text: 'sedado' },
];

// Presets de condições comuns
const PRESETS = [
  {
    id: 'paciente_estavel',
    nome: 'Paciente estável',
    escopo: 'both',
    campos: {
      airway: 'pervia_sem_obstrucao',
      hemodynamic: 'estavel',
      ventilatory: 'espontanea',
      oxygen: 'ar_ambiente',
      consciousness: {
        adult: 'lucido_orientado',
        child: 'vigilia_tranquila',
      },
    },
  },
];

// SaveButton próprio
const SaveButton = ({ section, hasChanges, isSaving, onSave, everSaved }) => {
  if (isSaving) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        aria-disabled="true"
        className="px-3 py-1 bg-gray-400 text-white rounded text-sm flex items-center gap-1"
      >
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        Salvando...
      </button>
    );
  }
  
  if (!hasChanges && everSaved) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="px-3 py-1 bg-green-500 text-white rounded text-sm"
      >
        ✓ Salvo
      </button>
    );
  }
  
  if (hasChanges) {
    return (
      <button
        type="button"
        onClick={onSave}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
      >
        💾 Salvar {section}
      </button>
    );
  }
  
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
    >
      Salvar {section}
    </button>
  );
};

// Função de geração própria do componente
export const generateAdmissionText = (admission, isChild) => {
  const parts = [];
  
  if (admission.airway) parts.push(AIRWAY_MAP[admission.airway] || '');
  // consciência/reatividade conforme faixa etária
  const options = isChild ? REACTIVITY_OPTIONS_CHILD : CONSC_OPTIONS_ADULT;
  const mapConsc = Object.fromEntries(options.map(o => [o.value, o.text]));
  if (admission.consciousness) parts.push(mapConsc[admission.consciousness] || '');
  if (admission.ventilatory) parts.push(VENT_MAP[admission.ventilatory] || '');
  if (admission.oxygen) parts.push(OXYGEN_MAP[admission.oxygen] || '');
  if (admission.hemodynamic) parts.push(HEMO_MAP[admission.hemodynamic] || '');
  
  if (parts.length === 0) return '';
  
  const base = isChild ? 'Paciente pediátrico admitido em sala cirúrgica' : 'Paciente admitido em sala cirúrgica';
  return `${base}, ${parts.join(', ')}.`;
};

const AnesthesiaDescriptionAdmission = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved,
  isChild
}) => {
  const previewText = useMemo(() => generateAdmissionText(data, isChild), [data, isChild]);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Admissão em Sala Operatória</h3>
        <SaveButton
          section="Admissão"
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={onSave}
          everSaved={everSaved}
        />
      </div>
      
      {/* Presets */}
      <div className="mb-4">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              // aplica cada campo do preset
              const campos = preset.campos;
              onChange('airway', campos.airway);
              onChange('hemodynamic', campos.hemodynamic);
              onChange('ventilatory', campos.ventilatory);
              onChange('oxygen', campos.oxygen);
              const conscValue = isChild ? campos.consciousness.child : campos.consciousness.adult;
              onChange('consciousness', conscValue);
            }}
            className="px-3 py-1 mr-2 mb-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-sm"
          >
            {preset.nome}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="airway" className="block text-sm font-medium mb-1">Via Aérea</label>
          <select
            id="airway"
            value={data.airway || ''}
            onChange={(e) => onChange('airway', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            <option value="pervia_sem_obstrucao">via aérea pérvia</option>
            <option value="pervia_risco_obstrucao">via aérea pérvia com risco de obstrução</option>
            <option value="protegida_artificialmente_iot">via aérea definitiva (IOT)</option>
            <option value="protegida_artificialmente_traqueostomia">via aérea definitiva (TQT)</option>
            <option value="necessidade_imediata_intervencao">necessidade imediata de intervenção</option>
          </select>
        </div>

        <div>
          <label htmlFor="consciousness" className="block text-sm font-medium mb-1">{isChild ? 'Reatividade' : 'Consciência'}</label>
          <select
            id="consciousness"
            value={data.consciousness || ''}
            onChange={(e) => onChange('consciousness', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {(isChild ? REACTIVITY_OPTIONS_CHILD : CONSC_OPTIONS_ADULT).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="ventilatory" className="block text-sm font-medium mb-1">Ventilação</label>
          <select
            id="ventilatory"
            value={data.ventilatory || ''}
            onChange={(e) => onChange('ventilatory', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            <option value="espontanea">Espontânea</option>
            <option value="vm_invasiva">VM Invasiva</option>
            <option value="vm_nao_invasiva">VM Não Invasiva</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="oxygen" className="block text-sm font-medium mb-1">Oxigenação</label>
          <select
            id="oxygen"
            value={data.oxygen || ''}
            onChange={(e) => onChange('oxygen', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            <option value="ar_ambiente">Ar ambiente</option>
            <option value="cateter_2l">Cateter O₂ 2L/min</option>
            <option value="mascara_5l">Máscara O₂ 5L/min</option>
            <option value="fio2">FiO₂ 100%</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="hemodynamic" className="block text-sm font-medium mb-1">Hemodinâmica</label>
          <select
            id="hemodynamic"
            value={data.hemodynamic || ''}
            onChange={(e) => onChange('hemodynamic', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            <option value="estavel">Estável</option>
            <option value="instavel">Instável</option>
          </select>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded" role="status" aria-live="polite">
        {previewText || 'Selecione as condições de admissão...'}
      </div>
    </div>
  );
};

SaveButton.propTypes = {
  section: PropTypes.string.isRequired,
  hasChanges: PropTypes.bool,
  isSaving: PropTypes.bool,
  onSave: PropTypes.func,
  everSaved: PropTypes.bool,
};

AnesthesiaDescriptionAdmission.propTypes = {
  data: PropTypes.shape({
    airway: PropTypes.string,
    consciousness: PropTypes.string,
    ventilatory: PropTypes.string,
    oxygen: PropTypes.string,
    hemodynamic: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  hasChanges: PropTypes.bool,
  isSaving: PropTypes.bool,
  everSaved: PropTypes.bool,
  isChild: PropTypes.bool,
};

export default AnesthesiaDescriptionAdmission;