# Sistema de Fichas Anestésicas - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Componentes Reutilizáveis](#componentes-reutilizáveis)
5. [Páginas e Fluxos](#páginas-e-fluxos)
6. [Guia de Migração Firebase](#guia-de-migração-firebase)
7. [Implementação e Deploy](#implementação-e-deploy)
8. [Roadmap](#roadmap)

---

## 🎯 Visão Geral

### Objetivo
Sistema web para gerenciamento de fichas anestésicas, permitindo que anestesistas registrem e compartilhem informações sobre:
- Avaliações pré-anestésicas
- Fichas anestésicas
- Registros de sala de recuperação pós-anestésica (SRPA)

### Características Principais
- **Multiplataforma**: Web responsivo (desktop/mobile)
- **Colaborativo**: Compartilhamento entre anestesistas
- **Flexível**: Suporte a SUS e Convênios
- **Inteligente**: Prevenção de duplicatas e validações automáticas

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React + Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **Roteamento**: React Router
- **Ícones**: Lucide React
- **Estado**: React Hooks (useState, useContext)

### Padrões Arquiteturais
```
src/
├── components/           # Componentes reutilizáveis
│   ├── base/            # PatientForm, SurgeryForm, etc.
│   ├── variations/      # PatientConfirm, PatientDisplay, etc.
│   └── lists/           # AnesthesiaList, PatientList, etc.
├── pages/               # Páginas completas
├── services/            # Integração Firebase
├── hooks/               # Custom hooks
├── utils/               # Funções utilitárias
└── contexts/            # Contextos globais
```

---

## 🗄️ Estrutura de Dados

### Hierarquia Firestore
```
patients (coleção)
├── {patientId} (documento)
│   ├── patientName: string
│   ├── patientBirthDate: string
│   ├── patientSex: "M" | "F"
│   ├── patientCNS: string (15 dígitos)
│   ├── metadata: {
│   │   createdAt: timestamp,
│   │   createdBy: string,
│   │   updatedAt?: timestamp,
│   │   updatedBy?: string
│   │ }
│   └── surgeries (subcoleção)
│       ├── {surgeryId} (documento)
│       │   ├── procedureType: "sus" | "convenio"
│       │   ├── patientWeight: string
│       │   ├── mainSurgeon: string
│       │   ├── auxiliarySurgeons: Array<{name: string}>
│       │   ├── hospital: string
│       │   ├── hospitalRecord?: string (SUS)
│       │   ├── proposedSurgery?: string (SUS)
│       │   ├── insuranceNumber?: string (Convênio)
│       │   ├── insuranceName?: string (Convênio)
│       │   ├── cbhpmProcedures?: Array<{
│       │   │   codigo: string,
│       │   │   procedimento: string,
│       │   │   porte_anestesico: string
│       │   │ }>
│       │   ├── procedimento: string
│       │   ├── status: "Agendada" | "Em andamento" | "Concluída" | "Cancelada" | "Expirada"
│       │   ├── sharedWith?: Array<string> (userIds)
│       │   ├── metadata: {...}
│       │   ├── anesthesia (subcoleção)
│       │   │   └── {anesthesiaId}
│       │   │       ├── surgeryDate: string
│       │   │       ├── surgeryTimeStart: string
│       │   │       ├── surgeryTimeEnd: string
│       │   │       ├── anesthesiaTimeStart: string
│       │   │       ├── anesthesiaTimeEnd: string
│       │   │       ├── patientPosition: string
│       │   │       ├── medications: Array<string>
│       │   │       ├── vitalSigns: object
│       │   │       ├── description: string
│       │   │       ├── status: string
│       │   │       └── metadata: {...}
│       │   ├── preAnesthesia (subcoleção)
│       │   │   └── {preAnesthesiaId}
│       │   │       ├── surgeryDate: string
│       │   │       ├── diseases: Array<string>
│       │   │       ├── medicationsInUse: Array<string>
│       │   │       ├── labs: object
│       │   │       ├── images: Array<string>
│       │   │       ├── asaClassification: string
│       │   │       ├── medicalOpinion: string
│       │   │       ├── careNeededInSurgery: string
│       │   │       ├── status: string
│       │   │       └── metadata: {...}
│       │   └── srpa (subcoleção)
│       │       └── {srpaId}
│       │           ├── surgeryDate: string
│       │           ├── surgeryTimeEnd: string
│       │           ├── anesthesiaTimeEnd: string
│       │           ├── sRPATimeStart: string
│       │           ├── sRPATimeEnd: string
│       │           ├── medicationsInSRPA: Array<string>
│       │           ├── vitalSignsInSRPA: object
│       │           ├── status: string
│       │           └── metadata: {...}
```

### Users Collection
```
users (coleção)
├── {userId} (documento)
│   ├── name: string
│   ├── email: string
│   ├── specialty: string
│   ├── hospital?: string
│   ├── status: "online" | "offline"
│   ├── lastSeen: timestamp
│   └── metadata: {...}
```

---

## 🧩 Componentes Reutilizáveis

### Componentes Base

#### 1. PatientForm
**Função**: Cadastro completo de paciente com verificação de duplicatas

**Props**:
```typescript
interface PatientFormProps {
  onPatientSelected: (patient: Patient) => void;
}
```

**Funcionalidades**:
- Formulário completo (nome, data nascimento, sexo, CNS)
- Verificação automática de duplicatas (CNS + Nome+Data)
- Modal de duplicata com opções: "Usar Existente" | "Atualizar Dados" | "Criar Novo"
- Modal de atualização com comparação lado a lado
- Validações em tempo real

#### 2. SurgeryForm
**Função**: Cadastro completo de cirurgia com campos condicionais

**Props**:
```typescript
interface SurgeryFormProps {
  selectedPatient: Patient;
  currentFlow: "anesthesia" | "preAnesthesia" | "srpa";
  onSurgerySelected: (surgery: Surgery) => void;
}
```

**Funcionalidades**:
- Campos condicionais (SUS vs Convênio)
- Múltiplos procedimentos CBHPM
- Cirurgiões auxiliares dinâmicos
- Verificação de cirurgias similares
- Modal de conflito quando subcoleção já existe

#### 3. AnesthesiaValidator
**Função**: Validação automática para criação de SRPA

**Props**:
```typescript
interface AnesthesiaValidatorProps {
  patient: Patient;
  surgery: Surgery;
  onAnesthesiaSelected: (anesthesia: Anesthesia) => void;
  onError: (errorType: string) => void;
}
```

**Funcionalidades**:
- Verificação automática de anestesia concluída
- Auto-progressão ou bloqueio com erro
- Interface informativa (loading, erro, sucesso)

#### 4. ShareSurgery
**Função**: Compartilhamento de cirurgia com outros usuários

**Props**:
```typescript
interface ShareSurgeryProps {
  surgery: Surgery;
  onShareComplete: (updatedSurgery: Surgery, selectedUserIds: string[]) => void;
  onSkip: () => void;
}
```

**Funcionalidades**:
- Lista de usuários com busca
- Seleção múltipla com checkboxes
- Status online/offline dos usuários
- Preview de selecionados

### Componentes de Variação

#### 5. PatientConfirm
**Função**: Confirmação de paciente pré-selecionado

**Props**:
```typescript
interface PatientConfirmProps {
  patient: Patient;
  onConfirm: (patient: Patient) => void;
  allowChange?: boolean;
}
```

#### 6. PatientDisplay
**Função**: Exibição readonly de dados do paciente

**Props**:
```typescript
interface PatientDisplayProps {
  patient: Patient;
  compact?: boolean;
}
```

#### 7. SurgeryConfirm
**Função**: Confirmação de cirurgia pré-selecionada

**Props**:
```typescript
interface SurgeryConfirmProps {
  surgery: Surgery;
  patient: Patient;
  currentFlow: string;
  onConfirm: (surgery: Surgery) => void;
  allowChange?: boolean;
}
```

#### 8. SurgeryDisplay
**Função**: Exibição readonly de dados da cirurgia

**Props**:
```typescript
interface SurgeryDisplayProps {
  surgery: Surgery;
  compact?: boolean;
}
```

### Componentes de Lista

#### 9. AnesthesiaList
**Função**: Listagem de anestesias com filtros e busca

**Props**:
```typescript
interface AnesthesiaListProps {
  title?: string;
  filterByStatus?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  onCreateNew?: () => void;
  onViewDetails?: (anesthesia: Anesthesia) => void;
  onCreateSRPA?: (anesthesia: Anesthesia) => void;
}
```

**Funcionalidades**:
- Busca em tempo real
- Filtros por status, tipo, período
- Paginação
- Ações contextuais por item

---

## 📄 Páginas e Fluxos

### Páginas de Criação

#### 1. `/anesthesia/new` - Nova Ficha Anestésica
**Componentes**: PatientForm → SurgeryForm → ShareSurgery → Redirect

**Fluxo**:
1. Usuario preenche dados do paciente
2. Sistema verifica duplicatas e resolve
3. Usuario preenche dados da cirurgia
4. Sistema verifica similaridade e resolve
5. Se cirurgia nova: oferece compartilhamento
6. Redireciona para `/patients/{id}/surgery/{id}/anesthesia/new`

#### 2. `/preanesthesia/new` - Nova Avaliação Pré-Anestésica
**Componentes**: PatientForm → SurgeryForm → ShareSurgery → Redirect

**Fluxo**: Idêntico ao anterior, redireciona para página de pré-anestésica

#### 3. `/srpa/new` - Nova Ficha SRPA
**Componentes**: PatientForm → SurgeryForm → AnesthesiaValidator → Redirect

**Fluxo**: Adiciona validação de anestesia concluída antes do redirect

### Páginas com Contexto

#### 4. `/patients/{id}/anesthesia/new`
**Componentes**: PatientConfirm → SurgeryForm → ShareSurgery → Redirect

#### 5. `/patients/{id}/surgery/{id}/anesthesia/new`
**Componentes**: PatientDisplay + SurgeryConfirm → Redirect

### Páginas de Listagem

#### 6. `/anesthesia` - Anestesias Recentes
**Componentes**: AnesthesiaList

#### 7. `/anesthesia/active` - Anestesias em Andamento
**Componentes**: AnesthesiaList (filterByStatus="Em andamento")

---

## 🔥 Guia de Migração Firebase

### 1. Configuração Inicial

#### Instalar dependências:
```bash
npm install firebase
```

#### Configurar Firebase:
```javascript
// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Para desenvolvimento local (opcional)
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### 2. Serviços Firebase

#### Patient Service:
```javascript
// src/services/patientService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const patientService = {
  // Verificar duplicatas
  async checkDuplicates(patientData) {
    try {
      // Buscar por CNS
      const cnsQuery = query(
        collection(db, 'patients'),
        where('patientCNS', '==', patientData.patientCNS)
      );
      const cnsSnapshot = await getDocs(cnsQuery);
      
      if (!cnsSnapshot.empty) {
        return {
          type: 'cns_match',
          patients: cnsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        };
      }

      // Buscar por nome + data
      const nameQuery = query(
        collection(db, 'patients'),
        where('patientName', '==', patientData.patientName),
        where('patientBirthDate', '==', patientData.patientBirthDate)
      );
      const nameSnapshot = await getDocs(nameQuery);
      
      if (!nameSnapshot.empty) {
        return {
          type: 'name_date_match',
          patients: nameSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        };
      }

      return { type: 'none', patients: [] };
    } catch (error) {
      throw new Error('Erro ao verificar duplicatas: ' + error.message);
    }
  },

  // Criar paciente
  async createPatient(patientData, currentUserId) {
    try {
      const docRef = await addDoc(collection(db, 'patients'), {
        ...patientData,
        metadata: {
          createdAt: new Date(),
          createdBy: currentUserId
        }
      });
      
      return {
        id: docRef.id,
        ...patientData,
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: currentUserId
        }
      };
    } catch (error) {
      throw new Error('Erro ao criar paciente: ' + error.message);
    }
  },

  // Atualizar paciente
  async updatePatient(patientId, updates, currentUserId) {
    try {
      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, {
        ...updates,
        'metadata.updatedAt': new Date(),
        'metadata.updatedBy': currentUserId
      });
      
      return { id: patientId, ...updates };
    } catch (error) {
      throw new Error('Erro ao atualizar paciente: ' + error.message);
    }
  }
};
```

#### Surgery Service:
```javascript
// src/services/surgeryService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const surgeryService = {
  // Verificar cirurgias similares
  async checkSimilarSurgeries(patientId, surgeryData) {
    try {
      const surgeriesRef = collection(db, `patients/${patientId}/surgeries`);
      const q = query(
        surgeriesRef,
        where('status', 'in', ['Agendada', 'Em andamento'])
      );
      
      const snapshot = await getDocs(q);
      const existingSurgeries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar por códigos CBHPM idênticos
      const similarSurgeries = existingSurgeries.filter(existing => {
        if (!existing.cbhpmProcedures || !surgeryData.cbhpmProcedures) {
          return false;
        }

        const existingCodes = existing.cbhpmProcedures
          .map(p => p.codigo)
          .sort();
        const newCodes = surgeryData.cbhpmProcedures
          .map(p => p.codigo)
          .sort();

        return existingCodes.length === newCodes.length &&
               existingCodes.every((code, index) => code === newCodes[index]);
      });

      return similarSurgeries;
    } catch (error) {
      throw new Error('Erro ao verificar cirurgias similares: ' + error.message);
    }
  },

  // Criar cirurgia
  async createSurgery(patientId, surgeryData, currentUserId) {
    try {
      const surgeriesRef = collection(db, `patients/${patientId}/surgeries`);
      const docRef = await addDoc(surgeriesRef, {
        ...surgeryData,
        patientId,
        status: 'Agendada',
        metadata: {
          createdAt: new Date(),
          createdBy: currentUserId
        }
      });
      
      return {
        id: docRef.id,
        ...surgeryData,
        patientId,
        status: 'Agendada',
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: currentUserId
        }
      };
    } catch (error) {
      throw new Error('Erro ao criar cirurgia: ' + error.message);
    }
  }
};
```

### 3. Hooks Customizados

#### useAuth Hook:
```javascript
// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### 4. Migrando Componentes

