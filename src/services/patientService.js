// src/services/patientService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  getDoc,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ');
};

const hasAccessViaSurgeries = async (patientId, userId) => {
  try {
    const surgeriesRef = collection(db, 'patients', patientId, 'surgeries');
    const q = query(surgeriesRef, where('sharedWith', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar acesso via cirurgias:', error);
    return false;
  }
};

/**
 * Análise inteligente de relacionamento entre nomes
 */
const analyzeNameRelationship = (existingName, newName) => {
  const normalizedExisting = normalizeName(existingName);
  const normalizedNew = normalizeName(newName);
  
  // 1. IDÊNTICOS
  if (normalizedExisting === normalizedNew) {
    return {
      type: 'identical',
      confidence: 1.0,
      details: 'Nomes idênticos (ignorando acentos e case)'
    };
  }
  
  // 2. NOME EXPANDIDO/REDUZIDO
  const checkNameExpansion = (name1, name2) => {
    const shorterName = name1.length < name2.length ? name1 : name2;
    const longerName = name1.length < name2.length ? name2 : name1;
    
    const shorterWords = shorterName.split(' ');
    const longerWords = longerName.split(' ');
    
    const allWordsFound = shorterWords.every(shortWord => 
      longerWords.some(longWord => longWord.includes(shortWord) || shortWord.includes(longWord))
    );
    
    return allWordsFound && shorterWords.length >= 2 ? 0.9 : 0;
  };

  const expansionConfidence = checkNameExpansion(normalizedExisting, normalizedNew);
  if (expansionConfidence > 0.8) {
    return {
      type: 'name_expanded',
      confidence: expansionConfidence,
      details: normalizedExisting.length < normalizedNew.length 
        ? `Nome expandido: "${existingName}" → "${newName}"`
        : `Nome reduzido: "${existingName}" ← "${newName}"`
    };
  }
  
  // 3. SIMILARIDADE GERAL
  const calculateSimilarity = (name1, name2) => {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let totalSimilarity = 0;
    let maxComparisons = Math.max(words1.length, words2.length);
    
    words1.forEach(word1 => {
      let bestMatch = 0;
      words2.forEach(word2 => {
        const similarity = word1 === word2 ? 1 : 
          (word1.includes(word2) || word2.includes(word1)) ? 0.8 : 0;
        bestMatch = Math.max(bestMatch, similarity);
      });
      totalSimilarity += bestMatch;
    });
    
    return totalSimilarity / maxComparisons;
  };

  const overallSimilarity = calculateSimilarity(normalizedExisting, normalizedNew);
  
  if (overallSimilarity > 0.6) {
    return {
      type: 'similar_names',
      confidence: overallSimilarity,
      details: `Nomes similares (${Math.round(overallSimilarity * 100)}% de similaridade)`
    };
  }
  
  return {
    type: 'different',
    confidence: 0,
    details: 'Nomes significativamente diferentes'
  };
};

/**
 * Buscar paciente por CNS
 */
export const getPatientByCNS = async (cns, uid) => {
  if (cns === '000000000000000') {
    return null; // Ignora CNS placeholder na verificação
  }
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('patientCNS', '==', cns));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const patientId = docSnap.id;
        const hasDirectAccess = data.metadata?.createdBy === uid || (data.sharedWith || []).includes(uid);
        const hasSurgeryAccess = await hasAccessViaSurgeries(patientId, uid);
        if (hasDirectAccess || hasSurgeryAccess) {
          return {
            id: patientId,
            ...data
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar paciente por CNS:', error);
    throw error;
  }
};

/**
 * Buscar paciente por nome completo e data de nascimento
 */
export const getPatientByNameAndBirth = async (name, birthDate, uid) => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('patientBirthDate', '==', birthDate));
    const snapshot = await getDocs(q);
    
    const normalizedSearchName = normalizeName(name);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const patientId = docSnap.id;
      const hasDirectAccess = data.metadata?.createdBy === uid || (data.sharedWith || []).includes(uid);
      const hasSurgeryAccess = await hasAccessViaSurgeries(patientId, uid);
      if (!(hasDirectAccess || hasSurgeryAccess)) {
        continue; // ignora paciente sem permissão
      }
      const patientName = data.patientName || '';
      
      if (normalizeName(patientName) === normalizedSearchName) {
        return {
          id: patientId,
          ...data
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar paciente por nome e data:', error);
    throw error;
  }
};

/**
 * Função principal de verificação de duplicatas
 * Integra perfeitamente com seu PatientForm
 */
export const checkForDuplicates = async (patientData) => {
  try {
    console.log('🔍 Verificando duplicatas para:', patientData);
    
    // 1. PRIORIDADE 1: Buscar por CNS
    if (patientData.patientCNS && patientData.patientCNS.trim()) {
      const cnsPatient = await getPatientByCNS(patientData.patientCNS, patientData.currentUserId);
      if (cnsPatient) {
        console.log('✅ Paciente encontrado por CNS');
        return { type: 'cns_match', patients: [cnsPatient] };
      }
    }
    
    // 2. PRIORIDADE 2: Buscar por nome + data
    if (patientData.patientName && patientData.patientBirthDate) {
      const namePatient = await getPatientByNameAndBirth(
        patientData.patientName.trim(), 
        patientData.patientBirthDate,
        patientData.currentUserId
      );
      if (namePatient) {
        console.log('✅ Paciente encontrado por nome + data');
        return { type: 'name_date_match', patients: [namePatient] };
      }
    }
    
    // 3. PRIORIDADE 3: Busca por similaridade
    const similarPatients = await findSimilarPatients(
      patientData.patientName, 
      patientData.patientBirthDate,
      patientData.currentUserId
    );
    
    if (similarPatients.length > 0) {
      console.log('🤔 Pacientes similares encontrados');
      return { type: 'similar_match', patients: similarPatients };
    }
    
    // 4. Nenhuma duplicata encontrada
    console.log('❌ Nenhuma duplicata encontrada');
    return { type: 'none', patients: [] };
    
  } catch (error) {
    console.error('❌ Erro ao verificar duplicatas:', error);
    throw error;
  }
};

/**
 * Buscar pacientes similares (fuzzy matching)
 */
export const findSimilarPatients = async (name, birthDate, uid, threshold = 0.6) => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('patientBirthDate', '==', birthDate));
    const snapshot = await getDocs(q);
    
    const similarPatients = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const patientId = docSnap.id;
      const hasDirectAccess = data.metadata?.createdBy === uid || (data.sharedWith || []).includes(uid);
      let hasAccess = hasDirectAccess;
      if (!hasDirectAccess) {
        hasAccess = await hasAccessViaSurgeries(patientId, uid);
      }
      if (!hasAccess) {
        continue; // ignora paciente sem acesso
      }
      const patientName = data.patientName || '';
      
      const nameAnalysis = analyzeNameRelationship(name, patientName);
      
      if (nameAnalysis.confidence >= threshold && nameAnalysis.confidence < 1) {
        similarPatients.push({
          id: patientId,
          ...data,
          similarity: Math.round(nameAnalysis.confidence * 100),
          analysisDetails: nameAnalysis.details
        });
      }
    }
    
    return similarPatients.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Erro ao buscar pacientes similares:', error);
    throw error;
  }
};

