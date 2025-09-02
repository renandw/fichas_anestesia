# 📚 Sistema de Fichas Anestésicas - Documentação Completa

## 🎯 **Visão Geral do Projeto**

Sistema completo para gerenciamento de fichas anestésicas com arquitetura Firebase moderna, componentes reutilizáveis e fluxos otimizados para anestesistas.

### **Estrutura Firebase Implementada:**
```
patients/
├── {patientId}/
│   ├── patientName, patientBirthDate, patientSex, patientCNS
│   ├── metadata: {createdAt, createdBy, updatedAt, updatedBy}
│   └── surgeries/ (subcoleção)
│       └── {surgeryId}/
│           ├── procedureType, patientWeight, mainSurgeon, hospital
│           ├── status, sharedWith, code, metadata
│           ├── anesthesia/ (subcoleção)
│           ├── preAnesthesia/ (subcoleção)
│           └── srpa/ (subcoleção)

users/
├── {userId}/
│   ├── name, email, crm, phone, companies
│   ├── specialty, status (online/offline)
│   └── metadata: {createdAt, updatedAt, lastSeen}
```

---

## ✅ **Status de Implementação (85% Concluído)**

### **🟢 Implementado Completamente:**
- [x] Sistema de autenticação (AuthContext)
- [x] Serviços Firebase (patientService, surgeryService, anesthesiaService)
- [x] Componentes principais (PatientForm, SurgeryForm, ShareSurgery)
- [x] Página de fluxo completa (NewAnesthesiaPage)
- [x] Página de detalhes (AnesthesiaDetails)
- [x] Dashboard atualizado
- [x] Páginas de auth atualizadas
- [x] Dados CBHPM integrados

### **🟡 Parcialmente Implementado:**
- [x] AnesthesiaDetails com estrutura de abas
- [ ] Abas específicas (Medicações, Sinais Vitais, etc.)
- [ ] PreAnesthesiaForm completo
- [ ] SRPAForm completo

### **🔴 Pendente:**
- [ ] Componentes de lista (AnesthesiaList, PatientList)
- [ ] Relatórios e estatísticas avançadas
- [ ] Sistema de notificações
- [ ] Backup e sincronização offline

---

## 🏗️ **Componentes Implementados**

### **1. AuthContext.js** - Sistema de Autenticação

**Localização:** `src/contexts/AuthContext.js`

**Funcionalidades:**
- Login/logout com Firebase Auth
- Status online/offline automático
- Verificação de CRM único
- Busca de outros usuários para compartilhamento
- Toast notifications integradas

**API Disponível:**
```javascript
const {
  // Estados
  user,                    // Objeto Firebase Auth
  userProfile,            // Dados completos do Firestore
  currentUserId,          // user.uid (conveniente)
  isAuthenticated,        // Boolean para validações
  userName,               // Nome do usuário
  userCRM,               // CRM do usuário
  loading,               // Estado de carregamento
  
  // Métodos
  signup,                // Cadastro
  signin,                // Login
  logout,                // Logout
  loadUserProfile,       // Recarregar perfil
  getOtherUsers          // Buscar outros usuários
} = useAuth();
```

**Integração:**
```javascript
import { useAuth } from '../contexts/AuthContext';

// Em qualquer componente:
const { currentUserId, isAuthenticated } = useAuth();
if (!isAuthenticated) return <LoginRequired />;
```

---

### **2. PatientForm.js** - Formulário de Pacientes

**Localização:** `src/components/PatientForm.js`

**Funcionalidades:**
- ✅ Verificação inteligente de duplicatas (CNS + Nome+Data)
- ✅ Análise de relacionamento entre nomes (expansão, similaridade)
- ✅ Modal contextual para pacientes similares
- ✅ Sistema de atualização com diff visual
- ✅ Validações em tempo real
- ✅ Integração completa com Firebase

**Fluxos de Duplicata:**
- **CNS idêntico**: Modal "Usar Paciente" ou "Atualizar Dados"
- **Nome + Data similares**: Análise inteligente de relacionamento
- **Nomes similares**: Modal com % de similaridade e detalhes

