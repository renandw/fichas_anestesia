import React from 'react';

// SaveButton próprio
const SaveButton = ({ section, hasChanges, isSaving, onSave, everSaved }) => {
  if (isSaving) {
    return (
      <button 
        disabled 
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
        disabled 
        className="px-3 py-1 bg-green-500 text-white rounded text-sm"
      >
        ✓ Salvo
      </button>
    );
  }
  
  if (hasChanges) {
    return (
      <button 
        onClick={onSave}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
      >
        💾 Salvar {section}
      </button>
    );
  }
  
  return (
    <button 
      disabled 
      className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm"
    >
      Salvar {section}
    </button>
  );
};

// Função de geração própria do componente
export const generateCompletionText = (completion) => {
  const parts = [];
  
  if (completion.standardEnd === true) {
    parts.push('Ao término da cirurgia, paciente com respiração espontânea, obedecendo comandos, boa mecânica ventilatória e oximetria estável.');
  }
  
  if (completion.destination) {
    const destination = completion.destination === 'uti' ? 'UTI' : 'RPA';
    parts.push(`Encaminhado à ${destination} em boas condições clínicas.`);
  }
  
  // Texto livre para complicações / evolução desfavorável
  if (typeof completion.adverseEvolution === 'string' && completion.adverseEvolution.trim().length > 0) {
    parts.push(completion.adverseEvolution.trim());
  }
  
  return parts.join(' ');
};

const AnesthesiaDescriptionFinal = ({
  data,
  onChange,
  onSave,
  hasChanges,
  isSaving,
  everSaved
}) => {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Fim do Ato Anestésico</h3>
        <SaveButton
          section="Finalização"
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={onSave}
          everSaved={everSaved}
        />
      </div>
      
      <div className="space-y-3 mb-4">
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.standardEnd === true}
            onChange={(e) => onChange('standardEnd', e.target.checked)}
            className="rounded"
            disabled={data.adverseEvolution?.trim().length > 0}
          />
          <span className="text-sm">Finalização padrão (boa mecânica ventilatória, etc.)</span>
        </label>
        
        <div>
          <label className="block text-sm font-medium mb-1">Encaminhado para:</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="destination"
                value="rpa"
                checked={data.destination === 'rpa'}
                onChange={(e) => onChange('destination', e.target.value)}
                className="rounded"
                disabled={data.adverseEvolution?.trim().length > 0}
              />
              <span className="text-sm">RPA</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="destination"
                value="uti"
                checked={data.destination === 'uti'}
                onChange={(e) => onChange('destination', e.target.value)}
                className="rounded"
                disabled={data.adverseEvolution?.trim().length > 0}
              />
              <span className="text-sm">UTI</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="adverseEvolution" className="block text-sm font-medium mb-1">Complicações / evolução desfavorável (opcional)</label>
          <textarea
            id="adverseEvolution"
            rows={4}
            value={data.adverseEvolution || ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange('adverseEvolution', v);
              if (v.trim().length > 0) {
                if (data.standardEnd) onChange('standardEnd', false);
                if (data.destination) onChange('destination', '');
              }
            }}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Descreva eventos, condutas adotadas e desfecho imediato. Ex.: broncoespasmo intraoperatório tratado com salbutamol; hipotensão refratária, necessidade de aminas; sangramento aumentado, transfusão de CH; encaminhado entubado para UTI..."
          />
          <p className="mt-1 text-xs text-gray-500">Se não houver complicações, deixe em branco.</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        {generateCompletionText(data) || 'Configure as opções de finalização...'}
      </div>
    </div>
  );
};

export default AnesthesiaDescriptionFinal;