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

const IdentificationSection = ({ surgery, onDataChange, autoSave }) => {
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
    const rawHospital = surgery?.hospital;
  
    if (!rawHospital) return 'Não informado';
  
    if (typeof rawHospital === 'string') {
      try {
        const parsed = JSON.parse(rawHospital);
        return parsed?.name || rawHospital; // se não tiver `.name`, usa o texto bruto
      } catch {
        return rawHospital; // se não é JSON válido, assume que é o nome direto
      }
    }
  
    if (typeof rawHospital === 'object') {
      return rawHospital?.name || 'Não informado';
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
      if (months > 0) ageText += `, ${months} ${months !== 1 ? 'meses' : 'mês'}`;
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
            <label className="text-gray-500 text-xs uppercase tracking-wide">Cirurgia Proposta</label>
            <p className="text-sm text-gray-900">{surgery?.proposedSurgery || 'Não informado'}</p>
          </div>
          {surgery?.performedSurgery && (
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wide">Cirurgia Realizada</label>
              <p className="text-sm text-gray-900">{surgery.performedSurgery}</p>
            </div>
          )}
        </div>
      );
    } else if (surgery?.type === 'convenio' && surgery?.cbhpmProcedures) {
      return (
        <div>
          <label className="text-gray-500 text-xs uppercase tracking-wide inline-block bg-blue-50 text-blue-800 font-medium px-2 py-1 rounded-full">
            Procedimentos
          </label>
          <div className="space-y-2">
            {surgery.cbhpmProcedures.map((proc, index) => (
              proc.codigo && (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm text-gray-900">
                   {proc.codigo} - {proc.procedimento}
                  </p>
                  {proc.porte_anestesico && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
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
              <span className="font-medium text-gray-800">{surgery?.patientName || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Idade</span>
              <span className="font-medium text-gray-800">{getCalculatedAge()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Sexo</span>
              <span className="font-medium text-gray-800 capitalize">{surgery?.patientSex || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Peso</span>
              <span className="font-medium text-gray-800">{surgery?.patientWeight ? `${surgery.patientWeight} kg` : 'Não informado'}</span>
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

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-primary-600 mb-4">
            <Calendar className="h-5 w-5" />
            <h4 className="font-semibold text-base text-gray-800">Dados da Cirurgia</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Data</span>
              <span className="font-medium text-gray-800">{surgery?.surgeryDate || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Horário</span>
              <span className="font-medium text-gray-800">{surgery?.surgeryTime || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Tipo</span>
              <span className="font-medium text-gray-800 capitalize">
                {surgery?.type === 'sus' ? 'SUS' : surgery?.type === 'convenio' ? 'Convênio' : 'Não definido'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Hospital</span>
              <span className="font-medium text-gray-800">{getHospitalDisplay()}</span>
            </div>
          </div>

          <div className="mt-6">
            {surgery?.type === 'sus' ? (
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
            ) : surgery?.type === 'convenio' && surgery?.cbhpmProcedures ? (
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wide inline-block bg-blue-50 text-blue-800 font-medium px-2 py-1 rounded-full">
                  Procedimentos
                </label>
                <div className="space-y-2 mt-2">
                  {[...surgery.cbhpmProcedures]
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
            ) : null}
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
              <span className="font-medium text-gray-800">{surgery?.mainSurgeon || 'Não informado'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Posicionamento</span>
              <span className="font-medium text-gray-800 capitalize">{surgery?.patientPosition || 'Não informado'}</span>
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
        onAutoSave={handleAutoSave}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default IdentificationSection;