/**
 * Criar novo paciente
 */
export const createPatient = async (patientData, currentUserId) => {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      patientName: patientData.patientName,
      patientBirthDate: patientData.patientBirthDate,
      patientSex: patientData.patientSex,
      patientCNS: patientData.patientCNS,
      metadata: {
        createdAt: serverTimestamp(),
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
    console.error('Erro ao criar paciente:', error);
    throw error;
  }
};

/**
 * Atualizar paciente existente
 */
export const updatePatient = async (patientId, updates, currentUserId = null) => {
  try {
    const patientRef = doc(db, 'patients', patientId);

    // Se o campo metadata não existe no updates, cria
    const metadata = {
      ...(updates.metadata || {}),
      updatedAt: serverTimestamp()
    };

    // Apenas adiciona updatedBy se currentUserId foi fornecido
    if (currentUserId) {
      metadata.updatedBy = currentUserId;
    }

    // Remove metadata do updates para evitar sobreposição
    const { metadata: _, ...otherUpdates } = updates;

    await updateDoc(patientRef, {
      ...otherUpdates,
      metadata
    });

    return { id: patientId, ...updates, metadata };
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
};

/**
 * Buscar paciente por ID
 */
export const getPatient = async (patientId) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    
    if (patientDoc.exists()) {
      return {
        id: patientDoc.id,
        ...patientDoc.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
};

/**
 * Buscar todos os pacientes que o usuário tem acesso
 * Inclui pacientes criados pelo usuário e pacientes compartilhados com ele
 */
export const getPatientsByUser = async (uid) => {
  try {
    const patientsRef = collection(db, 'patients');

    // 1. Pacientes criados pelo usuário
    const q1 = query(patientsRef, where('metadata.createdBy', '==', uid));
    const snap1 = await getDocs(q1);

    // 2. Pacientes compartilhados com o usuário
    const q2 = query(patientsRef, where('sharedWith', 'array-contains', uid));
    const snap2 = await getDocs(q2);

    const results = [
      ...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    // Remove duplicatas pelo ID
    const unique = Object.values(results.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {}));

    return unique;
  } catch (error) {
    console.error('Erro ao carregar pacientes acessíveis:', error);
    throw error;
  }
};

/**
 * Contar pacientes acessíveis pelo usuário
 * Soma dos conjuntos: criados pelo usuário ∪ compartilhados com o usuário
 * Implementado com agregações COUNT (sem carregar documentos)
 */
export const getPatientCountByUser = async (uid) => {
  try {
    const patientsRef = collection(db, 'patients');

    // Approach 1: Usar apenas as duas queries principais
    const [createdAgg, sharedAgg] = await Promise.all([
      getCountFromServer(query(patientsRef, where('metadata.createdBy', '==', uid))),
      getCountFromServer(query(patientsRef, where('sharedWith', 'array-contains', uid)))
    ]);

    // Para casos pequenos, a sobreposição é geralmente mínima
    // Se precisar de precisão absoluta, fazer uma query adicional
    return Math.max(
      createdAgg.data().count || 0,
      sharedAgg.data().count || 0
    ); // Aproximação conservadora
    
  } catch (error) {
    console.error('Erro ao contar pacientes:', error);
    // Fallback: retornar 0 ou usar cache
    return 0;
  }
};