#### Exemplo: PatientForm migrado
```javascript
// Substitua a função mockada:
const checkForDuplicates = async (data) => {
  // Mock code...
};

// Por:
import { patientService } from '../services/patientService';
import { useAuth } from '../hooks/useAuth';

const PatientForm = ({ onPatientSelected }) => {
  const { currentUser } = useAuth();
  
  // ... outros estados

  const checkForDuplicates = async (data) => {
    try {
      return await patientService.checkDuplicates(data);
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      throw error;
    }
  };

  const createNewPatient = async () => {
    try {
      const newPatient = await patientService.createPatient(
        patientData, 
        currentUser.uid
      );
      onPatientSelected(newPatient);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      // Tratar erro na UI
    }
  };

  // ... resto do componente
};
```

---

## 🚀 Implementação e Deploy

### 1. Estrutura do Projeto
```
anesthesia-system/
├── public/
├── src/
│   ├── components/
│   │   ├── base/
│   │   ├── variations/
│   │   └── lists/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── contexts/
│   ├── utils/
│   └── firebase/
├── package.json
└── README.md
```

### 2. Scripts Package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "firebase deploy"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "firebase": "^10.0.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.0.0",
    "vite": "^4.0.0"
  }
}
```

### 3. Deploy Firebase Hosting
```bash
# Instalar CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