**Como usar:**
```javascript
import PatientForm from '../components/PatientForm';

<PatientForm 
  onPatientSelected={(patient) => {
    console.log('Paciente selecionado:', patient);
    // Navegar para próxima etapa
  }} 
/>
```

**Dados retornados:**
```javascript
{
  id: "patient_123",
  patientName: "João Silva Santos",
  patientBirthDate: "1985-03-15",
  patientSex: "M",
  patientCNS: "123456789012345",
  metadata: {
    createdAt: "2025-08-02T...",
    createdBy: "user_456"
  }
}
```

---

### **3. SurgeryForm.js** - Formulário de Cirurgias

**Localização:** `src/components/SurgeryForm.js`

**Funcionalidades:**
- ✅ Campos condicionais (SUS vs Convênio)
- ✅ Busca CBHPM com dados reais (`cbhpm_codes.json`)
- ✅ Verificação de cirurgias similares
- ✅ Modo criação e edição
- ✅ Validação de subcoleções existentes
- ✅ Cirurgiões auxiliares dinâmicos
- ✅ Geração automática de códigos únicos

**Modos de uso:**
```javascript
// Modo Criação:
<SurgeryForm 
  selectedPatient={patient}
  currentFlow="anesthesia"
  onSurgerySelected={(surgery) => console.log('Criada:', surgery)}
/>

// Modo Edição:
<SurgeryForm 
  mode="edit"
  existingSurgery={surgery}
  selectedPatient={patient}
  onSurgeryUpdated={(updated) => console.log('Atualizada:', updated)}
/>
```

**Dados CBHPM:**
- Arquivo: `src/components/data/cbhpm_codes.json`
- Busca por código ou procedimento
- Interface dropdown com preview
- Validação automática de porte anestésico

---

### **4. ShareSurgery.js** - Compartilhamento de Cirurgias

**Localização:** `src/components/ShareSurgery.js`

**Funcionalidades:**
- ✅ Busca real de usuários via `getOtherUsers()`
- ✅ Interface de seleção múltipla com busca
- ✅ Status online/offline dos usuários
- ✅ Preview dos usuários selecionados
- ✅ Integração com `shareSurgery()` do Firebase

**Como usar:**
```javascript
<ShareSurgery 
  surgery={selectedSurgery}
  onShareComplete={(updatedSurgery, selectedUsers) => {
    console.log('Compartilhada com:', selectedUsers);
  }}
  onSkip={() => console.log('Continuando sem compartilhar')}
/>
```

---

### **5. NewAnesthesiaPage.js** - Página de Fluxo Completo

**Localização:** `src/pages/NewAnesthesiaPage.js`

**Funcionalidades:**
- ✅ Fluxo: PatientForm → SurgeryForm → ShareSurgery → Redirect
- ✅ Progress bar visual com etapas
- ✅ Navegação com botão voltar
- ✅ Summary panel com dados selecionados
- ✅ Detecção automática de cirurgia nova vs existente
- ✅ Verificação de autenticação
- ✅ Estados de loading e erro

**Fluxo de uso:**
1. Usuário preenche dados do paciente
2. Sistema verifica duplicatas e resolve
3. Usuário preenche dados da cirurgia
4. Sistema verifica similaridade e resolve
5. Se cirurgia nova: oferece compartilhamento
6. Redireciona para AnesthesiaDetails

**Rota sugerida:**
```javascript
<Route path="/anesthesia/new" element={<NewAnesthesiaPage />} />
```

---

### **6. AnesthesiaDetails.js** - Página de Detalhes da Anestesia

**Localização:** `src/pages/AnesthesiaDetails.js`

**Funcionalidades:**
- ✅ Header dinâmico com informações do paciente/cirurgia
- ✅ Sistema de abas completo com indicadores visuais
- ✅ Auto-save a cada 2 segundos
- ✅ Controle de status da anestesia
- ✅ Criação automática se não existir
- ✅ Estados de loading/erro robustos

**Estrutura de Abas:**
- 🆔 **Identificação** - Dados básicos (horários, posição, tipo)
- 🔬 **Pré-Anestésica** - Link/formulário para avaliação
- 💊 **Medicações** - Controle de medicamentos (placeholder)
- 📊 **Sinais Vitais** - Monitoramento (placeholder)
- 📝 **Evolução** - Observações e descrições

