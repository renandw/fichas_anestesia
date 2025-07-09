import React, { useState } from 'react';
import PatientFormFields from './PatientFormFields';
import { 
  Calendar,
  User,
  Users,
  CreditCard,
  AlertCircle,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const IdentificationSection = ({ surgery, onDataChange, autoSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (typeof surgery?.hospital === 'string') {
      return surgery.hospital; // Convênio
    } else if (surgery?.hospital?.shortName) {
      return surgery.hospital.shortName; // SUS
    }
    return 'Não informado';
  };

  // Exibir idade calculada
  const getCalculatedAge = () => {
    if (!surgery?.patientBirthDate) return 'Não informado';
    
    const birth = new Date(surgery.patientBirthDate);
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
      if (months > 0) ageText += `, ${months} mês${months !== 1 ? 'es' : ''}`;
    } else if (months > 0) {
      ageText += `${months} mês${months !== 1 ? 'es' : ''}`;
      if (days > 0) ageText += `, ${days} dia${days !== 1 ? 's' : ''}`;
    } else {
      ageText = `${days} dia${days !== 1 ? 's' : ''}`;
    }

    return ageText;
  };

  // Exibir procedimentos baseado no tipo
  const getProceduresDisplay = () => {
    if (surgery?.type === 'sus') {
      return (
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-600">Cirurgia Proposta</label>
            <p className="text-sm text-gray-900">{surgery?.proposedSurgery || 'Não informado'}</p>
          </div>
          {surgery?.performedSurgery && (
            <div>
              <label className="text-sm font-medium text-gray-600">Cirurgia Realizada</label>
              <p className="text-sm text-gray-900">{surgery.performedSurgery}</p>
            </div>
          )}
        </div>
      );
    } else if (surgery?.type === 'convenio' && surgery?.cbhpmProcedures) {
      return (
        <div>
          <label className="text-sm font-medium text-gray-600">Procedimentos CBHPM</label>
          <div className="space-y-2">
            {surgery.cbhpmProcedures.map((proc, index) => (
              proc.codigo && (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm text-gray-900">
                    {proc.codigo} - {proc.procedimento}
                  </p>
                  {proc.porte_anestesico && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Porte: {proc.porte_anestesico}
                    </span>
                  )}
                </div>
              )
            ))}
          </div>
        </div>
      );
    }
    return null;
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
            className="btn-secondary flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Editar
          </button>
        </div>

        {/* Dados básicos da cirurgia */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="font-medium text-gray-900">Dados da Cirurgia</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Data</label>
              <p className="text-sm text-gray-900">{surgery?.surgeryDate || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Horário</label>
              <p className="text-sm text-gray-900">{surgery?.surgeryTime || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tipo</label>
              <p className="text-sm text-gray-900">
                {surgery?.type === 'sus' ? 'SUS' : surgery?.type === 'convenio' ? 'Convênio' : 'Não definido'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Hospital</label>
            <p className="text-sm text-gray-900">{getHospitalDisplay()}</p>
          </div>

          {/* Procedimentos */}
          <div className="mt-4">
            {getProceduresDisplay()}
          </div>
        </div>

        {/* Dados do paciente */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="font-medium text-gray-900">Dados do Paciente</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nome</label>
              <p className="text-sm text-gray-900">{surgery?.patientName || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Idade</label>
              <p className="text-sm text-gray-900">{getCalculatedAge()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Sexo</label>
              <p className="text-sm text-gray-900 capitalize">{surgery?.patientSex || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Peso</label>
              <p className="text-sm text-gray-900">{surgery?.patientWeight ? `${surgery.patientWeight} kg` : 'Não informado'}</p>
            </div>
          </div>

          {/* Dados específicos por tipo */}
          {surgery?.type === 'sus' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">CNS</label>
                <p className="text-sm text-gray-900">{surgery?.patientCNS || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Registro Hospital</label>
                <p className="text-sm text-gray-900">{surgery?.hospitalRecord || 'Não informado'}</p>
              </div>
            </div>
          )}

          {surgery?.type === 'convenio' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Matrícula Convênio</label>
                <p className="text-sm text-gray-900">{surgery?.insuranceNumber || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Nome do Convênio</label>
                <p className="text-sm text-gray-900">{surgery?.insuranceName || 'Não informado'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dados da equipe */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-primary-600 mr-2" />
            <h4 className="font-medium text-gray-900">Equipe Cirúrgica</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Cirurgião Principal</label>
              <p className="text-sm text-gray-900">{surgery?.mainSurgeon || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Posicionamento</label>
              <p className="text-sm text-gray-900 capitalize">{surgery?.patientPosition || 'Não informado'}</p>
            </div>
          </div>

          {/* Cirurgiões Auxiliares */}
          {surgery?.auxiliarySurgeons && surgery.auxiliarySurgeons.some(aux => aux.name) && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Cirurgiões Auxiliares</label>
              <div className="space-y-1">
                {surgery.auxiliarySurgeons.map((aux, index) => (
                  aux.name && (
                    <p key={index} className="text-sm text-gray-900">{aux.name}</p>
                  )
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
        initialData={surgery}
        surgeryType={surgery?.type}
        onSubmit={handleSave}
        isLoading={isSaving}
        submitButtonText={
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </>
        }
        showTitle={false}
        mode="edit"
      />
    </div>
  );
};

export default IdentificationSection;