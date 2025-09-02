import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useProcedureDetails = (patientId, procedureId) => {
  const [patient, setPatient] = useState(null);
  const [procedure, setProcedure] = useState(null);
  const [surgery, setSurgery] = useState(null);
  const [preAnesthetic, setPreAnesthetic] = useState(null);
  const [srpa, setSrpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId || !procedureId) {
      setLoading(false);
      setError('IDs do paciente ou procedimento não fornecidos');
      return;
    }

    let unsubscribePatient;
    let unsubscribeProcedure;
    let unsubscribeSurgery;
    let unsubscribePreAnesthetic;
    let unsubscribeSrpa;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Buscar dados do paciente (real-time)
        const patientRef = doc(db, 'patients', patientId);
        unsubscribePatient = onSnapshot(
          patientRef,
          (doc) => {
            if (doc.exists()) {
              setPatient({ id: doc.id, ...doc.data() });
            } else {
              setError('Paciente não encontrado');
            }
          },
          (error) => {
            console.error('Erro ao buscar paciente:', error);
            setError('Erro ao buscar dados do paciente');
          }
        );

        // 2. Buscar dados do procedimento (real-time)
        const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);
        unsubscribeProcedure = onSnapshot(
          procedureRef,
          (doc) => {
            if (doc.exists()) {
              setProcedure({ id: doc.id, ...doc.data() });
            } else {
              setError('Procedimento não encontrado');
            }
          },
          (error) => {
            console.error('Erro ao buscar procedimento:', error);
            setError('Erro ao buscar dados do procedimento');
          }
        );

        // 3. Buscar subcoleção surgery (máximo 1 documento)
        const surgeryCollectionRef = collection(db, 'patients', patientId, 'procedures', procedureId, 'surgery');
        unsubscribeSurgery = onSnapshot(
          surgeryCollectionRef,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const surgeryDoc = querySnapshot.docs[0]; // Pegar apenas o primeiro (deveria ser único)
              setSurgery({ id: surgeryDoc.id, ...surgeryDoc.data() });
            } else {
              setSurgery(null);
            }
          },
          (error) => {
            console.error('Erro ao buscar surgery:', error);
            // Não definir erro aqui pois a subcoleção pode não existir
          }
        );

        // 4. Buscar subcoleção preAnesthetic (máximo 1 documento)
        const preAnestheticCollectionRef = collection(db, 'patients', patientId, 'procedures', procedureId, 'preAnesthetic');
        unsubscribePreAnesthetic = onSnapshot(
          preAnestheticCollectionRef,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const preAnestheticDoc = querySnapshot.docs[0]; // Pegar apenas o primeiro (deveria ser único)
              setPreAnesthetic({ id: preAnestheticDoc.id, ...preAnestheticDoc.data() });
            } else {
              setPreAnesthetic(null);
            }
          },
          (error) => {
            console.error('Erro ao buscar preAnesthetic:', error);
            // Não definir erro aqui pois a subcoleção pode não existir
          }
        );

        // 5. Buscar subcoleção sRPA (máximo 1 documento)
        const srpaCollectionRef = collection(db, 'patients', patientId, 'procedures', procedureId, 'sRPA');
        unsubscribeSrpa = onSnapshot(
          srpaCollectionRef,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const srpaDoc = querySnapshot.docs[0]; // Pegar apenas o primeiro (deveria ser único)
              setSrpa({ id: srpaDoc.id, ...srpaDoc.data() });
            } else {
              setSrpa(null);
            }
          },
          (error) => {
            console.error('Erro ao buscar sRPA:', error);
            // Não definir erro aqui pois a subcoleção pode não existir
          }
        );

        // Aguardar um momento para que os listeners sejam estabelecidos
        setTimeout(() => {
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Erro geral ao buscar dados:', error);
        setError('Erro ao carregar dados do procedimento');
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup: Remover todos os listeners ao desmontar
    return () => {
      if (unsubscribePatient) {
        unsubscribePatient();
      }
      if (unsubscribeProcedure) {
        unsubscribeProcedure();
      }
      if (unsubscribeSurgery) {
        unsubscribeSurgery();
      }
      if (unsubscribePreAnesthetic) {
        unsubscribePreAnesthetic();
      }
      if (unsubscribeSrpa) {
        unsubscribeSrpa();
      }
    };
  }, [patientId, procedureId]);

  // Função auxiliar para verificar se uma subcoleção existe
  const hasSubCollection = (subCollectionName) => {
    switch (subCollectionName) {
      case 'surgery':
        return surgery !== null;
      case 'preAnesthetic':
        return preAnesthetic !== null;
      case 'srpa':
        return srpa !== null;
      default:
        return false;
    }
  };

  // Função auxiliar para obter o status geral do procedimento baseado nas subcoleções
  const getOverallStatus = () => {
    const hasAny = surgery || preAnesthetic || srpa;
    const completedCount = [surgery, preAnesthetic, srpa].filter(Boolean).length;
    
    if (!hasAny) {
      return 'not_started';
    } else if (completedCount === 3) {
      return 'completed';
    } else {
      return 'in_progress';
    }
  };

  // Função auxiliar para contar subcoleções existentes
  const getSubCollectionCount = () => {
    return [surgery, preAnesthetic, srpa].filter(Boolean).length;
  };

  // Função auxiliar para verificar se todos os dados principais foram carregados
  const isDataLoaded = () => {
    return patient !== null && procedure !== null;
  };

  return {
    // Dados principais
    patient,
    procedure,
    
    // Subcoleções
    surgery,
    preAnesthetic,
    srpa,
    
    // Estados
    loading,
    error,
    
    // Funções auxiliares
    hasSubCollection,
    getOverallStatus,
    getSubCollectionCount,
    isDataLoaded,
    
    // Estatísticas
    stats: {
      totalSubCollections: getSubCollectionCount(),
      hasAnySubCollection: getSubCollectionCount() > 0,
      isComplete: getSubCollectionCount() === 3,
      overallStatus: getOverallStatus()
    }
  };
};

