import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import PatientIdentification from '../components/forms/PatientIdentification';
import SUSForm from '../components/forms/SUSForm';
import ConvenioForm from '../components/forms/ConvenioForm';
import TemplateSelector from '../components/templates/TemplateSelector';

const NewForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Verificar se tipo foi passado via URL (ex: /new-form?type=sus)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const typeParam = urlParams.get('type');
    if (typeParam && ['sus', 'convenio'].includes(typeParam)) {
      setFormType(typeParam);
    }
  }, [location]);

  // Verificar se usuário pode criar tipo de ficha baseado nas empresas
  const canCreateSUS = userProfile?.companies?.includes('CLIAN');
  const canCreateConvenio = userProfile?.companies?.includes('CMA') || userProfile?.companies?.includes('CLIAN');

  const steps = [
    { id: 1, name: 'Tipo de Ficha', component: 'type-selection' },
    { id: 2, name: 'Identificação', component: 'patient-id' },
    { id: 3, name: 'Template', component: 'template' },
    { id: 4, name: 'Formulário', component: 'form' }
  ];

  const handleFormTypeSelection = (type) => {
    setFormType(type);
    setCurrentStep(2);
  };

  const handlePatientData = (data) => {
    setFormData(prev => ({ ...prev, patient: data }));
    setCurrentStep(3);
  };

  const handleTemplateSelection = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({ ...prev, template }));
    setCurrentStep(4);
  };

  const handleFormSubmit = (data) => {
    const finalData = {
      ...formData,
      ...data,
      type: formType,
      createdAt: new Date().toISOString(),
      createdBy: userProfile?.uid,
      status: 'draft'
    };
    
    console.log('Dados finais da ficha:', finalData);
    // Aqui você salvaria no Firebase
    // saveFormToFirebase(finalData);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const saveDraft = () => {
    const draftData = {
      ...formData,
      type: formType,
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    console.log('Salvando rascunho:', draftData);
    // saveDraftToFirebase(draftData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Ficha Anestésica</h1>
            <p className="text-sm text-gray-600">
              Passo {currentStep} de {steps.length}: {steps.find(s => s.id === currentStep)?.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={saveDraft}
            className="btn-outline flex items-center"
            disabled={currentStep === 1}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.id 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-4 rounded ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {/* Step 1: Tipo de Ficha */}
        {currentStep === 1 && (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Selecione o tipo de ficha
            </h2>
            <p className="text-gray-600 mb-8">
              Escolha entre SUS ou Convênio/Particular baseado no paciente
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              {canCreateSUS && (
                <button
                  onClick={() => handleFormTypeSelection('sus')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Ficha SUS</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Pacientes do Sistema Único de Saúde
                    </p>
                  </div>
                </button>
              )}
              
              {canCreateConvenio && (
                <button
                  onClick={() => handleFormTypeSelection('convenio')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Ficha Convênio</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Pacientes de convênio ou particular
                    </p>
                  </div>
                </button>
              )}
            </div>

            {(!canCreateSUS && !canCreateConvenio) && (
              <div className="text-center py-4">
                <p className="text-red-600">
                  Você não tem permissão para criar fichas. Verifique suas empresas nas configurações.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Identificação do Paciente */}
        {currentStep === 2 && formType && (
          <PatientIdentification
            formType={formType}
            onSubmit={handlePatientData}
            initialData={formData.patient}
          />
        )}

        {/* Step 3: Seleção de Template */}
        {currentStep === 3 && (
          <TemplateSelector
            onSelect={handleTemplateSelection}
            selectedTemplate={selectedTemplate}
          />
        )}

        {/* Step 4: Formulário Principal */}
        {currentStep === 4 && formType && (
          <div>
            {formType === 'sus' ? (
              <SUSForm
                patientData={formData.patient}
                template={selectedTemplate}
                onSubmit={handleFormSubmit}
                onSaveDraft={saveDraft}
              />
            ) : (
              <ConvenioForm
                patientData={formData.patient}
                template={selectedTemplate}
                onSubmit={handleFormSubmit}
                onSaveDraft={saveDraft}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewForm;