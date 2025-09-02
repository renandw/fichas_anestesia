📋 Documentação: Compartilhamento de Cirurgias e Detecção de Duplicatas
📖 Índice

Compartilhamento Atual
Problema Identificado
Solução Proposta
Base de Dados Atual
Implementação Necessária
Cronograma de Implementação


🔄 Compartilhamento Atual
Como Funciona Hoje:
Arquitetura de Dados:
javascriptFirebase Structure:
patients/
├── patient-id/
    ├── patientName: "João Silva"
    ├── patientCNS: "12345678901234"
    ├── metadata: { createdBy: "user-A" }
    └── surgeries/
        └── surgery-id/
            ├── procedimento: "Apendicectomia"
            ├── hospital: "Hospital X"
            ├── status: "Em andamento"
            ├── sharedWith: ["user-B", "user-C"]  // ← Compartilhamento
            ├── metadata: { createdBy: "user-A" }
            └── subcollections/
                ├── anesthesia/
                ├── preAnesthesia/
                └── srpa/
Fluxo de Compartilhamento:

Usuário A cria cirurgia
Sistema oferece compartilhamento via ShareSurgery.jsx
Usuário A seleciona colaboradores
Firebase atualiza surgery.sharedWith: ["user-B"]
Usuário B vê cirurgia em getUserSurgeries()

Componentes Envolvidos:

ShareSurgery.jsx - Interface de seleção de usuários
shareSurgery() - Serviço Firebase para compartilhamento
getUserSurgeries() - Busca cirurgias próprias + compartilhadas
getPatientSurgeries() - Lista cirurgias de um paciente específico


⚠️ Problema Identificado
Cenário Problema:
09:00 - Usuário A (Anestesista 1):
├── Cria "João Silva" (CNS: 123456789)
├── Cria "Cirurgia Apendicectomia" 
└── Preenche pré-anestésica ✅

10:30 - Usuário B (Anestesista 2):
├── Tenta criar "João Silva" (mesmo CNS!)
├── Sistema NÃO detecta duplicata
├── Cria paciente duplicado
├── Cria "Cirurgia Apendicectomia" duplicada
└── Preenche anestesia na cirurgia ERRADA ❌
Consequências:

Fragmentação de Dados:

2 registros do mesmo paciente físico
2 cirurgias para o mesmo procedimento
Subcoleções espalhadas entre cirurgias diferentes


Perda de Continuidade:

Pré-anestésica fica isolada na cirurgia do Usuário A
Anestesia fica isolada na cirurgia do Usuário B
Impossível ter visão completa do cuidado


Experiência Confusa:

Usuário B não vê dados da pré-anestésica
Usuário A não vê dados da anestesia
Relatórios fragmentados



Problemas Técnicos:
javascript// patientService.js - Verificação atual
getPatientByCNS(cns, uid) {
  // ❌ Só encontra paciente se user criou OU paciente foi compartilhado
  // ❌ Não verifica se user tem acesso via cirurgias compartilhadas
  // ❌ Permite criação de pacientes duplicados
}

// surgeryService.js - Detecção atual  
checkSimilarSurgeries(patientId, surgeryData) {
  // ❌ Só compara procedimento + hospital
  // ❌ Não considera período temporal
  // ❌ Não filtra por status ativo
}

✅ Solução Proposta
Abordagem: Detecção Inteligente + Colaboração Automática
Fluxo Ideal:
10:30 - Usuário B tenta criar cirurgia:
├── Sistema detecta: "João Silva" + "Apendicectomia" + "Hospital X" + "Hoje"
├── Modal: "Cirurgia similar em andamento detectada"
├── Usuário B escolhe: "Trabalhar na cirurgia existente"
├── Sistema: Compartilhamento automático
├── Usuário B acessa a cirurgia do Usuário A
└── Preenche anestesia na cirurgia CORRETA ✅
Critérios de Detecção:
javascriptconst isMesmaCirurgia = {
  paciente: 'mesmo CNS',
  procedimento: 'mesmo tipo/código',
  hospital: 'mesmo local',
  período: 'mesmo dia (24h)',
  status: 'não concluída'
};
Tipos de Compartilhamento:
1. Compartilhamento Manual (atual):

