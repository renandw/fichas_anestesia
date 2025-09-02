# SWR Implementation Guide - Anesthesia Details

Este guia explica como implementar **SWR** para gerenciar dados da ficha de anestesia.

## Instalação e Setup

### 1. Instalar dependência
```bash
npm install swr
# ou
yarn add swr
```

### 2. Configurar SWR Provider Global
```javascript
// src/App.js ou src/main.js
import { SWRConfig } from 'swr';

const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  refreshInterval: 0,
  loadingTimeout: 10000,
  focusThrottleInterval: 5000,

  fetcher: async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error('Erro na requisição');
      error.status = res.status;
      error.info = res.statusText;
      throw error;
    }
    return res.json();
  },

  onError: (error, key) => {
    console.error('SWR Error:', key, error);
  },

  onLoadingSlow: (key) => {
    console.warn('⚠️ Requisição lenta:', key);
  },

  shouldRetryOnError: (error) => {
    if ([401, 403, 404].includes(error.status)) return false;
    return true;
  },
};

function App() {
  return (
    <SWRConfig value={swrConfig}>
      {/* resto da aplicação */}
    </SWRConfig>
  );
}
```

## Custom Hooks para Dados

### Hook para dados do paciente
```javascript
// src/hooks/usePatientData.js
import useSWR from 'swr';
import { getPatient } from '../services/patientService';

export const usePatientData = (patientId) => {
  const { data, error, isLoading, mutate } = useSWR(
    patientId ? ['patient', patientId] : null,
    () => getPatient(patientId),
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );

  return { patient: data, isLoading, isError: error, mutatePatient: mutate };
};
```

### Hook para dados da cirurgia
```javascript
// src/hooks/useSurgeryData.js
import useSWR from 'swr';
import { getSurgery } from '../services/surgeryService';

export const useSurgeryData = (patientId, surgeryId) => {
  const { data, error, isLoading, mutate } = useSWR(
    patientId && surgeryId ? ['surgery', patientId, surgeryId] : null,
    () => getSurgery(patientId, surgeryId),
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );

  return { surgery: data, isLoading, isError: error, mutateSurgery: mutate };
};
```

### Hook para dados da anestesia
```javascript
// src/hooks/useAnesthesiaData.js
import useSWR from 'swr';
import { getSurgeryAnesthesia } from '../services/anesthesiaService';

export const useAnesthesiaData = (patientId, surgeryId) => {
  const { data, error, isLoading, mutate } = useSWR(
    patientId && surgeryId ? ['anesthesia', patientId, surgeryId] : null,
    () => getSurgeryAnesthesia(patientId, surgeryId),
    { revalidateOnFocus: true, dedupingInterval: 15000 }
  );

  return { anesthesia: data, isLoading, isError: error, mutateAnesthesia: mutate };
};
```

### Hook para pré-anestesia
```javascript
// src/hooks/usePreAnesthesiaData.js
import useSWR from 'swr';
import { getSurgeryPreAnesthesia } from '../services/anesthesiaService';

export const usePreAnesthesiaData = (patientId, surgeryId) => {
  const { data, error, isLoading, mutate } = useSWR(
    patientId && surgeryId ? ['preanesthesia', patientId, surgeryId] : null,
    () => getSurgeryPreAnesthesia(patientId, surgeryId),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  return { preAnesthesia: data, isLoading, isError: error, mutatePreAnesthesia: mutate };
};
```

## Hook Combinado para Sessão Completa

```javascript
// src/hooks/useAnesthesiaSession.js
import { usePatientData } from './usePatientData';
import { useSurgeryData } from './useSurgeryData';
import { useAnesthesiaData } from './useAnesthesiaData';
import { usePreAnesthesiaData } from './usePreAnesthesiaData';

export const useAnesthesiaSession = (patientId, surgeryId) => {
  const patientQ = usePatientData(patientId);
  const surgeryQ = useSurgeryData(patientId, surgeryId);
  const anesthesiaQ = useAnesthesiaData(patientId, surgeryId);
  const preQ = usePreAnesthesiaData(patientId, surgeryId);

  const isLoading = patientQ.isLoading || surgeryQ.isLoading || anesthesiaQ.isLoading || preQ.isLoading;
  const hasError = patientQ.isError || surgeryQ.isError || anesthesiaQ.isError || preQ.isError;

  const revalidateAll = () => {
    patientQ.mutatePatient();
    surgeryQ.mutateSurgery();
    anesthesiaQ.mutateAnesthesia();
    preQ.mutatePreAnesthesia();
  };

  const revalidateSpecific = (types) => {
    if (types.includes('patient')) patientQ.mutatePatient();
    if (types.includes('surgery')) surgeryQ.mutateSurgery();
    if (types.includes('anesthesia')) anesthesiaQ.mutateAnesthesia();
    if (types.includes('preanesthesia')) preQ.mutatePreAnesthesia();
  };

  return {
    patient: patientQ.patient,
    surgery: surgeryQ.surgery,
    anesthesia: anesthesiaQ.anesthesia,
    preAnesthesia: preQ.preAnesthesia,
    isLoading,
    hasError,
    revalidateAll,
    revalidateSpecific,
  };
};
```