---

## 🗺️ Roadmap

### Fase 1: MVP (Concluído)
- ✅ Componentes base reutilizáveis
- ✅ Página Nova Anestesia funcional
- ✅ Sistema de duplicatas e validações
- ✅ Compartilhamento básico

### Fase 2: Funcionalidades Core
- [ ] Migração completa para Firebase
- [ ] Sistema de autenticação
- [ ] Todas as páginas de criação
- [ ] Formulários específicos (anestesia, pré-anestésica, SRPA)

### Fase 3: Funcionalidades Avançadas
- [ ] Páginas de listagem completas
- [ ] Sistema de busca avançada
- [ ] Relatórios e estatísticas
- [ ] Notificações

### Fase 4: Melhorias
- [ ] App mobile (PWA)
- [ ] Integração com sistemas hospitalares
- [ ] Backup e sincronização offline
- [ ] Auditoria e logs

---

## 📝 Notas Importantes

### Segurança
- Implementar regras de segurança no Firestore
- Validação de dados no backend
- Controle de acesso por usuário

### Performance
- Paginação em todas as listas
- Lazy loading de componentes
- Cache de dados frequentes

### UX/UI
- Loading states em todas as ações
- Error boundaries para captura de erros
- Feedback visual consistente

### Manutenibilidade
- Testes unitários para componentes
- Documentação de APIs
- Versionamento semântico

---

**Este documento serve como guia completo para implementação e manutenção do sistema. Mantenha-o atualizado conforme o projeto evolui.**