Usuário escolhe colaboradores via ShareSurgery
Controle total sobre privacidade

2. Compartilhamento Contextual (novo):

Sistema detecta trabalho colaborativo
Compartilhamento automático quando aceita "trabalhar juntos"
Baseado em contexto médico real


🗄️ Base de Dados Atual
Serviços (Backend):
javascript📁 services/
├── patientService.js
│   ├── ✅ checkForDuplicates() - detecta pacientes duplicados
│   ├── ✅ getPatientByCNS() - busca por CNS
│   ├── ✅ createPatient() - cria paciente
│   ├── ✅ updatePatient() - atualiza paciente
│   └── ⚠️ PROBLEMA: não verifica acesso via cirurgias compartilhadas
│
├── surgeryService.js
│   ├── ✅ checkSimilarSurgeries() - detecta cirurgias similares (básico)
│   ├── ✅ createSurgery() - cria cirurgia
│   ├── ✅ shareSurgery() - compartilha cirurgia
│   ├── ✅ getUserSurgeries() - busca cirurgias do usuário
│   └── ⚠️ MELHORIA: critérios de detecção mais inteligentes
│
└── anesthesiaService.js
    ├── ✅ checkSubcollectionExists() - verifica subcoleções
    ├── ✅ getSurgeryAnesthesia() - busca anestesia
    ├── ✅ getSurgeryPreAnesthesia() - busca pré-anestésica  
    └── ✅ getSurgerySRPA() - busca SRPA
Componentes (Frontend):
javascript📁 components/
├── PatientForm.jsx
│   ├── ✅ Detecta duplicatas de pacientes
│   ├── ✅ Modal de duplicatas com opções
│   └── ✅ Integração com patientService
│
├── SurgeryForm/
│   ├── SurgeryForm.jsx - ✅ Orquestrador
│   ├── SurgeryFormCreator.jsx 
│   │   ├── ✅ Usa checkSimilarSurgeries()
│   │   ├── ✅ Modal de cirurgia similar
│   │   ├── ✅ handleSelectExisting()
│   │   └── ⚠️ MELHORIA: compartilhamento automático
│   └── SurgeryFormFields.jsx - ✅ Campos do formulário
│
├── ShareSurgery.jsx
│   ├── ✅ Interface de seleção de usuários
│   ├── ✅ Integração com Firebase
│   └── ✅ Lista usuários online/offline
│
└── PatientDetails.jsx
    ├── ✅ Lista cirurgias do paciente
    ├── ✅ Botões de ação por cirurgia
    └── ✅ Integração com subcoleções
Contextos:
javascript📁 contexts/
└── AuthContext.js
    ├── ✅ getOtherUsers() - busca outros usuários
    ├── ✅ Status online/offline
    └── ✅ Dados do usuário atual

