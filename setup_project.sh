#!/bin/bash

# Script para criar a estrutura completa do projeto Anestesia App
echo "🏗️  Criando estrutura do projeto Anestesia App..."

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p public
mkdir -p src/components/ui
mkdir -p src/components/auth
mkdir -p src/components/forms
mkdir -p src/components/templates
mkdir -p src/components/charts
mkdir -p src/components/layout
mkdir -p src/pages
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/data/templates
mkdir -p src/utils
mkdir -p src/styles

# Criar arquivos da pasta public
echo "🌐 Criando arquivos públicos..."
touch public/index.html
touch public/favicon.ico

# Criar componentes UI
echo "🎨 Criando componentes UI..."
cat > src/components/ui/Button.jsx << 'EOF'
import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50'
  };
  
  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
EOF

cat > src/components/ui/Input.jsx << 'EOF'
import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? 'border-red-300 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="error-text">{error}</p>
      )}
    </div>
  );
};

export default Input;
EOF

cat > src/components/ui/Modal.jsx << 'EOF'
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${maxWidth} sm:w-full`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
EOF

cat > src/components/ui/Loading.jsx << 'EOF'
import React from 'react';

const Loading = ({ text = 'Carregando...', size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`loading-spinner ${sizes[size]} mr-2`}></div>
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

export default Loading;
EOF

# Criar componentes de formulários
echo "📝 Criando componentes de formulários..."
touch src/components/forms/PatientIdentification.jsx
touch src/components/forms/SUSForm.jsx
touch src/components/forms/ConvenioForm.jsx
touch src/components/forms/VitalSigns.jsx
touch src/components/forms/MedicationList.jsx

# Criar templates
echo "🏥 Criando templates..."
touch src/components/templates/CardiovascularTemplate.jsx
touch src/components/templates/GinecologicaTemplate.jsx
touch src/components/templates/OrtopedicaTemplate.jsx
touch src/components/templates/TemplateSelector.jsx

# Criar componentes de gráficos
echo "📊 Criando componentes de gráficos..."
touch src/components/charts/VitalSignsChart.jsx
touch src/components/charts/GasChart.jsx

# Criar componentes de layout extras
echo "🏗️  Criando componentes de layout..."
touch src/components/layout/Header.jsx
touch src/components/layout/Sidebar.jsx

# Criar páginas
echo "📄 Criando páginas..."
touch src/pages/NewForm.jsx
touch src/pages/FormsList.jsx
touch src/pages/Statistics.jsx
touch src/pages/Settings.jsx

cat > src/pages/NotFound.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
EOF

# Criar hooks
echo "🎣 Criando hooks..."
touch src/hooks/useFirebase.js
touch src/hooks/useTemplates.js

# Criar serviços
echo "⚙️  Criando serviços..."
touch src/services/auth.js
touch src/services/firestore.js
touch src/services/pdfGenerator.js

# Criar dados
echo "💾 Criando arquivos de dados..."
cat > src/data/templates/index.js << 'EOF'
export { default as cardiovascular } from './cardiovascular';
export { default as ginecologica } from './ginecologica';
EOF

touch src/data/templates/cardiovascular.js
touch src/data/templates/ginecologica.js
touch src/data/procedures.js
touch src/data/medications.js

# Criar utilitários
echo "🔧 Criando utilitários..."
cat > src/utils/constants.js << 'EOF'
export const COMPANIES = {
  CLIAN: 'CLIAN',
  CMA: 'CMA'
};

export const FORM_TYPES = {
  SUS: 'sus',
  CONVENIO: 'convenio'
};

export const ANESTHESIA_TYPES = {
  GENERAL: 'Geral',
  REGIONAL: 'Regional',
  LOCAL: 'Local',
  SEDATION: 'Sedação'
};

export const SURGERY_SPECIALTIES = {
  CARDIOVASCULAR: 'Cardiovascular',
  GINECOLOGICA: 'Ginecológica',
  ORTOPEDICA: 'Ortopédica',
  NEUROLOGICA: 'Neurológica',
  UROLOGICA: 'Urológica',
  GASTROENTEROLOGIA: 'Gastroenterologia'
};
EOF

touch src/utils/validators.js
touch src/utils/helpers.js

# Criar arquivo principal
echo "🚀 Criando arquivo principal..."
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Criar README
echo "📖 Criando README..."
cat > README.md << 'EOF'
# Anestesia App

Sistema para digitalização de fichas anestésicas.

## Estrutura do Projeto

- **components/**: Componentes React reutilizáveis
- **pages/**: Páginas principais da aplicação
- **hooks/**: Custom hooks do React
- **services/**: Serviços externos (Firebase, APIs)
- **data/**: Dados estáticos e templates
- **utils/**: Funções utilitárias

## Como executar

1. Instalar dependências: `npm install`
2. Configurar Firebase em `src/services/firebase.js`
3. Executar: `npm start`

## Tecnologias

- React 18
- React Router
- Tailwind CSS
- Firebase
- React Hook Form
- Recharts
EOF

echo "✅ Estrutura criada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. npm install"
echo "2. Configurar Firebase em src/services/firebase.js"
echo "3. npm start"
echo ""
echo "🎉 Projeto pronto para desenvolvimento!"