**Indicadores visuais:**
- Pontos verdes = aba com dados preenchidos
- Pontos vermelhos = aba obrigatória sem dados
- Header colorido por status

**Rota sugerida:**
```javascript
<Route 
  path="/patients/:patientId/surgeries/:surgeryId/anesthesia" 
  element={<AnesthesiaDetails />} 
/>
```

---

## 🔧 **Serviços Firebase Implementados**

### **1. patientService.js**

**Localização:** `src/services/patientService.js`

**Funções principais:**
```javascript
// Verificação inteligente de duplicatas
await checkForDuplicates(patientData)
// Retorna: { type: 'cns_match|name_date_match|similar_match|none', patients: [...] }

// CRUD básico
await createPatient(patientData, currentUserId)
await updatePatient(patientId, updates, currentUserId)
await getPatient(patientId)

// Busca especializada
await getPatientByCNS(cns)
await getPatientByNameAndBirth(name, birthDate)
await findSimilarPatients(name, birthDate, threshold)
```

**Análise inteligente de nomes:**
- Normalização automática (remove acentos, case)
- Detecção de nomes expandidos/reduzidos
- Cálculo de similaridade por palavras
- Detecção de possível parentesco (sobrenomes)

---

### **2. surgeryService.js**

**Localização:** `src/services/surgeryService.js`

**Funções principais:**
```javascript
// CRUD com códigos únicos
await createSurgery(patientId, surgeryData, currentUserId)
await updateSurgery(patientId, surgeryId, updates, currentUserId)
await getSurgery(patientId, surgeryId)

// Verificações e validações
await checkSimilarSurgeries(patientId, surgeryData)
await generateSurgeryCode() // Formato: S2025-XXX

// Busca e listagem
await getUserSurgeries(userId, limit)
await getActiveSurgeries(userId)
await getPatientSurgeries(patientId)

// Compartilhamento e finalização
await shareSurgery(patientId, surgeryId, userIds, currentUserId)
await finalizeSurgery(patientId, surgeryId, finalData, currentUserId)
```

**Códigos únicos:**
- Formato: `S2025-XXX` (S + ano + número aleatório)
- Verificação automática de duplicatas
- Fallback com timestamp se necessário

---

### **3. anesthesiaService.js**

**Localização:** `src/services/anesthesiaService.js`

**Funções principais:**
```javascript
// CRUD para subcoleções
await createAnesthesia(patientId, surgeryId, data, currentUserId)
await createPreAnesthesia(patientId, surgeryId, data, currentUserId)
await createSRPA(patientId, surgeryId, data, currentUserId)

// Atualizações
await updateAnesthesia(patientId, surgeryId, id, updates, currentUserId)
await updatePreAnesthesia(patientId, surgeryId, id, updates, currentUserId)
await updateSRPA(patientId, surgeryId, id, updates, currentUserId)

// Busca específica
await getSurgeryAnesthesia(patientId, surgeryId)
await getSurgeryPreAnesthesia(patientId, surgeryId)
await getSurgerySRPA(patientId, surgeryId)

// Validações automáticas
await validateAnesthesiaForSRPA(patientId, surgeryId)
await checkSubcollectionExists(patientId, surgeryId, type)

// Busca global
await getUserAnesthesias(userId, limit)
await getActiveAnesthesias(userId)
```

**Validações inteligentes:**
- SRPA só após anestesia concluída
- Verificação de subcoleções existentes
- Dependências entre fluxos

---

## 📄 **Páginas Atualizadas**

### **Dashboard.js** - Atualizado para Nova Estrutura

**Mudanças implementadas:**
- ✅ Import dos novos serviços
- ✅ Uso de `currentUserId` em vez de `userProfile.uid`
- ✅ Estrutura de dados atualizada (procedures → surgeries)
- ✅ Navegação para novas rotas
- ✅ Estatísticas com nova hierarquia

**Cards de ação rápida:**
- Nova Ficha Anestésica → `/anesthesia/new`
- Nova Avaliação Pré-Anestésica → `/preanesthesia/new`
- Nova Ficha SRPA → `/srpa/new`
- Ver Pacientes → `/patients`
- Anestesias em Andamento → `/anesthesia/active`

