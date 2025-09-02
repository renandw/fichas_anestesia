import React, { useState } from 'react';
import { X, User, AlertTriangle, Check } from 'lucide-react';

const PatientForm = ({ onPatientSelected }) => {
  // Estados principais
  const [patientData, setPatientData] = useState({
    patientName: '',
    patientBirthDate: '',
    patientSex: '',
    patientCNS: ''
  });

  // Estados de controle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicatesFound, setDuplicatesFound] = useState([]);
  const [duplicateType, setDuplicateType] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [fieldsToUpdate, setFieldsToUpdate] = useState({});
  const [errors, setErrors] = useState({});

  // Simulação de busca no Firebase (substituir pela lógica real)
  const checkForDuplicates = async (data) => {
    // Simula delay de busca
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simula diferentes cenários de duplicata
    const mockPatients = [
      {
        id: '1',
        patientName: 'João Silva Santos',
        patientBirthDate: '1985-03-15',
        patientSex: 'M',
        patientCNS: '123456789012345'
      },
      {
        id: '2', 
        patientName: 'Maria Oliveira',
        patientBirthDate: '1990-07-22',
        patientSex: 'F',
        patientCNS: '987654321098765'
      }
    ];

    // Verificação CNS exato
    const cnsMatch = mockPatients.find(p => p.patientCNS === data.patientCNS);
    if (cnsMatch) {
      return { type: 'cns_match', patients: [cnsMatch] };
    }

    // Verificação nome + data (simulando fuzzy match)
    const nameDate = data.patientName.toLowerCase().includes('joão') && data.patientBirthDate === '1985-03-15';
    if (nameDate) {
      return { type: 'name_date_match', patients: [mockPatients[0]] };
    }

    return { type: 'none', patients: [] };
  };

  // Validação dos campos
  const validateForm = () => {
    const newErrors = {};
    
    if (!patientData.patientName.trim()) {
      newErrors.patientName = 'Nome é obrigatório';
    }
    
    if (!patientData.patientBirthDate) {
      newErrors.patientBirthDate = 'Data de nascimento é obrigatória';
    }
    
    if (!patientData.patientSex) {
      newErrors.patientSex = 'Sexo é obrigatório';
    }
    
    if (!patientData.patientCNS.trim()) {
      newErrors.patientCNS = 'CNS é obrigatório';
    } else if (patientData.patientCNS.length !== 15) {
      newErrors.patientCNS = 'CNS deve ter 15 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const duplicateResult = await checkForDuplicates(patientData);
      
      if (duplicateResult.type !== 'none') {
        setDuplicatesFound(duplicateResult.patients);
        setDuplicateType(duplicateResult.type);
        setShowDuplicateModal(true);
      } else {
        // Nenhuma duplicata encontrada - criar paciente
        await createNewPatient();
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Criar novo paciente
  const createNewPatient = async () => {
    // Simula criação no Firebase
    const newPatient = {
      id: `patient_${Date.now()}`,
      ...patientData,
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: 'current_user_id'
      }
    };
    
    console.log('Criando paciente:', newPatient);
    onPatientSelected(newPatient);
  };

  // Usar paciente existente
  const handleUseExisting = (patient) => {
    setShowDuplicateModal(false);
    onPatientSelected(patient);
  };

  // Preparar atualização
  const handlePrepareUpdate = (patient) => {
    setCurrentPatient(patient);
    setShowDuplicateModal(false);
    setShowUpdateModal(true);
    
    // Identificar campos diferentes
    const updates = {};
    Object.keys(patientData).forEach(key => {
      if (patientData[key] !== patient[key]) {
        updates[key] = true;
      }
    });
    setFieldsToUpdate(updates);
  };

  // Confirmar atualização
  const handleConfirmUpdate = async () => {
    const updatedPatient = {
      ...currentPatient,
      ...Object.keys(fieldsToUpdate).reduce((acc, key) => {
        if (fieldsToUpdate[key]) {
          acc[key] = patientData[key];
        }
        return acc;
      }, {}),
      metadata: {
        ...currentPatient.metadata,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current_user_id'
      }
    };
    
    console.log('Atualizando paciente:', updatedPatient);
    setShowUpdateModal(false);
    onPatientSelected(updatedPatient);
  };

  // Alteração nos campos
  const handleInputChange = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dados do Paciente</h3>
          <p className="text-sm text-gray-600">Preencha as informações do paciente</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Nome do Paciente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            value={patientData.patientName}
            onChange={(e) => handleInputChange('patientName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Digite o nome completo do paciente"
            disabled={isSubmitting}
          />
          {errors.patientName && (
            <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
          )}
        </div>

        {/* Data de Nascimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Nascimento *
          </label>
          <input
            type="date"
            value={patientData.patientBirthDate}
            onChange={(e) => handleInputChange('patientBirthDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientBirthDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.patientBirthDate && (
            <p className="mt-1 text-sm text-red-600">{errors.patientBirthDate}</p>
          )}
        </div>

        {/* Sexo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sexo *
          </label>
          <select
            value={patientData.patientSex}
            onChange={(e) => handleInputChange('patientSex', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientSex ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Selecione o sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          {errors.patientSex && (
            <p className="mt-1 text-sm text-red-600">{errors.patientSex}</p>
          )}
        </div>

        {/* CNS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cartão Nacional de Saúde (CNS) *
          </label>
          <input
            type="text"
            value={patientData.patientCNS}
            onChange={(e) => handleInputChange('patientCNS', e.target.value.replace(/\D/g, '').slice(0, 15))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.patientCNS ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Digite os 15 dígitos do CNS"
            disabled={isSubmitting}
          />
          {errors.patientCNS && (
            <p className="mt-1 text-sm text-red-600">{errors.patientCNS}</p>
          )}
        </div>

        {/* Botão Submit */}
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verificando paciente...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </div>

      {/* Modal de Duplicata */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">
                {duplicateType === 'cns_match' ? 'Paciente já cadastrado' : 'Paciente similar encontrado'}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              {duplicateType === 'cns_match' 
                ? 'Encontramos um paciente com o mesmo CNS:'
                : 'Encontramos um paciente com nome e data de nascimento similares:'
              }
            </p>

            {duplicatesFound.map(patient => (
              <div key={patient.id} className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium">{patient.patientName}</p>
                <p className="text-sm text-gray-600">
                  Nascimento: {new Date(patient.patientBirthDate).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">CNS: {patient.patientCNS}</p>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => handleUseExisting(duplicatesFound[0])}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Usar Paciente
              </button>
              <button
                onClick={() => handlePrepareUpdate(duplicatesFound[0])}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700"
              >
                Atualizar Dados
              </button>
              {duplicateType !== 'cns_match' && (
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    createNewPatient();
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  Criar Novo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualização */}
      {showUpdateModal && currentPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Atualizar Dados do Paciente</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Selecione quais dados devem ser atualizados:
            </p>

            <div className="space-y-3">
              {Object.keys(patientData).map(key => {
                const labels = {
                  patientName: 'Nome',
                  patientBirthDate: 'Data de Nascimento',
                  patientSex: 'Sexo',
                  patientCNS: 'CNS'
                };
                
                const currentValue = currentPatient[key];
                const newValue = patientData[key];
                
                if (currentValue === newValue) return null;
                
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={fieldsToUpdate[key] || false}
                      onChange={(e) => setFieldsToUpdate(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{labels[key]}</p>
                      <div className="text-xs text-gray-600">
                        <span className="line-through">{currentValue}</span>
                        <span className="ml-2 text-green-600">→ {newValue}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar Atualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientForm;