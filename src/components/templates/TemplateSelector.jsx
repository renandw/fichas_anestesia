import React, { useState } from 'react';
import { 
  Heart, 
  Baby, 
  Bone, 
  Brain, 
  Activity, 
  Zap,
  Eye,
  ArrowRight,
  Clock,
  FileText
} from 'lucide-react';

const TemplateSelector = ({ onSelect, selectedTemplate }) => {
  const [selected, setSelected] = useState(selectedTemplate);

  const templates = [
    {
      id: 'cardiovascular',
      name: 'Cardiovascular',
      description: 'Cirurgias cardíacas, vasculares e torácicas',
      icon: Heart,
      color: 'red',
      procedures: ['Revascularização', 'Angioplastia', 'Marcapasso', 'Valvuloplastia'],
      estimatedTime: '3-6 horas'
    },
    {
      id: 'ginecologica',
      name: 'Ginecológica',
      description: 'Cirurgias ginecológicas e obstétricas',
      icon: Baby,
      color: 'pink',
      procedures: ['Cesariana', 'Histerectomia', 'Laparoscopia', 'Miomectomia'],
      estimatedTime: '1-4 horas'
    },
    {
      id: 'ortopedica',
      name: 'Ortopédica',
      description: 'Cirurgias de ossos, articulações e músculos',
      icon: Bone,
      color: 'amber',
      procedures: ['Prótese de joelho', 'Artroscopia', 'Fixação de fratura', 'Coluna'],
      estimatedTime: '2-5 horas'
    },
    {
      id: 'neurologica',
      name: 'Neurológica',
      description: 'Cirurgias do sistema nervoso central e periférico',
      icon: Brain,
      color: 'purple',
      procedures: ['Craniotomia', 'Aneurisma', 'Tumor cerebral', 'Coluna cervical'],
      estimatedTime: '4-8 horas'
    },
    {
      id: 'urologica',
      name: 'Urológica',
      description: 'Cirurgias do trato urinário e reprodutor masculino',
      icon: Activity,
      color: 'blue',
      procedures: ['Prostatectomia', 'Nefrectomia', 'Cistectomia', 'Litotripsia'],
      estimatedTime: '2-4 horas'
    },
    {
      id: 'gastroenterologia',
      name: 'Gastroenterologia',
      description: 'Cirurgias do sistema digestivo',
      icon: Zap,
      color: 'green',
      procedures: ['Colecistectomia', 'Apendicectomia', 'Ressecção intestinal', 'Gastroplastia'],
      estimatedTime: '1-5 horas'
    },
    {
      id: 'oftalmologica',
      name: 'Oftalmológica',
      description: 'Cirurgias oculares e do sistema visual',
      icon: Eye,
      color: 'indigo',
      procedures: ['Catarata', 'Retina', 'Glaucoma', 'Transplante de córnea'],
      estimatedTime: '30min-2 horas'
    },
    {
      id: 'geral',
      name: 'Cirurgia Geral',
      description: 'Procedimentos gerais e multidisciplinares',
      icon: FileText,
      color: 'gray',
      procedures: ['Herniorrafia', 'Drenagem', 'Biópsia', 'Curativos'],
      estimatedTime: '30min-3 horas'
    }
  ];

  const getColorClasses = (color, isSelected = false) => {
    const colors = {
      red: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300',
      pink: isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300',
      amber: isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300',
      purple: isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
      blue: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
      green: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
      indigo: isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300',
      gray: isSelected ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
    };
    return colors[color] || colors.gray;
  };

  const getIconColorClasses = (color) => {
    const colors = {
      red: 'text-red-600 bg-red-100',
      pink: 'text-pink-600 bg-pink-100',
      amber: 'text-amber-600 bg-amber-100',
      purple: 'text-purple-600 bg-purple-100',
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      gray: 'text-gray-600 bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  const handleTemplateSelect = (template) => {
    setSelected(template);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Selecione o Template de Cirurgia
        </h2>
        <p className="text-sm text-gray-600">
          Escolha a especialidade que melhor se adequa ao procedimento. 
          Isso irá pré-configurar os campos e medicações mais comuns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {templates.map((template) => {
          const Icon = template.icon;
          const isSelected = selected?.id === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`
                p-6 border-2 rounded-lg text-left transition-all duration-200
                ${getColorClasses(template.color, isSelected)}
              `}
            >
              <div className="flex items-start">
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4
                  ${getIconColorClasses(template.color)}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Tempo médio: {template.estimatedTime}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.procedures.slice(0, 3).map((procedure, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {procedure}
                        </span>
                      ))}
                      {template.procedures.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{template.procedures.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Template Details */}
      {selected && (
        <div className="card bg-gray-50 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Template Selecionado: {selected.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Procedimentos Comuns
              </h4>
              <ul className="space-y-1">
                {selected.procedures.map((procedure, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></div>
                    {procedure}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Pré-configurações
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                  Medicações pré-anestésicas
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                  Monitorização padrão
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                  Sinais vitais esperados
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                  Protocolos de segurança
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selected ? (
            <span className="text-green-600 font-medium">
              ✓ Template selecionado: {selected.name}
            </span>
          ) : (
            'Selecione um template para continuar'
          )}
        </div>
        
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;