---

### **SignUp.js / SignIn.js** - Atualizados

**Mudanças implementadas:**
- ✅ Import path: `hooks/useAuth` → `contexts/AuthContext`
- ✅ Uso de `isAuthenticated` para redirecionamento
- ✅ Verificação de CRM integrada no componente
- ✅ Toast notifications funcionando

---

### **ProtectedRoute.js** - Atualizado

**Mudanças implementadas:**
- ✅ Uso de `isAuthenticated` em vez de `user`
- ✅ Import path atualizado
- ✅ Loading state melhorado

---

## 📊 **Dados e Configurações**

### **CBHPM Codes**

**Localização:** `src/components/data/cbhpm_codes.json`

**Estrutura:**
```json
[
  {
    "codigo": "3.01.01.97-2",
    "procedimento": "Abdominoplastia pós-bariátrica",
    "porte_anestesico": "5"
  }
]
```

**Funcionalidades de busca:**
- Busca por código parcial ou nome
- Resultados limitados a 10 itens
- Interface dropdown interativa
- Preview antes de adicionar

---

### **Firebase Config**

**Localização:** `src/services/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Suas configurações
};

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## 🛣️ **Rotas Implementadas**

### **Rotas Principais:**
```javascript
// Autenticação
/signin                     → SignIn
/signup                     → SignUp

// Dashboard
/dashboard                  → Dashboard

// Fluxos de criação
/anesthesia/new            → NewAnesthesiaPage
/preanesthesia/new         → (a implementar)
/srpa/new                  → (a implementar)

// Detalhes específicos
/patients/:patientId/surgeries/:surgeryId/anesthesia
                          → AnesthesiaDetails