🔧 Implementação Necessária
Fase 1: Melhorar Detecção de Cirurgias Similares
1.1 Aprimorar checkSimilarSurgeries():
javascript// surgeryService.js - Melhorias necessárias
export const checkSimilarSurgeries = async (patientId, surgeryData) => {
  // ✅ ADICIONAR: Filtro por status ativo
  where('status', 'in', ['Agendada', 'Em andamento'])
  
  // ✅ ADICIONAR: Verificação temporal
  const isWithinSamePeriod = (date1, date2, hours = 24) => {
    // Lógica de período de 24h
  }
  
  // ✅ MELHORAR: Critérios de similaridade
  // - Mesmo procedimento (SUS: proposedSurgery, Convênio: CBHPM)
  // - Mesmo hospital  
  // - Período próximo (24h)
  // - Status não concluído
}
1.2 Melhorar Modal de Detecção:
javascript// SurgeryFormCreator.jsx - Melhorias no modal
// ✅ ADICIONAR: Mostrar progresso das subcoleções
// ✅ ADICIONAR: Informações do criador
// ✅ ADICIONAR: Status temporal (criada há X horas)
// ✅ MELHORAR: UX de decisão (trabalhar juntos vs criar nova)
Fase 2: Implementar Colaboração Automática
2.1 Compartilhamento Contextual:
javascript// SurgeryFormCreator.jsx - handleSelectExisting()
const handleSelectExisting = async (surgery) => {
  // ✅ IMPLEMENTAR: Compartilhamento automático
  const currentSharedWith = surgery.sharedWith || [];
  if (!currentSharedWith.includes(currentUserId)) {
    await updateSurgery(patientId, surgery.id, {
      sharedWith: [...currentSharedWith, currentUserId]
    });
  }
  
  // ✅ IMPLEMENTAR: Notificação ao criador original
  await notifyUser(surgery.createdBy, {
    type: 'collaboration_started',
    message: `${userName} se juntou à cirurgia ${surgery.code}`
  });
}
2.2 Melhorar Detecção de Acesso:
javascript// patientService.js - Modificações necessárias
// ✅ IMPLEMENTAR: hasAccessViaSurgeries()
const hasAccessViaSurgeries = async (patientId, userId) => {
  // Verificar se usuário tem acesso via cirurgias compartilhadas
}

// ✅ MODIFICAR: getPatientByCNS(), findSimilarPatients()
// Incluir verificação de acesso via cirurgias compartilhadas
Fase 3: Melhorar Interface de Usuário
3.1 Indicadores de Colaboração:
javascript// PatientDetails.jsx - Melhorias visuais
// ✅ ADICIONAR: Indicador de cirurgia compartilhada
// ✅ ADICIONAR: Lista de colaboradores
// ✅ ADICIONAR: Status de progresso colaborativo
3.2 Notificações:
javascript// ✅ IMPLEMENTAR: Sistema de notificações
// - Quando alguém se junta à cirurgia
// - Quando subcoleção é preenchida por colaborador
// - Quando cirurgia é finalizada
Fase 4: Otimizações e Testes
4.1 Performance:
javascript// ✅ IMPLEMENTAR: Cache de verificações
// ✅ OTIMIZAR: Queries Firebase (índices)
// ✅ IMPLEMENTAR: Debounce em verificações
4.2 Casos Edge:
javascript// ✅ TRATAR: Múltiplas cirurgias similares
// ✅ TRATAR: Conflitos de dados
// ✅ TRATAR: Cirurgias pausadas/canceladas
// ✅ TRATAR: Falsos positivos

📅 Cronograma de Implementação
Sprint 1 (1-2 semanas): Detecção Melhorada

 Melhorar checkSimilarSurgeries() com critérios temporais
 Aprimorar modal de cirurgia similar
 Testes básicos de detecção

Sprint 2 (1-2 semanas): Colaboração Automática

 Implementar compartilhamento automático
 Modificar patientService para acesso via cirurgias
 Testes de fluxo colaborativo

Sprint 3 (1 semana): Interface e UX

 Indicadores visuais de colaboração
 Notificações básicas
 Testes de usabilidade

Sprint 4 (1 semana): Polimento e Testes

 Casos edge e tratamento de erros
 Otimizações de performance
 Testes finais e documentação


🎯 Objetivos de Sucesso
Critérios de Aceitação:
✅ Detecção Eficaz:

Sistema detecta 95%+ das cirurgias similares em contexto real
Zero falsos negativos em testes controlados
Máximo 5% de falsos positivos aceitáveis

✅ Colaboração Fluida:

Usuário B consegue trabalhar na cirurgia do Usuário A em ≤3 cliques
Compartilhamento automático funciona sem erros
Dados de subcoleções ficam na cirurgia correta

✅ Continuidade do Cuidado:

Pré-anestésica + Anestesia + SRPA na mesma cirurgia
Histórico médico unificado por paciente
Relatórios completos e consistentes

✅ Experiência do Usuário:

Modal claro e informativo
Decisão simples: "Trabalhar Juntos" vs "Criar Nova"
Feedback visual do progresso colaborativo


📝 Última Atualização: 06 de agosto de 2025