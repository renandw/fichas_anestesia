import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar,
  User,
  Users,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  ArrowRight,
  Clock,
  Stethoscope
} from 'lucide-react';
import cbhpmCodesData from '../data/cbhpm_codes.json';

const PatientFormFields = ({
  mode = "new_patient", // Novos modes disponíveis
  existingPatient = null,
  initialProcedureData = {},
  initialSurgeryData = {},
  procedureType: procedureTypeProp,
  currentUser,
  onSubmit,
  onPatientSelected = null,
  isLoading = false,
  submitButtonText = "Continuar",
  showTitle = true,
  onAutoSave = null
}) => {
  // Estados
  const [procedureType, setProcedureType] = useState(procedureTypeProp === 'convenio' ? 'convenio' : 'sus');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(existingPatient);

  // Agrupamento de modes por funcionalidade
  const patientModes = ['new_patient', 'existing_patient', 'edit_patient'];
  const procedureModes = ['new_patient_procedure', 'existing_patient_new_procedure', 'edit_procedure'];
  const surgeryModes = [
    'new_patient_procedure_surgery',
    'existing_patient_new_procedure_surgery', 
    'create_surgery',
    'edit_surgery',
    'view_surgery'
  ];
  
  // Esqueleto para futuros modes
  const srpaModes = [
    'new_patient_procedure_srpa',
    'existing_patient_new_procedure_srpa',
    'create_srpa',
    'edit_srpa', 
    'view_srpa'
  ];
  
  const preAnestheticModes = [
    'new_patient_procedure_preanesthetic',
    'existing_patient_new_procedure_preanesthetic',
    'create_preanesthetic',
    'edit_preanesthetic',
    'view_preanesthetic'
  ];

  // Verificações de modes
  const includesPatient = patientModes.includes(mode) || 
                         mode.includes('new_patient') || 
                         mode === 'existing_patient_new_procedure' ||
                         mode.includes('existing_patient_new_procedure');
                         
  const includesProcedure = procedureModes.includes(mode) || 
                           mode.includes('procedure') ||
                           mode === 'edit_surgery' || // Só edit_surgery permite editar procedure
                           mode === 'create_surgery' || // create_surgery mostra procedure readonly
                           srpaModes.includes(mode) ||
                           preAnestheticModes.includes(mode);
                           
  const includesSurgery = surgeryModes.includes(mode);
  const includesSRPA = srpaModes.includes(mode);
  const includesPreAnesthetic = preAnestheticModes.includes(mode);

  // Lógica de permissões de edição
  const canEditProcedure = mode === 'edit_surgery' || 
                          mode === 'edit_procedure' || 
                          mode.includes('new_procedure') ||
                          mode.includes('new_patient_procedure');
                          
  const canEditSurgery = mode !== 'view_surgery';

  // Form setup com defaultValues baseados no mode
  const getDefaultValues = () => {
    const defaults = {
      // Campo de busca
      patientSearch: ''
    };

    // Dados do paciente (se necessário)
    if (includesPatient || existingPatient) {
      defaults.patientName = existingPatient?.patientName || initialProcedureData?.patientName || '';
      defaults.patientBirthDate = existingPatient?.patientBirthDate || initialProcedureData?.patientBirthDate || '';
      defaults.patientSex = existingPatient?.patientSex || initialProcedureData?.patientSex || '';
      defaults.patientCNS = existingPatient?.patientCNS || initialProcedureData?.patientCNS || '';
    }

    // Dados do procedimento (se necessário)
    if (includesProcedure) {
      defaults.procedureType = initialProcedureData?.procedureType || (procedureTypeProp === 'convenio' ? 'convenio' : 'sus');
      defaults.patientWeight = initialProcedureData?.patientWeight || '';
      defaults.hospitalRecord = initialProcedureData?.hospitalRecord || '';
      defaults.proposedSurgery = initialProcedureData?.proposedSurgery || '';
      defaults.hospital = initialProcedureData?.hospital?.name || initialProcedureData?.hospital || '';
      defaults.insuranceNumber = initialProcedureData?.insuranceNumber || '';
      defaults.insuranceName = initialProcedureData?.insuranceName || '';
      defaults.cbhpmProcedures = initialProcedureData?.cbhpmProcedures || [{ codigo: '', procedimento: '', porte_anestesico: '' }];
      defaults.mainSurgeon = initialProcedureData?.mainSurgeon || '';
      defaults.auxiliarySurgeons = initialProcedureData?.auxiliarySurgeons || [{ name: '' }];
    }

    // Dados da cirurgia (se necessário)
    if (includesSurgery) {
      defaults.surgeryDate = initialSurgeryData?.surgeryDate || '';
      defaults.surgeryTime = initialSurgeryData?.surgeryTime || '';
      defaults.patientPosition = initialSurgeryData?.patientPosition || '';
      defaults.surgeryObservations = initialSurgeryData?.observations || '';
    }

    // Esqueleto para SRPA (futuro)
    if (includesSRPA) {
      // defaults.srpaData = initialSRPAData || {};
    }

    // Esqueleto para PreAnesthetic (futuro)
    if (includesPreAnesthetic) {
      // defaults.preAnestheticData = initialPreAnestheticData || {};
    }

    return defaults;
  };

  const { register, handleSubmit, formState: { errors }, watch, setValue, control, reset } = useForm({
    defaultValues: getDefaultValues()
  });

  // UseFieldArray para gerenciar arrays dinâmicos
  const { fields: cbhpmFields, append: appendCbhpm, remove: removeCbhpm } = useFieldArray({
    control,
    name: "cbhpmProcedures"
  });

  const { fields: surgeonFields, append: appendSurgeon, remove: removeSurgeon } = useFieldArray({
    control,
    name: "auxiliarySurgeons"
  });

  // Estados calculados
  const [calculatedAge, setCalculatedAge] = useState('');
  const birthDate = watch('patientBirthDate');
  const watchedProcedureType = watch('procedureType');
  const searchTerm = watch('patientSearch');

  // Sync procedureType
  useEffect(() => {
    if (watchedProcedureType && watchedProcedureType !== procedureType) {
      setProcedureType(watchedProcedureType);
    }
  }, [watchedProcedureType]);

  // Hospitais SUS
  const susHospitals = [
    {
      id: 1,
      name: 'Hospital de Base - Centro Cirúrgico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital de Base - Centro Cirúrgico'
    },
    {
      id: 2,
      name: 'Hospital de Base - UNACON',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'UNACON',
      shortName: 'Hospital de Base - UNACON'
    },
    {
      id: 3,
      name: 'Hospital de Base - Hemodinâmica',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Hemodinâmica',
      shortName: 'Hospital de Base - Hemodinâmica'
    },
    {
      id: 4,
      name: 'Hospital de Base - Centro Obstétrico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Obstétrico',
      shortName: 'Hospital de Base - Centro Obstétrico'
    },
    {
      id: 5,
      name: 'Hospital de Base - Centro Diagnóstico',
      address: 'Av. Gov. Jorge Teixeira, 3766 - Industrial, Porto Velho - RO, 76821-092',
      sector: 'Centro Diagnóstico',
      shortName: 'Hospital de Base - Centro Diagnóstico'
    },
    {
      id: 6,
      name: 'Hospital João Paulo II - Centro Cirúrgico',
      address: 'Av. Campos Sales, 4295 - Nova Floresta, Porto Velho - RO, 76807-005',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital João Paulo II - Centro Cirúrgico'
    },
    {
      id: 7,
      name: 'Hospital de Campanha - Centro Cirúrgico',
      address: 'R. Joaquim Nabuco, 2718 - Olaria, Porto Velho - RO, 76804-074',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital de Campanha - Centro Cirúrgico'
    },
    {
      id: 8,
      name: 'Hospital Regional - Centro Cirúrgico',
      address: 'Av. Rosilene Xavier Transpadini, 2200 - Jardim Eldorado, Cacoal - RO, 76963-767',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Regional Cacoal'
    },
    {
      id: 9,
      name: 'Hospital HEURO - Centro Cirúrgico',
      address: 'Av. Malaquita, 3581 - Josino Brito, Cacoal - RO, 76961-887',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital HEURO - Cacoal'
    },
    {
      id: 11,
      name: 'Hospital Regional Extrema - Centro Cirúrgico',
      address: 'R. Abunã, 308 - Santa Bárbara, Porto Velho - RO, 76847-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Extrema'
    },
    {
      id: 12,
      name: 'Hospital Regional São Francisco do Guaporé - Centro Cirúrgico',
      address: 'Av. Brasil, 4375 - Cidade Alta, São Francisco do Guaporé - RO, 76935-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Regional São Francisco do Guaporé'
    },
    {
      id: 13,
      name: 'Hospital Regional Humaitá - Centro Cirúrgico',
      address: 'R. Dom José - São Sebastião, Humaitá - AM, 69800-000',
      sector: 'Centro Cirúrgico',
      shortName: 'Hospital Regional Humaitá'
    }
  ];

  // CBHPM codes
  const cbhpmCodes = cbhpmCodesData.map ? cbhpmCodesData.map(item => ({
    codigo: item.codigo,
    procedimento: item.procedimento,
    porte_anestesico: item.porte_anestesico || 'N/A'
  })) : [];

  // Calcular idade
  useEffect(() => {
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      
      if (birth > now) {
        setCalculatedAge('Data inválida');
        return;
      }

      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();

      if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      let ageText = '';
      if (years > 0) {
        ageText += `${years} ano${years !== 1 ? 's' : ''}`;
        if (months > 0) ageText += `, ${months} mês${months !== 1 ? 'es' : ''}`;
        if (days > 0 && years === 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
      } else if (months > 0) {
        ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
        if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
      } else {
        ageText = `${days} dia${days !== 1 ? 's' : ''}`;
      }

      setCalculatedAge(ageText);
    } else {
      setCalculatedAge('');
    }
  }, [birthDate]);

  // Busca de pacientes (simulada - implementar com sua API)
  useEffect(() => {
    if (mode === 'existing_patient' && searchTerm && searchTerm.length >= 3) {
      setIsSearching(true);
      // Simular busca - substituir por sua implementação
      setTimeout(() => {
        // Mock de resultados
        const mockResults = [
          { id: '1', patientName: 'João Silva Santos', patientCNS: '123 4567 8901 2345', patientBirthDate: '1985-05-15' },
          { id: '2', patientName: 'Maria João Oliveira', patientCNS: '987 6543 2109 8765', patientBirthDate: '1990-08-20' }
        ].filter(p => 
          p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.patientCNS.includes(searchTerm)
        );
        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, mode]);

  // Reset form apenas quando props importantes mudam (não a cada render)
  useEffect(() => {
    if (mode !== 'existing_patient' && (existingPatient || Object.keys(initialProcedureData).length > 0)) {
      reset(getDefaultValues());
    }
  }, [mode, existingPatient?.id, initialProcedureData?.id]);

  // Funções auxiliares
  const addCbhpmProcedure = () => {
    appendCbhpm({ codigo: '', procedimento: '', porte_anestesico: '' });
  };

  const addAuxiliarySurgeon = () => {
    appendSurgeon({ name: '' });
  };

  const handleCbhpmChange = (index, value) => {
    const selectedProcedure = cbhpmCodes.find(item => 
      value.startsWith(item.codigo) || value.includes(item.procedimento)
    );
    
    if (selectedProcedure) {
      setValue(`cbhpmProcedures.${index}.codigo`, selectedProcedure.codigo);
      setValue(`cbhpmProcedures.${index}.procedimento`, selectedProcedure.procedimento);
      setValue(`cbhpmProcedures.${index}.porte_anestesico`, selectedProcedure.porte_anestesico);
      
      if ((mode === 'edit_procedure' || mode === 'edit_surgery') && onAutoSave) {
        setTimeout(() => {
          const currentData = watch();
          onAutoSave(currentData);
        }, 100);
      }
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    if (onPatientSelected) {
      onPatientSelected(patient);
    }
  };

  // Verificar permissões de edição
  const canEdit = !initialProcedureData.id || 
    (initialProcedureData.createdBy === currentUser?.uid || 
     initialProcedureData.sharedWith?.includes(currentUser?.uid));

  // Submit estruturado com validações hierárquicas
  const handleStructuredSubmit = (data) => {
    const baseMetadata = {
      createdBy: currentUser?.uid,
      ...(mode.includes('edit') && { lastUpdatedBy: currentUser?.uid })
    };

    // Processar dados do procedimento com base no tipo
    const getProcedureData = () => {
      if (!includesProcedure) return null;

      let procedureData = {
        procedureType: data.procedureType,
        patientWeight: data.patientWeight,
        mainSurgeon: data.mainSurgeon,
        auxiliarySurgeons: data.auxiliarySurgeons
      };

      if (data.procedureType === 'sus') {
        let hospitalName = data.hospital;
        if (typeof data.hospital === 'string' && data.hospital.startsWith('{')) {
          try {
            const hospitalObj = JSON.parse(data.hospital);
            hospitalName = hospitalObj.shortName || hospitalObj.name;
          } catch (e) {
            hospitalName = data.hospital;
          }
        }

        procedureData = {
          ...procedureData,
          hospital: hospitalName,
          hospitalRecord: data.hospitalRecord,
          procedimento: data.proposedSurgery
        };
      } else if (data.procedureType === 'convenio') {
        const cbhpmProcedures = data.cbhpmProcedures || [];
        const mainProcedure = cbhpmProcedures.find(proc => proc.procedimento && proc.procedimento.trim() !== '') || cbhpmProcedures[0];
        
        procedureData = {
          ...procedureData,
          hospital: data.hospital,
          insuranceNumber: data.insuranceNumber,
          insuranceName: data.insuranceName,
          cbhpmProcedures: data.cbhpmProcedures,
          procedimento: mainProcedure?.procedimento || 'Procedimento não informado'
        };
      }

      return procedureData;
    };

    // Processar dados da cirurgia
    const getSurgeryData = () => {
      if (!includesSurgery) return null;

      return {
        surgeryDate: data.surgeryDate,
        surgeryTime: data.surgeryTime,
        patientPosition: data.patientPosition,
        observations: data.surgeryObservations
      };
    };

    // Processar dados do paciente
    const getPatientData = () => {
      if (!includesPatient && !data.patientName) return null;

      return {
        patientName: data.patientName,
        patientBirthDate: data.patientBirthDate,
        patientSex: data.patientSex,
        patientCNS: data.patientCNS
      };
    };

    // Estruturar submit baseado no mode
    switch (mode) {
      case 'new_patient':
        onSubmit({
          action: 'create_patient',
          patientData: getPatientData(),
          metadata: baseMetadata
        });
        break;

      case 'new_patient_procedure':
        onSubmit({
          action: 'create_patient_and_procedure',
          patientData: getPatientData(),
          procedureData: getProcedureData(),
          metadata: baseMetadata
        });
        break;

      case 'new_patient_procedure_surgery':
        onSubmit({
          action: 'create_patient_procedure_and_surgery',
          patientData: getPatientData(),
          procedureData: getProcedureData(),
          surgeryData: getSurgeryData(),
          metadata: baseMetadata
        });
        break;

      case 'existing_patient_new_procedure':
        onSubmit({
          action: 'create_procedure_only',
          patientId: selectedPatient?.id || existingPatient?.id,
          procedureData: getProcedureData(),
          metadata: baseMetadata
        });
        break;

      case 'existing_patient_new_procedure_surgery':
        onSubmit({
          action: 'create_procedure_and_surgery',
          patientId: selectedPatient?.id || existingPatient?.id,
          procedureData: getProcedureData(),
          surgeryData: getSurgeryData(),
          metadata: baseMetadata
        });
        break;

      case 'create_surgery':
        onSubmit({
          action: 'create_surgery_only',
          patientId: existingPatient?.id,
          procedureId: initialProcedureData?.id,
          surgeryData: getSurgeryData(),
          metadata: baseMetadata
        });
        break;

      case 'edit_procedure':
        onSubmit({
          action: 'update_procedure',
          patientId: existingPatient?.id,
          procedureId: initialProcedureData?.id,
          procedureData: getProcedureData(),
          metadata: baseMetadata
        });
        break;

      case 'edit_surgery':
        onSubmit({
          action: 'update_surgery',
          patientId: existingPatient?.id,
          procedureId: initialProcedureData?.id,
          surgeryId: initialSurgeryData?.id,
          procedureData: getProcedureData(),
          surgeryData: getSurgeryData(),
          metadata: baseMetadata
        });
        break;

      case 'edit_patient':
        onSubmit({
          action: 'update_patient',
          patientId: existingPatient?.id,
          patientData: getPatientData(),
          metadata: baseMetadata
        });
        break;

      // Esqueletos para futuros modes
      case 'create_srpa':
      case 'edit_srpa':
      case 'create_preanesthetic':
      case 'edit_preanesthetic':
        // TODO: Implementar quando necessário
        console.log(`Mode ${mode} será implementado futuramente`);
        break;

      default:
        console.warn(`Mode ${mode} não reconhecido`);
    }
  };

  // Renderização condicional do título
  const getTitle = () => {
    switch (mode) {
      case 'new_patient':
        return 'Cadastro de Paciente';
      case 'new_patient_procedure':
        return 'Cadastro de Paciente e Procedimento';
      case 'new_patient_procedure_surgery':
        return 'Cadastro de Paciente, Procedimento e Cirurgia';
      case 'existing_patient':
        return 'Buscar Paciente Existente';
      case 'existing_patient_new_procedure':
        return 'Novo Procedimento';
      case 'existing_patient_new_procedure_surgery':
        return 'Novo Procedimento e Cirurgia';
      case 'create_surgery':
        return 'Nova Cirurgia';
      case 'edit_procedure':
        return 'Editar Procedimento';
      case 'edit_surgery':
        return 'Editar Cirurgia';
      case 'edit_patient':
        return 'Editar Paciente';
      case 'view_surgery':
        return 'Visualizar Cirurgia';
      default:
        return 'Formulário';
    }
  };

  return (
    <form onSubmit={handleSubmit(handleStructuredSubmit)} className="space-y-6">
      {/* Título opcional */}
      {showTitle && (
        <div className="flex items-center mb-6">
          <Calendar className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {getTitle()}
            </h2>
            {(mode === 'existing_patient_new_procedure' || mode === 'existing_patient_new_procedure_surgery') && existingPatient && (
              <p className="text-sm text-gray-600 mt-1">
                Paciente: {existingPatient.patientName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Seção de busca de paciente */}
      {mode === 'existing_patient' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Search className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Buscar Paciente</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome ou CNS do Paciente</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome ou CNS do paciente..."
              {...register('patientSearch')}
            />
          </div>

          {isSearching && (
            <div className="flex items-center text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Buscando...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Pacientes encontrados:</h4>
              {searchResults.map((patient) => (
                <div 
                  key={patient.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{patient.patientName}</p>
                      <p className="text-sm text-gray-600">CNS: {patient.patientCNS}</p>
                      <p className="text-sm text-gray-600">Nascimento: {new Date(patient.patientBirthDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchTerm.length >= 3 && !isSearching && searchResults.length === 0 && (
            <p className="text-gray-600">Nenhum paciente encontrado. Você pode criar um novo paciente.</p>
          )}
        </div>
      )}

      {/* Seção: Dados do Paciente */}
      {includesPatient && mode !== 'existing_patient' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Dados do Paciente</h3>
            {(selectedPatient || existingPatient) && mode.includes('existing_patient') && (
              <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
            )}
          </div>

          {/* Dados do paciente readonly para existing_patient modes */}
          {mode.includes('existing_patient') && (selectedPatient || existingPatient) ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <p className="font-medium">{(selectedPatient || existingPatient).patientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexo</label>
                  <p className="font-medium capitalize">{(selectedPatient || existingPatient).patientSex}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                  <p className="font-medium">
                    {new Date((selectedPatient || existingPatient).patientBirthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {(selectedPatient || existingPatient).patientCNS && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNS</label>
                    <p className="font-medium">{(selectedPatient || existingPatient).patientCNS}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Formulário editável para modes de criação/edição */
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo do Paciente *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome completo do paciente"
                    style={{ textTransform: 'capitalize' }}
                    disabled={mode === 'edit_patient' && !canEdit}
                    {...register('patientName', {
                      required: 'Nome é obrigatório',
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                      }
                    })}
                  />
                  {errors.patientName && (
                    <p className="text-red-600 text-sm mt-1">{errors.patientName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexo *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={mode === 'edit_patient' && !canEdit}
                    {...register('patientSex', {
                      required: 'Sexo é obrigatório'
                    })}
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outros">Outros</option>
                  </select>
                  {errors.patientSex && (
                    <p className="text-red-600 text-sm mt-1">{errors.patientSex.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={mode === 'edit_patient' && !canEdit}
                    {...register('patientBirthDate', {
                      required: 'Data de nascimento é obrigatória'
                    })}
                  />
                  {errors.patientBirthDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.patientBirthDate.message}</p>
                  )}
                  {calculatedAge && (
                    <p className="text-sm text-blue-600 mt-1">
                      Idade: {calculatedAge}
                    </p>
                  )}
                </div>
              </div>

              {/* CNS (SUS obrigatório, Convênio opcional) */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNS (Cartão Nacional de Saúde) {procedureType === 'sus' && '*'}
                  </label>
                  <input
                    type="text"
                    maxLength="18"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 4567 8901 2345"
                    disabled={mode === 'edit_patient' && !canEdit}
                    {...register('patientCNS', {
                      required: procedureType === 'sus' ? 'CNS é obrigatório' : false
                    })}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
                      e.target.value = formatted;
                    }}
                  />
                  {errors.patientCNS && (
                    <p className="text-red-600 text-sm mt-1">{errors.patientCNS.message}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Seção: Dados do Procedimento */}
      {includesProcedure && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Indicador visual se readonly */}
          {!canEditProcedure && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800 font-medium">
                  Dados do Procedimento (somente visualização)
                </span>
              </div>
            </div>
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Procedimento</h3>
          
          {/* Peso do paciente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso Atual (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="300"
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="70.5"
              disabled={!canEditProcedure}
              {...register('patientWeight', {
                required: 'Peso é obrigatório',
                min: { value: 0.1, message: 'Peso deve ser maior que 0' },
                max: { value: 300, message: 'Peso deve ser menor que 300kg' }
              })}
            />
            {errors.patientWeight && (
              <p className="text-red-600 text-sm mt-1">{errors.patientWeight.message}</p>
            )}
          </div>

          {/* Tipo de procedimento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo do Procedimento *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!canEditProcedure}
              {...register('procedureType', { required: true })}
              value={procedureType}
              onChange={e => {
                setProcedureType(e.target.value);
                setValue('procedureType', e.target.value);
              }}
            >
              <option value="sus">SUS</option>
              <option value="convenio">Convênio</option>
            </select>
          </div>

          {/* Hospital */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital *</label>
            {procedureType === 'sus' ? (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!canEditProcedure}
                {...register('hospital', {
                  required: 'Hospital é obrigatório'
                })}
              >
                <option value="">Selecione o hospital</option>
                {susHospitals.map((hospital) => (
                  <option key={hospital.id} value={JSON.stringify(hospital)}>
                    {hospital.shortName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Nome do hospital ou clínica"
                disabled={!canEditProcedure}
                {...register('hospital', {
                  required: 'Hospital é obrigatório'
                })}
              />
            )}
            {errors.hospital && (
              <p className="text-red-600 text-sm mt-1">{errors.hospital.message}</p>
            )}
          </div>

          {/* Dados específicos SUS */}
          {procedureType === 'sus' && (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registro do Hospital *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="12345"
                    disabled={!canEditProcedure}
                    {...register('hospitalRecord', {
                      required: 'Registro do hospital é obrigatório'
                    })}
                  />
                  {errors.hospitalRecord && (
                    <p className="text-red-600 text-sm mt-1">{errors.hospitalRecord.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cirurgia Proposta *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows="2"
                  placeholder="Descreva o procedimento inicialmente planejado"
                  disabled={!canEditProcedure}
                  {...register('proposedSurgery', {
                    required: 'Cirurgia proposta é obrigatória'
                  })}
                />
                {errors.proposedSurgery && (
                  <p className="text-red-600 text-sm mt-1">{errors.proposedSurgery.message}</p>
                )}
              </div>
            </>
          )}

          {/* Dados específicos Convênio */}
          {procedureType === 'convenio' && (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula do Convênio *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="123456789"
                    disabled={!canEditProcedure}
                    {...register('insuranceNumber', {
                      required: 'Matrícula do convênio é obrigatória'
                    })}
                  />
                  {errors.insuranceNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.insuranceNumber.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Convênio *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!canEditProcedure}
                    {...register('insuranceName', {
                      required: 'Nome do convênio é obrigatório'
                    })}
                  >
                    <option value="">Selecione o convênio</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Amil">Amil</option>
                    <option value="Sulamerica">SulAmérica</option>
                    <option value="ASSEFAZ">ASSEFAZ</option>
                    <option value="Astir">Astir</option>
                    <option value="Capesesp">Capesesp</option>
                    <option value="Cassi">Cassi</option>
                    <option value="Funsa">Funsa</option>
                    <option value="Fusex">Fusex</option>
                    <option value="Geap">Geap</option>
                    <option value="Ipam">Ipam</option>
                    <option value="Life">Life</option>
                    <option value="Saude Caixa">Saúde Caixa</option>
                    <option value="Innova">Innova</option>
                    <option value="Particular">Particular</option>
                    <option value="outros">Outros</option>
                  </select>
                  {errors.insuranceName && (
                    <p className="text-red-600 text-sm mt-1">{errors.insuranceName.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Procedimentos CBHPM</h4>
                  {canEditProcedure && (
                    <button
                      type="button"
                      onClick={addCbhpmProcedure}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Procedimento
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {cbhpmFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código e Procedimento {index === 0 ? '*' : ''}
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Digite código ou nome do procedimento..."
                            list={`cbhpm-options-${index}`}
                            disabled={!canEditProcedure}
                            {...register(`cbhpmProcedures.${index}.codigo`, {
                              required: index === 0 ? 'Pelo menos um procedimento é obrigatório' : false,
                              onBlur: (e) => handleCbhpmChange(index, e.target.value)
                            })}
                          />
                          <datalist id={`cbhpm-options-${index}`}>
                            {cbhpmCodes.map((item) => (
                              <option key={item.codigo} value={`${item.codigo} - ${item.procedimento}`} />
                            ))}
                          </datalist>
                          {errors.cbhpmProcedures?.[index]?.codigo && (
                            <p className="text-red-600 text-sm mt-1">{errors.cbhpmProcedures[index].codigo.message}</p>
                          )}
                          {watch(`cbhpmProcedures.${index}.procedimento`) && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800">
                                    ✓ {watch(`cbhpmProcedures.${index}.codigo`)} - {watch(`cbhpmProcedures.${index}.procedimento`)}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    Porte Anestésico: {watch(`cbhpmProcedures.${index}.porte_anestesico`)}
                                  </p>
                                </div>
                                {mode.includes('edit') && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Salvo automaticamente
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <input
                            type="hidden"
                            {...register(`cbhpmProcedures.${index}.procedimento`)}
                          />
                          <input
                            type="hidden"
                            {...register(`cbhpmProcedures.${index}.porte_anestesico`)}
                          />
                        </div>
                        {index > 0 && canEditProcedure && (
                          <button
                            type="button"
                            onClick={() => removeCbhpm(index)}
                            className="mt-7 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Equipe cirúrgica */}
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Equipe Cirúrgica</h3>
            </div>

            {/* Cirurgião Principal */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cirurgião Principal *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Dr. João Silva"
                style={{ textTransform: 'capitalize' }}
                disabled={!canEditProcedure}
                {...register('mainSurgeon', {
                  required: 'Cirurgião principal é obrigatório',
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                  }
                })}
              />
              {errors.mainSurgeon && (
                <p className="text-red-600 text-sm mt-1">{errors.mainSurgeon.message}</p>
              )}
            </div>

            {/* Cirurgiões Auxiliares */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Cirurgiões Auxiliares</label>
                {canEditProcedure && (
                  <button
                    type="button"
                    onClick={addAuxiliarySurgeon}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Auxiliar
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {surgeonFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Dr. Maria Santos (opcional)"
                        disabled={!canEditProcedure}
                        {...register(`auxiliarySurgeons.${index}.name`)}
                      />
                    </div>
                    {surgeonFields.length > 1 && canEditProcedure && (
                      <button
                        type="button"
                        onClick={() => removeSurgeon(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção: Dados da Cirurgia */}
      {includesSurgery && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Stethoscope className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Dados da Cirurgia</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Cirurgia *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!canEditSurgery}
                  {...register('surgeryDate', {
                    required: 'Data da cirurgia é obrigatória'
                  })}
                />
              </div>
              {errors.surgeryDate && (
                <p className="text-red-600 text-sm mt-1">{errors.surgeryDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Início *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!canEditSurgery}
                  {...register('surgeryTime', {
                    required: 'Hora de início é obrigatória'
                  })}
                />
              </div>
              {errors.surgeryTime && (
                <p className="text-red-600 text-sm mt-1">{errors.surgeryTime.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Posicionamento do Paciente *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!canEditSurgery}
                {...register('patientPosition', {
                  required: 'Posicionamento é obrigatório'
                })}
              >
                <option value="">Selecione o posicionamento</option>
                <option value="Decúbito Dorsal">Decúbito Dorsal</option>
                <option value="Decúbito Ventral">Decúbito Ventral</option>
                <option value="Decúbito Lateral direito">Decúbito Lateral direito</option>
                <option value="Decúbito Lateral esquerdo">Decúbito Lateral esquerdo</option>
                <option value="Trendelenburg">Trendelenburg</option>
                <option value="Canivete">Canivete</option>
                <option value="Litotomia">Litotomia</option>
                <option value="Cadeira de Praia">Cadeira de Praia</option>
              </select>
            </div>
            {errors.patientPosition && (
              <p className="text-red-600 text-sm mt-1">{errors.patientPosition.message}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações Iniciais</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows="3"
              placeholder="Observações sobre o início da cirurgia (opcional)"
              disabled={!canEditSurgery}
              {...register('surgeryObservations')}
            />
          </div>
        </div>
      )}

      {/* Esqueleto para Seção SRPA (futuro) */}
      {includesSRPA && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dados SRPA</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Seção SRPA será implementada futuramente.</p>
          </div>
        </div>
      )}

      {/* Esqueleto para Seção PreAnesthetic (futuro) */}
      {includesPreAnesthetic && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pré-Anestésico</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Seção Pré-Anestésico será implementada futuramente.</p>
          </div>
        </div>
      )}

      {/* Botão de submit */}
      {mode !== 'existing_patient' && mode !== 'view_surgery' && (
        <div className="flex justify-end pt-6 border-t">
          {mode.includes('edit') && !canEdit ? (
            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              Você não tem permissão para editar este registro
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default PatientFormFields;