// Hook adicional para buscar apenas uma subcoleção específica (para uso futuro)
export const useSubCollection = (patientId, procedureId, subCollectionName) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId || !procedureId || !subCollectionName) {
      setLoading(false);
      return;
    }

    const collectionRef = collection(db, 'patients', patientId, 'procedures', procedureId, subCollectionName);
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]; // Máximo 1 documento por subcoleção
          setData({ id: doc.id, ...doc.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error(`Erro ao buscar ${subCollectionName}:`, error);
        setError(`Erro ao buscar ${subCollectionName}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [patientId, procedureId, subCollectionName]);

  return { data, loading, error };
};

// Hook para operações CRUD nas subcoleções (para uso futuro)
export const useSubCollectionOperations = (patientId, procedureId) => {
  const createSubCollectionDocument = async (subCollectionName, data) => {
    try {
      // Verificar se já existe um documento na subcoleção
      const collectionRef = collection(db, 'patients', patientId, 'procedures', procedureId, subCollectionName);
      const existingDocs = await getDocs(collectionRef);
      
      if (!existingDocs.empty) {
        throw new Error(`Já existe um documento na subcoleção ${subCollectionName}`);
      }

      // Criar novo documento
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error(`Erro ao criar documento em ${subCollectionName}:`, error);
      throw error;
    }
  };

  const updateSubCollectionDocument = async (subCollectionName, documentId, data) => {
    try {
      const docRef = doc(db, 'patients', patientId, 'procedures', procedureId, subCollectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${subCollectionName}:`, error);
      throw error;
    }
  };

  const deleteSubCollectionDocument = async (subCollectionName, documentId) => {
    try {
      const docRef = doc(db, 'patients', patientId, 'procedures', procedureId, subCollectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erro ao deletar documento em ${subCollectionName}:`, error);
      throw error;
    }
  };

  return {
    createSubCollectionDocument,
    updateSubCollectionDocument,
    deleteSubCollectionDocument
  };
};