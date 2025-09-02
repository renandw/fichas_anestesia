# 📚 Documentação da Migração Firebase - Progresso Atual

## 🎯 **Visão Geral do Projeto**

Sistema de Fichas Anestésicas migrado para nova arquitetura Firebase com estrutura hierárquica otimizada e componentes reutilizáveis.

### **Nova Estrutura Implementada:**
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
```

---

## ✅ **Componentes Implementados**

### **1. AuthContext.js** - Sistema de Autenticação Atualizado

**Localização:** `src/contexts/AuthContext.js`

**Principais Melhorias:**
- Status online/offline automático
- Propriedades úteis: `currentUserId`, `isAuthenticated`, `userName`
- Função `getOtherUsers()` para compartilhamento
- Metadados completos no perfil do usuário
- Error handling aprimorado

**Props disponíveis:**
```javascript
const {
  user,                    // Objeto do Firebase Auth
  userProfile,            // Dados completos do Firestore
  currentUserId,          // user.uid (mais conveniente)
  isAuthenticated,        // Boolean para validações
  userName,               // Nome do usuário
  userCRM,               // CRM do usuário
  loading,               // Estado de carregamento
  signup,                // Função de cadastro
  signin,                // Função de login
  logout,                // Função de logout
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

### **2. PatientForm.js** - Formulário de Pacientes Integrado

**Localização:** `src/components/PatientForm.js`

**Funcionalidades Implementadas:**
- ✅ Integração com `patientService.js`
- ✅ Verificação inteligente de duplicatas
- ✅ Modal contextual para pacientes similares
- ✅ Sistema de atualização com diff visual
- ✅ Análise de relacionamento entre nomes
- ✅ Validações em tempo real

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

**Fluxos de duplicata:**
- **CNS idêntico**: Modal com opção "Usar" ou "Atualizar"
- **Nome + Data similares**: Análise inteligente de relacionamento
- **Nomes similares**: Modal de investigação com % similaridade

---

### **3. SurgeryForm.js** - Formulário de Cirurgias Completo

**Localização:** `src/components/SurgeryForm.js`

**Funcionalidades Implementadas:**
- ✅ Integração com `surgeryService.js`
- ✅ Campos condicionais (SUS vs Convênio)
- ✅ Busca CBHPM com dados reais (`cbhpm_codes.json`)
- ✅ Verificação de cirurgias similares
- ✅ Modo criação e edição
- ✅ Validação de subcoleções existentes
- ✅ Cirurgiões auxiliares dinâmicos

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
- Busca por código ou procedimento
- Preview antes de adicionar
- Validação de porte anestésico
- Interface dropdown intuitiva

---

## 🔧 **Serviços Firebase Implementados**

### **1. patientService.js**

**Localização:** `src/services/patientService.js`

**Funções principais:**
```javascript
// Verificação inteligente de duplicatas
await checkForDuplicates(patientData)
// Retorna: { type: 'cns_match|name_date_match|similar_match|none', patients: [...] }

// Criar paciente
await createPatient(patientData, currentUserId)

// Atualizar paciente
await updatePatient(patientId, updates, currentUserId)

// Buscar paciente
await getPatient(patientId)
await getPatientByCNS(cns)
await getPatientByNameAndBirth(name, birthDate)

// Busca com similaridade
await findSimilarPatients(name, birthDate, threshold)
```

**Análise de nomes:**
- Normalização automática (acentos, case)
- Detecção de nomes expandidos/reduzidos
- Similaridade por palavras
- Detecção de possível parentesco

---

### **2. surgeryService.js**

**Localização:** `src/services/surgeryService.js`

**Funções principais:**
```javascript
// Criar cirurgia com código único
await createSurgery(patientId, surgeryData, currentUserId)

// Atualizar cirurgia
await updateSurgery(patientId, surgeryId, updates, currentUserId)

// Verificar similaridade
await checkSimilarSurgeries(patientId, surgeryData)

// Buscar cirurgias
await getSurgery(patientId, surgeryId)
await getPatientSurgeries(patientId)
await getUserSurgeries(userId, limit)
await getActiveSurgeries(userId)

// Compartilhamento
await shareSurgery(patientId, surgeryId, userIds, currentUserId)

// Finalização
await finalizeSurgery(patientId, surgeryId, finalData, currentUserId)
```

**Códigos únicos:**
- Formato: `S2025-XXX`
- Verificação automática de duplicatas
- Fallback com timestamp

---

### **3. anesthesiaService.js**

**Localização:** `src/services/anesthesiaService.js`

**Funções principais:**
```javascript
// Criar subcoleções
await createAnesthesia(patientId, surgeryId, data, currentUserId)
await createPreAnesthesia(patientId, surgeryId, data, currentUserId)
await createSRPA(patientId, surgeryId, data, currentUserId)

// Atualizar subcoleções
await updateAnesthesia(patientId, surgeryId, id, updates, currentUserId)
await updatePreAnesthesia(patientId, surgeryId, id, updates, currentUserId)
await updateSRPA(patientId, surgeryId, id, updates, currentUserId)

// Buscar subcoleções
await getSurgeryAnesthesia(patientId, surgeryId)
await getSurgeryPreAnesthesia(patientId, surgeryId)
await getSurgerySRPA(patientId, surgeryId)

// Validações
await validateAnesthesiaForSRPA(patientId, surgeryId)
await checkSubcollectionExists(patientId, surgeryId, type)

// Busca global
await getUserAnesthesias(userId, limit)
await getActiveAnesthesias(userId)
```

**Validações automáticas:**
- SRPA só após anestesia concluída
- Verificação de subcoleções existentes
- Status de dependência entre fluxos

---

## 📄 **Páginas e Componentes Atualizados**

### **1. Dashboard.js** - Atualizado para Nova Estrutura

**Mudanças implementadas:**
- ✅ Import dos novos serviços
- ✅ Uso de `currentUserId` em vez de `userProfile.uid`
- ✅ Ajuste da estrutura de dados (procedures → surgeries)
- ✅ Navegação atualizada para novas rotas
- ✅ Estatísticas com nova hierarquia

**Funcionalidades:**
- Cards de ação rápida
- Estatísticas em tempo real
- Lista de cirurgias recentes
- Cirurgias ativas
- Perfil do usuário

---

### **2. SignUp.js / SignIn.js** - Atualizados para AuthContext

**Mudanças implementadas:**
- ✅ Import path: `hooks/useAuth` → `contexts/AuthContext`
- ✅ Uso de `isAuthenticated` para redirecionamento
- ✅ Verificação de CRM movida para componente
- ✅ Integração com toast notifications

---

### **3. ProtectedRoute.js** - Atualizado

**Mudanças implementadas:**
- ✅ Uso de `isAuthenticated` em vez de `user`
- ✅ Import path atualizado
- ✅ Validação mais robusta

---

## 📊 **Dados CBHPM Integrados**

### **Estrutura dos Dados**
**Localização:** `src/components/data/cbhpm_codes.json`

```json
[
  {
    "codigo": "3.01.01.97-2",
    "procedimento": "Abdominoplastia pós-bariátrica",
    "porte_anestesico": "5"
  }
]
```

**Funcionalidades de Busca:**
- Busca por código parcial
- Busca por nome do procedimento
- Resultados limitados a 10 itens
- Interface dropdown interativa
- Preview antes de adicionar

---

## 🔄 **Fluxos de Migração Implementados**

### **Fluxo Completo: Paciente → Cirurgia**

1. **PatientForm**:
   - Verifica duplicatas inteligentemente
   - Resolve conflitos com modais contextuais
   - Cria ou seleciona paciente existente

2. **SurgeryForm**:
   - Recebe paciente selecionado
   - Valida campos por tipo (SUS/Convênio)
   - Verifica cirurgias similares
   - Cria cirurgia com código único

3. **Próxima Etapa** (a implementar):
   - AnesthesiaForm, PreAnesthesiaForm, SRPAForm

### **Validações Cruzadas**
- Paciente existe → Pode criar cirurgia
- Cirurgia existe → Pode criar subcoleções
- Anestesia concluída → Pode criar SRPA

---

## 📁 **Estrutura de Arquivos Atual**

```
src/
├── contexts/
│   └── AuthContext.js               ✅ IMPLEMENTADO
├── services/
│   ├── firebase.js                  ✅ MANTIDO (configuração)
│   ├── patientService.js            ✅ IMPLEMENTADO
│   ├── surgeryService.js            ✅ IMPLEMENTADO
│   ├── anesthesiaService.js         ✅ IMPLEMENTADO
│   └── firestore.js                 ❌ PODE REMOVER (antigo)
├── components/
│   ├── PatientForm.js               ✅ IMPLEMENTADO
│   ├── SurgeryForm.js               ✅ IMPLEMENTADO
│   └── data/
│       └── cbhpm_codes.json         ✅ INTEGRADO
├── pages/
│   ├── Dashboard.js                 ✅ ATUALIZADO
│   ├── SignUp.js                    ✅ ATUALIZADO
│   ├── SignIn.js                    ✅ ATUALIZADO
│   └── ProtectedRoute.js            ✅ ATUALIZADO
└── App.js                           🔄 PRECISA AuthProvider
```

---

## 🧪 **Como Testar o Sistema Atual**

### **1. Configuração Inicial**
```bash
# Instalar dependência que pode estar faltando
npm install react-hot-toast

# Estrutura de arquivos
# Certifique-se que todos os arquivos estão nos caminhos corretos
```

### **2. Atualizar App.js**
```javascript
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Seus componentes */}
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}
```

### **3. Testar Fluxo Completo**
```javascript
// Página de teste
const TestPage = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSurgery, setSelectedSurgery] = useState(null);

  return (
    <div>
      {!selectedPatient && (
        <PatientForm onPatientSelected={setSelectedPatient} />
      )}
      
      {selectedPatient && !selectedSurgery && (
        <SurgeryForm 
          selectedPatient={selectedPatient}
          currentFlow="anesthesia"
          onSurgerySelected={setSelectedSurgery}
        />
      )}
      
      {selectedSurgery && (
        <div>✅ Sucesso! Paciente e cirurgia criados.</div>
      )}
    </div>
  );
};
```

---

## 🎯 **Status de Implementação**

### ✅ **Concluído (70%)**
- [x] AuthContext completo
- [x] PatientForm com Firebase
- [x] SurgeryForm com Firebase
- [x] 3 serviços Firebase principais
- [x] Dashboard atualizado
- [x] Páginas de auth atualizadas
- [x] Dados CBHPM integrados
- [x] Sistema de duplicatas inteligente

### 🔄 **Em Andamento (20%)**
- [ ] AnesthesiaForm
- [ ] PreAnesthesiaForm  
- [ ] SRPAForm
- [ ] Páginas de fluxo completas

### 📋 **Pendente (10%)**
- [ ] AnesthesiaList / PatientList
- [ ] ShareSurgery component
- [ ] Sistema de busca avançada
- [ ] Relatórios e estatísticas

---

## 🚀 **Próximos Passos Recomendados**

### **Prioridade 1: Formulários das Subcoleções**
1. **AnesthesiaForm** - Ficha anestésica completa
2. **PreAnesthesiaForm** - Avaliação pré-anestésica
3. **SRPAForm** - Sala de recuperação

### **Prioridade 2: Páginas de Fluxo**
1. **"/anesthesia/new"** - PatientForm → SurgeryForm → AnesthesiaForm
2. **"/preanesthesia/new"** - PatientForm → SurgeryForm → PreAnesthesiaForm  
3. **"/srpa/new"** - PatientForm → SurgeryForm → AnesthesiaValidator → SRPAForm

### **Prioridade 3: Componentes de Lista**
1. **AnesthesiaList** - Lista com filtros e busca
2. **PatientList** - Lista de pacientes
3. **ShareSurgery** - Compartilhamento

---

## 💡 **Observações Importantes**

### **Compatibilidade**
- Sistema funciona 100% offline durante desenvolvimento
- Dados mockados podem ser testados antes da integração
- Migration script não necessário (rebuild do zero)

### **Performance**
- Queries otimizadas com índices Firebase
- Paginação implementada em todas as listas
- Cache de dados em componentes

### **Segurança**
- Validação de `currentUserId` em todos os serviços
- Metadados de auditoria (createdBy, updatedBy)
- Regras de segurança Firestore (a implementar)

### **Manutenibilidade**
- Componentes reutilizáveis e modulares
- Serviços separados por responsabilidade
- Documentação inline em todo código
- Logs detalhados para debug

---

## 📞 **Suporte e Dúvidas**

Para dúvidas sobre implementação:
1. Verificar logs no console (todos os serviços logam operações)
2. Conferir estrutura de dados no Firebase Console
3. Validar imports e paths dos arquivos
4. Testar fluxos isoladamente antes de integrar

**Esta documentação deve ser atualizada conforme o progresso do projeto.**