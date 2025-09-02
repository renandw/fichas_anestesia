import React, { useState, useCallback, useEffect } from 'react';
import AnesthesiaDescriptionMonitoring from './AnesthesiaDescriptionMonitoring';
import AnesthesiaDescriptionAdmission from './AnesthesiaDescriptionAdmission';
import AnesthesiaDescriptionTechnique from './AnesthesiaDescriptionTechnique';
import AnesthesiaDescriptionFinal from './AnesthesiaDescriptionFinal';

// Utilitários básicos (mantidos no orquestrador por serem compartilhados)
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

const isPediatric = (age) => age !== null && age < 12;

const getSuggestedTOT = (age, sex) => {
  if (age === null) return '';
  if (age === 0) return '3.0';
  if (age < 12) return ((age / 4) + 3.5).toFixed(1);
  return sex?.toUpperCase() === 'F' ? '7.0' : '7.5';
};

const AnesthesiaDescription = ({ patient, surgery, anesthesia, onUpdate }) => {
  // ===== ESTADOS CENTRALIZADOS =====
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
  
  const [everSaved, setEverSaved] = useState({
    monitoring: false,
    admission: false,
    technique: false,
    completion: false
  });
  
  const [savingStatus, setSavingStatus] = useState({
    monitoring: false,
    admission: false,
    technique: false,
    completion: false
  });
  
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ===== DADOS DERIVADOS COMPARTILHADOS =====
  const age = calculateAge(patient?.patientBirthDate, surgery?.surgeryDate);
  const isChild = isPediatric(age);
  const suggestedTOT = getSuggestedTOT(age, patient?.patientSex);
  
  // ===== CARREGAMENTO DO FIRESTORE =====
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
      
      setEverSaved({
        monitoring: Object.keys(firestoreData.monitoring).length > 0,
        admission: Object.keys(firestoreData.admission).length > 0,
        technique: Object.keys(firestoreData.technique).length > 0,
        completion: Object.keys(firestoreData.completion).length > 0
      });
    }
    setIsInitialized(true);
  }, [anesthesia?.anesthesiaDescription]);
  
  // ===== LÓGICA DE MUDANÇAS =====
  const hasUnsavedChanges = useCallback((section) => {
    return JSON.stringify(data[section]) !== JSON.stringify(savedData[section]);
  }, [data, savedData]);
  
  const updateSection = useCallback((section, field, value) => {
    setData(prev => {
      const newData = {
        ...prev,
        [section]: { ...prev[section], [field]: value }
      };
      
      // Auto-sugestão para TOT (specific business logic)
      if (section === 'technique' && field === 'geral' && value && !prev.technique.totNumber) {
        newData.technique.totNumber = suggestedTOT;
        newData.technique.fixacao = ((parseFloat(suggestedTOT) || 7) * 3).toFixed(0);
      }
      
      return newData;
    });
  }, [suggestedTOT]);
  
  // ===== LÓGICA DE SALVAMENTO =====
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
  
  // ===== GERAÇÃO DE TEXTO FINAL =====
  const generateFullText = useCallback(() => {
    // Aqui chamaria as funções geradoras de cada componente
    // Por enquanto, placeholder
    return 'Texto completo será gerado pelos componentes individuais...';
  }, [data]);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateFullText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [generateFullText]);
  
  // ===== VERIFICAÇÕES GLOBAIS =====
  const hasAnyUnsavedChanges = ['monitoring', 'admission', 'technique', 'completion']
    .some(section => hasUnsavedChanges(section));
  
  // ===== LOADING STATE =====
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
  
  // ===== RENDER =====
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Aviso global de mudanças não salvas */}
      {hasAnyUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Você tem alterações não salvas. Salve cada seção antes de sair da página.
          </p>
        </div>
      )}
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
          <strong>Debug Orquestrador:</strong> Idade: {age}, Pediátrico: {isChild ? 'Sim' : 'Não'}, TOT sugerido: {suggestedTOT}
        </div>
      )}
      
      {/* ===== COMPONENTES AUTÔNOMOS ===== */}
      <AnesthesiaDescriptionMonitoring
        data={data.monitoring}
        onChange={(field, value) => updateSection('monitoring', field, value)}
        onSave={() => saveSection('monitoring')}
        hasChanges={hasUnsavedChanges('monitoring')}
        isSaving={savingStatus.monitoring}
        everSaved={everSaved.monitoring}
        patient={patient}
        surgery={surgery}
      />
      
      <AnesthesiaDescriptionAdmission
        data={data.admission}
        onChange={(field, value) => updateSection('admission', field, value)}
        onSave={() => saveSection('admission')}
        hasChanges={hasUnsavedChanges('admission')}
        isSaving={savingStatus.admission}
        everSaved={everSaved.admission}
        patient={patient}
        surgery={surgery}
        age={age}
        isChild={isChild}
      />
      
      <AnesthesiaDescriptionTechnique
        data={data.technique}
        onChange={(field, value) => updateSection('technique', field, value)}
        onSave={() => saveSection('technique')}
        hasChanges={hasUnsavedChanges('technique')}
        isSaving={savingStatus.technique}
        everSaved={everSaved.technique}
        patient={patient}
        surgery={surgery}
        age={age}
        isChild={isChild}
        suggestedTOT={suggestedTOT}
      />
      
      <AnesthesiaDescriptionFinal
        data={data.completion}
        onChange={(field, value) => updateSection('completion', field, value)}
        onSave={() => saveSection('completion')}
        hasChanges={hasUnsavedChanges('completion')}
        isSaving={savingStatus.completion}
        everSaved={everSaved.completion}
        patient={patient}
        surgery={surgery}
      />
      
      {/* ===== PREVIEW FINAL ===== */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Descrição Anestésica Final</h3>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? '✓ Copiado!' : '📋 Copiar'}
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-line leading-relaxed border">
          {generateFullText()}
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>
            {isChild ? '👶 Paciente pediátrico' : '👤 Paciente adulto'}
            {age !== null && ` • ${age} anos`}
            {patient?.patientSex && ` • ${patient.patientSex === 'M' ? 'Masculino' : 'Feminino'}`}
          </span>
          <span>{generateFullText().length} caracteres</span>
        </div>
      </div>
    </div>
  );
};

export default AnesthesiaDescription;