## Hook para Mutações (Updates)

```javascript
// src/hooks/useAnesthesiaMutations.js
import { useSWRConfig } from 'swr';
import { updatePatient } from '../services/patientService';
import { updateSurgery } from '../services/surgeryService';
import { updateAnesthesia } from '../services/anesthesiaService';

export const useAnesthesiaMutations = (patientId, surgeryId) => {
  const { mutate } = useSWRConfig();

  const updatePatientData = (updates) =>
    mutate(['patient', patientId], updatePatient(patientId, updates), {
      optimisticData: (c) => ({ ...(c || {}), ...updates }),
      rollbackOnError: true,
      revalidate: true,
    });

  const updateSurgeryData = (updates) =>
    mutate(['surgery', patientId, surgeryId], updateSurgery(patientId, surgeryId, updates), {
      optimisticData: (c) => ({ ...(c || {}), ...updates }),
      rollbackOnError: true,
      revalidate: true,
    }).then((res) => {
      if (updates.status) mutate(['anesthesia', patientId, surgeryId]);
      return res;
    });

  const updateAnesthesiaData = (anesthesia, updates) => {
    if (!anesthesia?.id) throw new Error('ID da anestesia não encontrado');
    return mutate(['anesthesia', patientId, surgeryId], updateAnesthesia(patientId, surgeryId, anesthesia.id, updates), {
      optimisticData: (c) => ({ ...(c || {}), ...updates }),
      rollbackOnError: true,
      revalidate: true,
    }).then((res) => {
      if (updates.status) mutate(['surgery', patientId, surgeryId]);
      return res;
    });
  };

  return { updatePatientData, updateSurgeryData, updateAnesthesiaData };
};
```

## Refatoração do AnesthesiaDetails

```javascript
// AnesthesiaDetails.js (versão SWR)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnesthesiaSession } from '../hooks/useAnesthesiaSession';
import { useAnesthesiaMutations } from '../hooks/useAnesthesiaMutations';

const AnesthesiaDetails = () => {
  const { patientId, surgeryId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('identification');

  // SWR hooks substituem todo o estado anterior
  const {
    patient,
    surgery,
    anesthesia,
    preAnesthesia,
    isLoading,
    hasError,
    revalidateAll,
    revalidateSpecific,
  } = useAnesthesiaSession(patientId, surgeryId);

  // Mutations substituem handlers de update anteriores
  const {
    updatePatientData,
    updateSurgeryData,
    updateAnesthesiaData,
  } = useAnesthesiaMutations(patientId, surgeryId);

  // Redirect se não autenticado
  useEffect(() => {
    if (!isAuthenticated) navigate('/signin');
  }, [isAuthenticated, navigate]);

  // Handler para mudanças de status
  const handleStatusChange = async (entityType, newStatus) => {
    const updates = { 
      status: newStatus,
      ...(newStatus === 'Concluída' && entityType === 'anesthesia' && {
        anesthesiaTimeEnd: new Date().toLocaleTimeString('pt-BR', { hour12: false })
      })
    };
    
    try {
      if (entityType === 'anesthesia') {
        await updateAnesthesiaData(anesthesia, updates);
      } else if (entityType === 'surgery') {
        await updateSurgeryData(updates);
      }
      
      // SWR já revalida automaticamente
      if (newStatus === 'Concluída') {
        revalidateAll();
      }
    } catch (error) {
      console.error(`Erro ao alterar status de ${entityType}:`, error);
    }
  };

  // Smart refresh na troca de abas
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    
    // Dados que cada aba precisa estar frescos
    const tabDependencies = {
      'identification': ['patient', 'surgery', 'anesthesia'],
      'preanesthesia': ['preanesthesia'],
      'medications': ['anesthesia'],
      'vitalsigns': ['anesthesia'],
      'evolution': ['anesthesia'],
      'preview': ['patient', 'surgery', 'anesthesia', 'preanesthesia']
    };
    
    const dependencies = tabDependencies[newTab];
    if (dependencies) {
      revalidateSpecific(dependencies);
    }
  };

  // States de loading/error
  if (!isAuthenticated) return <div>Redirecionando...</div>;
  if (isLoading) return <LoadingScreen />;
  if (hasError) return <ErrorScreen onRetry={revalidateAll} />;

  // Props padronizadas para componentes
  const standardProps = {
    patient,
    surgery,
    anesthesia,
    preAnesthesia,
    onPatientUpdate: updatePatientData,
    onSurgeryUpdate: updateSurgeryData,
    onAnesthesiaUpdate: (updates) => updateAnesthesiaData(anesthesia, updates),
    onStatusChange: handleStatusChange,
    onRefresh: revalidateAll,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status badge agora sempre atualizado automaticamente */}
      <span className={`badge ${getStatusClass(anesthesia?.status)}`}>
        {anesthesia?.status || 'Não iniciada'}
      </span>

      {/* Tabs com handler atualizado */}
      <TabBar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      {/* Componentes recebem props padronizadas */}
      <ActiveComponent {...standardProps} />
    </div>
  );
};

export default AnesthesiaDetails;
```

