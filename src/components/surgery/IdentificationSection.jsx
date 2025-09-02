import React, { useState } from 'react';
import PatientFormFields from './PatientFormFields';
import { 
  Calendar,
  User,
  Users,
  Save,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

const IdentificationSection = ({ surgery, patient, procedure, onDataChange, autoSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDataChange = (data) => {
    if (onDataChange) {
      onDataChange(data);
    }
  };
  
  const handleAutoSave = async (data) => {
    try {
      await autoSave(data);
    } catch (error) {
      console.error('Erro no AutoSave:', error);
    }
  };

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      await autoSave(data);
      
      // Callback para atualizar dados no componente pai
      if (onDataChange) {
        onDataChange(data);
      }
      
      toast.success('Dados de identificação atualizados!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar identificação:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Exibir valor do hospital baseado no tipo
  const getHospitalDisplay = () => {
    const rawHospital = procedure?.hospital;
  
    if (!rawHospital) return 'Não informado';
  
    if (typeof rawHospital === 'string') {
      try {
        const parsed = JSON.parse(rawHospital);
        return parsed?.name || rawHospital;
      } catch {
        return rawHospital;
      }
    }
  
    if (typeof rawHospital === 'object') {
      return rawHospital?.name || 'Não informado';
    }
  
    return 'Não informado';
  };

  // Exibir idade calculada
  const getCalculatedAge = () => {
    if (!patient?.birthDate) return 'Não informado';
    
    const birth = new Date(patient.birthDate);
    const now = new Date();
    
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
      if (months > 0) ageText += `, ${months} ${months !== 1 ? 'meses' : 'mês'}`;
    } else if (months > 0) {
      ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
      if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
    } else {
      ageText = `${days} dia${days !== 1 ? 's' : ''}`;
    }

    return ageText;
  };

  // Exibir data formatada da cirurgia
  const getSurgeryDateDisplay = () => {
    if (!surgery?.startTime) return 'Não informado';
    
    let surgeryDate;
    if (surgery.startTime.seconds) {
      surgeryDate = new Date(surgery.startTime.seconds * 1000);
    } else if (surgery.startTime.toDate) {
      surgeryDate = surgery.startTime.toDate();
    } else {
      surgeryDate = new Date(surgery.startTime);
    }
    
    return surgeryDate.toLocaleDateString('pt-BR');
  };

  // Exibir horário da cirurgia
  const getSurgeryTimeDisplay = () => {
    if (!surgery?.startTime) return 'Não informado';
    
    let surgeryDate;
    if (surgery.startTime.seconds) {
      surgeryDate = new Date(surgery.startTime.seconds * 1000);
    } else if (surgery.startTime.toDate) {
      surgeryDate = surgery.startTime.toDate();
    } else {
      surgeryDate = new Date(surgery.startTime);
    }
    
    return surgeryDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Preparar dados para edição (formato que PatientFormFields espera)
  const prepareEditData = () => {
    // Preparar dados do hospital
    let hospitalValue = procedure?.hospital || '';
    if (typeof hospitalValue === 'object') {
      hospitalValue = JSON.stringify(hospitalValue);
    }

    // Preparar data de nascimento no formato correto
    let birthDateValue = '';
    if (patient?.birthDate) {
      const birthDate = new Date(patient.birthDate);
      birthDateValue = birthDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }

    return {
      // Dados do paciente
      patientName: patient?.name || '',
      patientBirthDate: birthDateValue,
      patientSex: patient?.sex || '',
      patientCNS: patient?.cns || '',
      
      // Dados do procedimento
      procedureType: procedure?.procedureType || 'sus',
      patientWeight: procedure?.patientWeight?.toString() || '',
      hospital: hospitalValue,
      hospitalRecord: procedure?.hospitalRecord || '',
      proposedSurgery: procedure?.procedimento || '',
      insuranceNumber: procedure?.insuranceNumber || '',
      insuranceName: procedure?.insuranceName || '',
      cbhpmProcedures: procedure?.cbhpmProcedures && procedure.cbhpmProcedures.length > 0 
        ? procedure.cbhpmProcedures 
        : [{ codigo: '', procedimento: '', porte_anestesico: '' }],
      mainSurgeon: procedure?.mainSurgeon || '',
      auxiliarySurgeons: procedure?.auxiliarySurgeons && procedure.auxiliarySurgeons.length > 0
        ? procedure.auxiliarySurgeons
        : [{ name: '' }],
      
      // Dados específicos da cirurgia
      patientPosition: surgery?.patientPosition || '',
      performedSurgery: surgery?.performedSurgery || '',
      observations: surgery?.observations || ''
    };
  };

  if (!isEditing) {
    // Modo visualização
    return (
      <div className="space-y-6">
        {/* Header com botão de editar */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Dados de Identificação</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary bg-red-500 text-white flex items-center"
          >
            <Edit3 className="h-4 w-4 mr-2 text-white" />
            Editar
          </button>
        </div>

        {/* Dados do paciente */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 mb-4">
            <User className="h-5 w-5" />
            <h4 className="font-semibold text-base text-gray-800">Dados do Paciente</h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Nome</span>
              <span className="font-medium text-gray-800">{patient?.name || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Idade</span>
              <span className="font-medium text-gray-800">{getCalculatedAge()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Sexo</span>
              <span className="font-medium text-gray-800 capitalize">{patient?.sex || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Peso</span>
              <span className="font-medium text-gray-800">{procedure?.patientWeight ? `${procedure.patientWeight} kg` : 'Não informado'}</span>
            </div>
          </div>

          {/* Dados específicos por tipo */}
          {procedure?.procedureType === 'sus' && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">CNS</label>
                <p className="text-sm text-gray-900">{patient?.cns || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Registro Hospital</label>
                <p className="text-sm text-gray-900">{procedure?.hospitalRecord || 'Não informado'}</p>
              </div>
            </div>
          )}

          {procedure?.procedureType === 'convenio' && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Matrícula Convênio</label>
                <p className="text-sm text-gray-900">{procedure?.insuranceNumber || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Nome do Convênio</label>
                <p className="text-sm text-gray-900">{procedure?.insuranceName || 'Não informado'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dados da cirurgia */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 mb-4">
            <Calendar className="h-5 w-5" />
            <h4 className="font-semibold text-base text-gray-800">Dados da Cirurgia</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Data</span>
              <span className="font-medium text-gray-800">{getSurgeryDateDisplay()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Horário</span>
              <span className="font-medium text-gray-800">{getSurgeryTimeDisplay()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Tipo</span>
              <span className="font-medium text-gray-800 capitalize">
                {procedure?.procedureType === 'sus' ? 'SUS' : procedure?.procedureType === 'convenio' ? 'Convênio' : 'Não definido'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Hospital</span>
              <span className="font-medium text-gray-800">{getHospitalDisplay()}</span>
            </div>
          </div>

          <div className="mt-6">
            {procedure?.procedureType === 'sus' ? (
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Cirurgia Proposta</label>
                  <p className="text-sm text-gray-900">{procedure?.procedimento || 'Não informado'}</p>
                </div>
                {surgery?.performedSurgery && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cirurgia Realizada</label>
                    <p className="text-sm text-gray-900">{surgery.performedSurgery}</p>
                  </div>
                )}
              </div>
            ) : procedure?.procedureType === 'convenio' && procedure?.cbhpmProcedures ? (
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wide inline-block bg-blue-50 text-blue-800 font-medium px-2 py-1 rounded-full">
                  Procedimentos
                </label>
                <div className="space-y-2 mt-2">
                  {[...procedure.cbhpmProcedures]
                    .sort((a, b) => (parseInt(b.porte_anestesico) || 0) - (parseInt(a.porte_anestesico) || 0))
                    .map((proc, index) => (
                      proc.codigo && (
                        <div key={index} className="border rounded-lg p-3 bg-white shadow-sm">
                          <p className="font-medium text-sm text-gray-800">
                            {proc.procedimento} - {proc.codigo}
                          </p>
                          {proc.porte_anestesico && (
                            <p className="text-sm font-bold text-blue-800 mt-1">Porte: {proc.porte_anestesico}</p>
                          )}
                        </div>
                      )
                    ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-600">Procedimento</label>
                <p className="text-sm text-gray-900">{procedure?.procedimento || 'Não informado'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados da equipe */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 mb-4">
            <Users className="h-5 w-5" />
            <h4 className="font-semibold text-base text-gray-800">Equipe Cirúrgica</h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Cirurgião Principal</span>
              <span className="font-medium text-gray-800">{procedure?.mainSurgeon || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Posicionamento</span>
              <span className="font-medium text-gray-800 capitalize">{surgery?.patientPosition || 'Não informado'}</span>
            </div>
          </div>

          {/* Cirurgiões Auxiliares */}
          {procedure?.auxiliarySurgeons && procedure.auxiliarySurgeons.some(aux => aux.name) && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Cirurgiões Auxiliares</label>
              <div className="space-y-1">
                {procedure.auxiliarySurgeons.map((aux, index) => (
                  aux.name && (
                    <p key={index} className="text-sm text-gray-900">{aux.name}</p>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Anestesistas */}
          {surgery?.anesthetists && surgery.anesthetists.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Anestesistas</label>
              <div className="space-y-1">
                {surgery.anesthetists.map((anest, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{anest.doctorName}</p>
                    {anest.isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo edição
  return (
    <div className="space-y-6">
      {/* Header do modo edição */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Editando Dados de Identificação</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Formulário de edição usando PatientFormFields */}
      <PatientFormFields
        mode="edit_procedure"
        existingPatient={patient}
        initialProcedureData={prepareEditData()}
        procedureType={procedure?.procedureType}
        currentUser={{ uid: 'current-user' }} // Você pode passar o usuário real aqui
        onSubmit={handleSave}
        isLoading={isSaving}
        submitButtonText={
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </>
        }
        showTitle={false}
        onAutoSave={handleAutoSave}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default IdentificationSection;