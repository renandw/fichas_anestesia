import React, { useState, useCallback, useEffect } from 'react';
import AnesthesiaDescriptionMonitoring, {generateMonitoringText} from './AnesthesiaDescriptionMonitoring';
import AnesthesiaDescriptionAdmission,  {generateAdmissionText} from './AnesthesiaDescriptionAdmission';
import AnesthesiaDescriptionTechnique, {generateTechniqueText} from './AnesthesiaDescriptionTechnique';
import AnesthesiaDescriptionFinal,{generateCompletionText} from './AnesthesiaDescriptionFinal';

// Apenas utilitários compartilhados
const calculateAge = (birthDate, surgeryDate) => {
  if (!birthDate || !surgeryDate) return null;
  const birth = new Date(birthDate);
  const surgery = new Date(surgeryDate);
  let age = surgery.getFullYear() - birth.getFullYear();
  const monthDiff = surgery.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && surgery.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getSuggestedTOT = (age, sex) => {
  if (age === null) return '';
  if (age === 0) return '3.0';
  if (age < 12) return ((age / 4) + 3.5).toFixed(1);
  return sex?.toUpperCase() === 'F' ? '7.0' : '7.5';
};

const isPediatric = (age) => age !== null && age < 12;

const AnesthesiaDescription = ({ patient, surgery, anesthesia, onUpdate }) => {
  // Estados principais
  const [data, setData] = useState({
    monitoring: {},
    admission: {},
    technique: {},
    completion: {}
  });
  
  const [savedData, setSavedData] = useState({
    monitoring: {},
    admission: {},
    technique: {},
    completion: {}
  });
  
  const [savingStatus, setSavingStatus] = useState({
    monitoring: false,
    admission: false,
    technique: false,
    completion: false
  });
  
  const [everSaved, setEverSaved] = useState({
    monitoring: false,
    admission: false,
    technique: false,
    completion: false
  });
  
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Versão salva da descrição final gerada
  const [finalDescriptionSaved, setFinalDescriptionSaved] = useState('');
  const [savingFinal, setSavingFinal] = useState(false);

  // Edição manual da descrição final
  const [manualEditing, setManualEditing] = useState(false);
  const [manualDraft, setManualDraft] = useState('');
  
  // Dados derivados
  const age = calculateAge(patient?.patientBirthDate, surgery?.surgeryDate);
  const isChild = isPediatric(age);
  const suggestedTOT = getSuggestedTOT(age, patient?.patientSex);
  
  // Carregamento do Firestore
  useEffect(() => {
    if (anesthesia?.anesthesiaDescription) {
      console.log('🔄 Carregando dados do Firestore:', anesthesia.anesthesiaDescription);
      const firestoreData = {
        monitoring: anesthesia.anesthesiaDescription.monitoring || {},
        admission: anesthesia.anesthesiaDescription.admission || {},
        technique: anesthesia.anesthesiaDescription.technique || {},
        completion: anesthesia.anesthesiaDescription.completion || {}
      };
      setData(firestoreData);
      setSavedData(firestoreData);
      setFinalDescriptionSaved(anesthesia.anesthesiaDescription.finalDescription || '');
      
      setEverSaved({
        monitoring: Object.keys(firestoreData.monitoring).length > 0,
        admission: Object.keys(firestoreData.admission).length > 0,
        technique: Object.keys(firestoreData.technique).length > 0,
        completion: Object.keys(firestoreData.completion).length > 0
      });
    }
    setIsInitialized(true);
  }, [anesthesia?.anesthesiaDescription]);
  
  // Lógica de mudanças
  const hasUnsavedChanges = useCallback((section) => {
    return JSON.stringify(data[section]) !== JSON.stringify(savedData[section]);
  }, [data, savedData]);
  
  const updateSection = useCallback((section, field, value) => {
    setData(prev => {
      const newData = {
        ...prev,
        [section]: { ...prev[section], [field]: value }
      };
      
      // Auto-sugestão para TOT
      if (section === 'technique' && field === 'geral' && value && !prev.technique.totNumber) {
        newData.technique.totNumber = suggestedTOT;
        newData.technique.fixacao = ((parseFloat(suggestedTOT) || 7) * 3).toFixed(0);
      }
      
      return newData;
    });
  }, [suggestedTOT]);
  
  // Lógica de salvamento
  const saveSection = useCallback(async (section) => {
    if (!hasUnsavedChanges(section) || !onUpdate) return;
    
    setSavingStatus(prev => ({ ...prev, [section]: true }));
    
    try {
      const sectionUpdate = {
        [`anesthesiaDescription.${section}`]: data[section]
      };
      
      console.log(`💾 Salvando seção ${section}:`, sectionUpdate);
      
      await onUpdate(sectionUpdate);
      
      setSavedData(prev => ({
        ...prev,
        [section]: data[section]
      }));
      
      setEverSaved(prev => ({
        ...prev,
        [section]: true
      }));
      
    } catch (error) {
      console.error(`❌ Erro ao salvar ${section}:`, error);
      alert(`Erro ao salvar ${section}. Tente novamente.`);
    } finally {
      setSavingStatus(prev => ({ ...prev, [section]: false }));
    }
  }, [data, hasUnsavedChanges, onUpdate]);
  
  const generateFullText = useCallback(() => {
  const sections = [
    generateMonitoringText(data.monitoring),
    generateAdmissionText(data.admission, isChild),
    generateTechniqueText(data.technique),
    generateCompletionText(data.completion)
  ].filter(Boolean);
  
  return sections.join('\n') || 'Complete e salve as seções...';
}, [data, isChild]);
  

  const finalText = generateFullText();
  const savedVsGeneratedDiff = (finalDescriptionSaved || '') !== finalText;
  const displayText = manualEditing ? manualDraft : ((finalDescriptionSaved || '') || finalText);
  const hasManualDiff = manualEditing && (manualDraft !== (finalDescriptionSaved || ''));
  
  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = manualEditing ? manualDraft : displayText;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [finalText, manualEditing, manualDraft, displayText]);

  const handleSaveFinalDescription = useCallback(async () => {
    if (!onUpdate) return;
    setSavingFinal(true);
    try {
      const valueToSave = manualEditing ? manualDraft : finalText;
      const payload = { 'anesthesiaDescription.finalDescription': valueToSave };
      await onUpdate(payload);
      setFinalDescriptionSaved(valueToSave);
      if (manualEditing) setManualEditing(false);
    } catch (err) {
      console.error('Erro ao salvar descrição final:', err);
      alert('Erro ao salvar a descrição final. Tente novamente.');
    } finally {
      setSavingFinal(false);
    }
  }, [onUpdate, finalText, manualEditing, manualDraft]);

  const startManualEdit = useCallback(() => {
    setManualDraft((finalDescriptionSaved || '') || finalText);
    setManualEditing(true);
  }, [finalDescriptionSaved, finalText]);

  const cancelManualEdit = useCallback(() => {
    setManualEditing(false);
    setManualDraft('');
  }, []);

  const resetDraftToGenerated = useCallback(() => {
    setManualDraft(finalText);
  }, [finalText]);

  const resetDraftToSaved = useCallback(() => {
    setManualDraft(finalDescriptionSaved || '');
  }, [finalDescriptionSaved]);
  
  // Verificações globais
  const hasAnyUnsavedChanges = ['monitoring', 'admission', 'technique', 'completion']
    .some(section => hasUnsavedChanges(section));
  
  // Loading
  if (!isInitialized) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Componentes autônomos */}
      <AnesthesiaDescriptionMonitoring
        data={data.monitoring}
        onChange={(field, value) => updateSection('monitoring', field, value)}
        onSave={() => saveSection('monitoring')}
        hasChanges={hasUnsavedChanges('monitoring')}
        isSaving={savingStatus.monitoring}
        everSaved={everSaved.monitoring}
      />
      
      <AnesthesiaDescriptionAdmission
        data={data.admission}
        onChange={(field, value) => updateSection('admission', field, value)}
        onSave={() => saveSection('admission')}
        hasChanges={hasUnsavedChanges('admission')}
        isSaving={savingStatus.admission}
        everSaved={everSaved.admission}
        isChild={isChild}
      />
      
      <AnesthesiaDescriptionTechnique
        data={data.technique}
        onChange={(field, value) => updateSection('technique', field, value)}
        onSave={() => saveSection('technique')}
        hasChanges={hasUnsavedChanges('technique')}
        isSaving={savingStatus.technique}
        everSaved={everSaved.technique}
        suggestedTOT={suggestedTOT}
        admission={data.admission}
        isChild={isChild}
      />
      
      <AnesthesiaDescriptionFinal
        data={data.completion}
        onChange={(field, value) => updateSection('completion', field, value)}
        onSave={() => saveSection('completion')}
        hasChanges={hasUnsavedChanges('completion')}
        isSaving={savingStatus.completion}
        everSaved={everSaved.completion}
      />

      {/* DESCRIÇÃO FINAL */}
      <div className="bg-white border rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
          <h3 className="font-semibold text-gray-900">Descrição Anestésica Gerada</h3>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
            <span className={`text-xs px-2 py-1 rounded border ${
              manualEditing
                ? (hasManualDiff ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-blue-50 text-blue-800 border-blue-200')
                : (savedVsGeneratedDiff ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-green-50 text-green-800 border-green-200')
            }`}>
              {manualEditing
                ? (hasManualDiff ? 'Editando (alterada)' : 'Editando')
                : (savedVsGeneratedDiff ? 'Diferente do gerado' : 'Sincronizada')}
            </span>

            {!manualEditing ? (
              <>
                <button
                  onClick={startManualEdit}
                  className="px-3 py-2 rounded text-sm font-medium transition-colors border bg-white text-gray-800 hover:bg-gray-50 border-gray-300 w-full sm:w-auto"
                >
                  ✏️ Editar manualmente
                </button>
                {savedVsGeneratedDiff && (
                  <button
                    onClick={handleSaveFinalDescription}
                    disabled={savingFinal}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors border w-full sm:w-auto ${
                      savingFinal
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'
                    }`}
                    title="Atualizar o texto salvo com o texto gerado atual"
                  >
                    ↺ Utilizar Geração Automática
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={cancelManualEdit}
                  className="px-3 py-2 rounded text-sm font-medium transition-colors border bg-white text-gray-800 hover:bg-gray-50 border-gray-300 w-full sm:w-auto"
                >
                  ✖ Cancelar
                </button>
                <button
                  onClick={handleSaveFinalDescription}
                  disabled={!hasManualDiff || savingFinal}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors border w-full sm:w-auto ${
                    (!hasManualDiff || savingFinal)
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {savingFinal ? 'Salvando…' : '💾 Salvar texto editado'}
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors w-full sm:w-auto ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </div>
        </div>
        
        {!manualEditing ? (
          <div className="bg-gray-50 p-3 sm:p-4 rounded text-sm whitespace-pre-line leading-relaxed border select-text">
            {displayText}
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="text-xs text-gray-500">Editando texto final salvo</div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={resetDraftToSaved}
                  className="px-2 py-1 rounded text-xs border bg-white hover:bg-gray-50 w-full sm:w-auto"
                >
                  ↩︎ Repor texto salvo
                </button>
                <button
                  type="button"
                  onClick={resetDraftToGenerated}
                  className="px-2 py-1 rounded text-xs border bg-white hover:bg-gray-50 w-full sm:w-auto"
                >
                  ↺ Usar texto gerado
                </button>
              </div>
            </div>
            <textarea
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              className="w-full border rounded p-3 text-sm font-normal leading-relaxed"
              rows={Math.min(20, Math.max(8, Math.ceil((manualDraft || '').length / 120)))}
              placeholder="Edite aqui a descrição final..."
            />
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500 flex flex-col sm:flex-row gap-1 sm:gap-0 justify-between">
          <span>
            {isChild ? '👶 Paciente pediátrico' : '👤 Paciente adulto'}
            {age !== null && ` • ${age} anos`}
            {patient?.patientSex && ` • ${patient.patientSex === 'M' ? 'Masculino' : 'Feminino'}`}
          </span>
          <span>{(manualEditing ? manualDraft : displayText).length} caracteres</span>
        </div>
      </div>
    </div>
  );
};

export default AnesthesiaDescription;