## Componentes com SWR

### VitalSignsSection com polling condicional
```javascript
// VitalSignsSection.js
import useSWR from 'swr';
import { useState, useEffect } from 'react';

const VitalSignsSection = ({ patientId, surgeryId, isActive = false }) => {
  const [shouldPoll, setShouldPoll] = useState(false);

  useEffect(() => {
    setShouldPoll(isActive);
  }, [isActive]);

  const { data: vitalSigns, mutate } = useSWR(
    ['vitalsigns', patientId, surgeryId],
    () => getVitalSigns(patientId, surgeryId),
    {
      refreshInterval: shouldPoll ? 30000 : 0, // Polling apenas se ativo
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const updateVitalSigns = (newData) =>
    mutate(saveVitalSigns(patientId, surgeryId, newData), {
      optimisticData: newData,
      rollbackOnError: true,
    });

  // Resto do componente...
};
```

### AnesthesiaPreview integrado
```javascript
// AnesthesiaPreview.js
const AnesthesiaPreview = ({ 
  patient, 
  surgery, 
  anesthesia,
  onAnesthesiaUpdate,
  onSurgeryUpdate,
}) => {
  const handleFinalize = async () => {
    try {
      await onAnesthesiaUpdate({ status: 'Concluída' });
      await onSurgeryUpdate({ status: 'Concluída' });
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    }
  };

  // Status badges automaticamente atualizados via props do SWR
  return (
    <PreviewWrapper onFinalize={handleFinalize}>
      {/* Dados sempre frescos */}
    </PreviewWrapper>
  );
};
```

## Benefícios da Implementação

### Cache Inteligente
- Dados compartilhados entre componentes automaticamente
- Deduplicação de requests idênticos
- Invalidação granular por chave de cache

### Sincronização Automática
- Background updates transparentes
- Revalidação ao focar janela/trocar abas
- Reconexão automática após offline

### Optimistic Updates
- UI responsiva com updates instantâneos
- Rollback automático em caso de erro
- UX fluida mesmo com conexão lenta

### Estados Simplificados
- Loading/error states padronizados
- Menos código boilerplate
- DevTools integradas para debugging

## Checklist de Migração

1. **Instalar SWR e configurar provider global**
2. **Criar custom hooks (um por entidade)**
3. **Implementar hook de sessão combinado**
4. **Criar hook de mutações**
5. **Refatorar AnesthesiaDetails**
6. **Atualizar componentes filhos gradualmente**
7. **Remover código obsoleto (useState/useEffect para fetch)**
8. **Testar cenários críticos (offline, erro, múltiplas abas)**

Esta implementação resolve completamente o problema dos badges não atualizarem, elimina race conditions, e fornece uma base sólida para futuras funcionalidades sem complexidade excessiva.