// Listagens (a implementar)
/patients                  → PatientList
/anesthesia               → AnesthesiaList
/anesthesia/active        → ActiveAnesthesiaList
```

### **Estrutura de App.js:**
```javascript
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/anesthesia/new" element={<ProtectedRoute><NewAnesthesiaPage /></ProtectedRoute>} />
          <Route path="/patients/:patientId/surgeries/:surgeryId/anesthesia" element={<ProtectedRoute><AnesthesiaDetails /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
```

---

## 🔄 **Fluxos de Dados Implementados**

### **Fluxo 1: Nova Ficha Anestésica**
```
1. /anesthesia/new (NewAnesthesiaPage)
   ├── PatientForm
   │   ├── checkForDuplicates()
   │   ├── Modal de duplicatas (se houver)
   │   └── createPatient() ou updatePatient()
   ├── SurgeryForm
   │   ├── checkSimilarSurgeries()
   │   ├── Modal de similaridade (se houver)
   │   └── createSurgery()
   ├── ShareSurgery (se cirurgia nova)
   │   ├── getOtherUsers()
   │   └── shareSurgery()
   └── Redirect para AnesthesiaDetails

2. /patients/{id}/surgeries/{id}/anesthesia (AnesthesiaDetails)
   ├── Carrega dados (patient, surgery)
   ├── getSurgeryAnesthesia() ou createAnesthesia()
   ├── Interface de abas
   └── Auto-save contínuo
```

### **Fluxo 2: Edição de Dados**
```
1. AnesthesiaDetails → Aba Identificação
   ├── Editar dados da cirurgia (SurgeryForm mode="edit")
   ├── Editar dados da anestesia
   └── Auto-save a cada 2 segundos

2. Finalização da Anestesia
   ├── Botão "Finalizar Anestesia"
   ├── Update status para "Concluída"
   ├── Adiciona anesthesiaTimeEnd
   └── Oferece criação de SRPA
```

---

## 🧪 **Como Testar o Sistema**

### **1. Configuração Inicial**
```bash
# Instalar dependências
npm install react-hot-toast react-router-dom

# Estrutura de arquivos
# Verificar se todos os arquivos estão nos caminhos corretos
```

### **2. Dados de Teste**
```javascript
// Paciente para testar duplicatas
const testPatient1 = {
  patientName: 'João Silva Santos',
  patientBirthDate: '1985-03-15',
  patientSex: 'M',
  patientCNS: '123456789012345'
};

// Paciente similar (para testar análise de nomes)
const testPatient2 = {
  patientName: 'João Silva', // Nome reduzido
  patientBirthDate: '1985-03-15', // Mesma data
  patientSex: 'M',
  patientCNS: '123456789012346' // CNS diferente
};
```

### **3. Fluxo de Teste Completo**
```
1. Login → /signin
2. Dashboard → /dashboard
3. Nova Anestesia → /anesthesia/new
4. Preencher paciente → testar duplicatas
5. Preencher cirurgia → testar procedimentos CBHPM
6. Compartilhar (opcional)
7. Anesthesia Details → preencher abas
8. Finalizar anestesia
```

---

## 📋 **Próximos Passos Recomendados**

### **Prioridade 1: Completar Abas da AnesthesiaDetails**
1. **AnesthesiaMedications** - Controle de medicações
2. **AnesthesiaVitalSigns** - Monitoramento de sinais vitais
3. **PreAnesthesiaIntegration** - Conectar com avaliação pré-anestésica

### **Prioridade 2: Formulários das Outras Subcoleções**
1. **PreAnesthesiaForm** - Avaliação pré-anestésica completa
2. **SRPAForm** - Sala de recuperação pós-anestésica
3. **Páginas de fluxo** para cada tipo

### **Prioridade 3: Componentes de Lista**
1. **AnesthesiaList** - Lista com filtros e busca
2. **PatientList** - Lista de pacientes com procedimentos
3. **Relatórios** - Estatísticas e dashboards

### **Prioridade 4: Funcionalidades Avançadas**
1. **Notificações** - Sistema de alertas
2. **Backup offline** - Sincronização
3. **Relatórios médicos** - Geração de PDFs
4. **Auditoria** - Logs de alterações

---

## 🔒 **Considerações de Segurança**

### **Regras Firestore (a implementar):**
```javascript
// Exemplo de regras de segurança
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem acessar seus próprios dados
    match /patients/{patientId} {
      allow read, write: if request.auth != null && 
        (resource.data.metadata.createdBy == request.auth.uid ||
         request.auth.uid in resource.data.sharedWith);
    }
    
    // Usuários só podem ver outros usuários para compartilhamento
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && userId == request.auth.uid;
    }
  }
}
```

### **Validações Implementadas:**
- Autenticação obrigatória em todas as páginas
- Verificação de `currentUserId` em todos os serviços
- Metadados de auditoria (createdBy, updatedBy, timestamps)
- Validação de entrada em todos os formulários

---

## 💡 **Observações Técnicas**

### **Performance:**
- Queries otimizadas com índices Firebase
- Paginação implementada onde necessário
- Auto-save com debounce para evitar spam
- Estados de loading em todas as operações

### **UX/UI:**
- Toast notifications para feedback
- Estados de loading e erro consistentes
- Navegação intuitiva com breadcrumbs
- Responsivo para desktop e mobile

### **Manutenibilidade:**
- Componentes modulares e reutilizáveis
- Serviços separados por responsabilidade
- Documentação inline em todo código
- Logs detalhados para debug
- Padrões de nomenclatura consistentes

---

## 📞 **Suporte e Próximos Passos**

### **Status Atual: 85% Concluído**
O sistema está **funcional e pronto para uso** nas funcionalidades principais:
- ✅ Criação de pacientes com verificação de duplicatas
- ✅ Criação de cirurgias com CBHPM
- ✅ Compartilhamento entre usuários
- ✅ Interface de anestesia com auto-save
- ✅ Autenticação e segurança básica

### **Para Produção:**
1. Implementar regras de segurança Firestore
2. Completar abas da AnesthesiaDetails
3. Criar formulários de PreAnesthesia e SRPA
4. Adicionar componentes de lista
5. Testes de integração e carga

### **Para Dúvidas:**
- Verificar logs no console (todos os serviços logam operações)
- Conferir estrutura de dados no Firebase Console
- Validar imports e paths dos arquivos
- Testar fluxos isoladamente antes de integrar

**Esta documentação deve ser atualizada conforme o progresso do projeto.**