import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  startAfter,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ========== USUÁRIOS ==========

// Verificar se CRM já existe no banco
export const checkCRMExists = async (crm) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('crm', '==', crm));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar CRM:', error);
    throw error;
  }
};

// Buscar usuário por CRM (para verificações)
export const getUserByCRM = async (crm) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('crm', '==', crm));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Erro ao buscar usuário por CRM:', error);
    throw error;
  }
};

// Verificar se email já existe (complemento ao Firebase Auth)
export const checkEmailExists = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
};

// Salvar dados do usuário no Firestore
export const saveUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...userData,
      uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return userData;
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    throw error;
  }
};

// Atualizar dados do usuário
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return updates;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

// Buscar perfil do usuário
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    throw error;
  }
};

//Cirurgias
export const generateSurgeryCode = async () => {
  const year = new Date().getFullYear();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `C${year}-${random}`;
    
    // Verificar se código já existe em qualquer subcoleção
    const exists = await checkSurgeryCodeExists(code);
    if (!exists) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback com timestamp se não conseguir gerar código único
  const timestamp = Date.now().toString().slice(-6);
  return `C${year}-${timestamp}`;
};

// Verificar se código de cirurgia já existe (busca em todas as subcoleções)
export const checkSurgeryCodeExists = async (code) => {
  try {
    // Como surgery agora é subcoleção, precisamos buscar em todos os procedures
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    
    for (const patientDoc of patientsSnapshot.docs) {
      const proceduresRef = collection(db, 'patients', patientDoc.id, 'procedures');
      const proceduresSnapshot = await getDocs(proceduresRef);
      
      for (const procedureDoc of proceduresSnapshot.docs) {
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'procedures', procedureDoc.id, 'surgeries');
        const surgeriesQuery = query(surgeriesRef, where('code', '==', code));
        const surgeriesSnapshot = await getDocs(surgeriesQuery);
        
        if (!surgeriesSnapshot.empty) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar código da cirurgia:', error);
    return false;
  }
};

// Salvar nova cirurgia na subcoleção
export const saveSurgery = async (patientId, procedureId, surgeryData) => {
  try {
    const code = await generateSurgeryCode();
    
    const surgeryWithMetadata = {
      ...surgeryData,
      code, // Código único da cirurgia
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1
    };

    // Surgery como documento na subcoleção surgeries do procedure
    const surgeriesRef = collection(db, 'patients', patientId, 'procedures', procedureId, 'surgeries');
    const surgeryDocRef = await addDoc(surgeriesRef, surgeryWithMetadata);
    
    console.log('Cirurgia salva com sucesso:', code);
    return { ...surgeryWithMetadata, id: surgeryDocRef.id, code };
  } catch (error) {
    console.error('Erro ao salvar cirurgia:', error);
    throw error;
  }
};

// Atualizar cirurgia existente (AutoSave)
export const updateSurgery = async (patientId, procedureId, surgeryId, updates) => {
  try {
    const surgeryRef = doc(db, 'patients', patientId, 'procedures', procedureId, 'surgeries', surgeryId);
    
    // Incrementar versão para controle de alterações
    const currentDoc = await getDoc(surgeryRef);
    const currentVersion = currentDoc.exists() ? (currentDoc.data().version || 1) : 1;
    
    // Limpar dados inválidos antes de salvar
    const cleanUpdates = {};
    Object.keys(updates).forEach(key => {
      const value = updates[key];
      // Só incluir se valor não for undefined e não for campo de controle
      if (value !== undefined && !['patientId', 'procedureId', 'surgeryId'].includes(key)) {
        cleanUpdates[key] = value;
      }
    });
    
    console.log('Dados limpos para salvar:', cleanUpdates); // Debug
    
    await updateDoc(surgeryRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
      version: currentVersion + 1
    });
    
    console.log('Cirurgia atualizada:', currentDoc.data()?.code || surgeryId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar cirurgia:', error);
    throw error;
  }
};

// Buscar cirurgia específica
export const getSurgery = async (patientId, procedureId) => {
  try {
    const surgeriesRef = collection(db, 'patients', patientId, 'procedures', procedureId, 'surgeries');
    const surgeriesSnapshot = await getDocs(surgeriesRef);
    
    if (!surgeriesSnapshot.empty) {
      // Retornar a primeira (deveria haver apenas uma surgery por procedure)
      const surgeryDoc = surgeriesSnapshot.docs[0];
      const surgeryData = { id: surgeryDoc.id, ...surgeryDoc.data() };
      console.log('Surgery data from Firestore:', surgeryData);
      return { id: surgeryDoc.id, ...surgeryDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cirurgia:', error);
    throw error;
  }
};

// Buscar cirurgia específica por ID
export const getSurgeryById = async (patientId, procedureId, surgeryId) => {
  try {
    const surgeryRef = doc(db, 'patients', patientId, 'procedures', procedureId, 'surgeries', surgeryId);
    const surgeryDoc = await getDoc(surgeryRef);
    
    if (surgeryDoc.exists()) {
      return { id: surgeryDoc.id, ...surgeryDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cirurgia:', error);
    throw error;
  }
};

// Buscar todas as cirurgias do usuário (query mais complexa)
export const getUserSurgeries = async (userId, limitCount = 10) => {
  try {
    const surgeries = [];
    
    // Buscar em todos os patients
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientData = patientDoc.data();
      
      // Buscar procedures do patient
      const proceduresRef = collection(db, 'patients', patientDoc.id, 'procedures');
      const proceduresQuery = query(
        proceduresRef,
        where('createdBy', '==', userId)
      );
      const proceduresSnapshot = await getDocs(proceduresQuery);
      
      for (const procedureDoc of proceduresSnapshot.docs) {
        const procedureData = procedureDoc.data();
        
        // Verificar se tem surgeries
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'procedures', procedureDoc.id, 'surgeries');
        const surgeriesSnapshot = await getDocs(surgeriesRef);
        
        surgeriesSnapshot.forEach((surgeryDoc) => {
          const surgeryData = surgeryDoc.data();
          
          // Incluir dados contextuais
          surgeries.push({
            id: surgeryDoc.id,
            ...surgeryData,
            patientId: patientDoc.id,
            procedureId: procedureDoc.id,
            patientName: patientData.name,
            procedimento: procedureData.procedimento,
            hospital: procedureData.hospital
          });
        });
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    surgeries.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return surgeries.slice(0, limitCount);
  } catch (error) {
    console.error('Erro ao buscar cirurgias do usuário:', error);
    return [];
  }
};

// Buscar cirurgias ativas do usuário
export const getActiveSurgeries = async (userId) => {
  try {
    const activeSurgeries = [];
    
    // Buscar em todos os patients
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientData = patientDoc.data();
      
      // Buscar procedures do patient
      const proceduresRef = collection(db, 'patients', patientDoc.id, 'procedures');
      const proceduresQuery = query(
        proceduresRef,
        where('createdBy', '==', userId)
      );
      const proceduresSnapshot = await getDocs(proceduresQuery);
      
      for (const procedureDoc of proceduresSnapshot.docs) {
        const procedureData = procedureDoc.data();
        
        // Verificar se tem surgeries ativas
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'procedures', procedureDoc.id, 'surgeries');
        const surgeriesSnapshot = await getDocs(surgeriesRef);
        
        surgeriesSnapshot.forEach((surgeryDoc) => {
          const surgeryData = surgeryDoc.data();
          
          // Incluir apenas cirurgias ativas
          if (surgeryData.status === 'in_progress' || surgeryData.status === 'aguardando_finalizacao') {
            activeSurgeries.push({
              id: surgeryDoc.id,
              ...surgeryData,
              patientId: patientDoc.id,
              procedureId: procedureDoc.id,
              patientName: patientData.name,
              procedimento: procedureData.procedimento,
              hospital: procedureData.hospital
            });
          }
        });
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    activeSurgeries.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return activeSurgeries;
  } catch (error) {
    console.error('Erro ao buscar cirurgias ativas:', error);
    return [];
  }
};

// Finalizar cirurgia
export const finalizeSurgery = async (patientId, procedureId, surgeryId, finalData) => {
  try {
    const surgeryRef = doc(db, 'patients', patientId, 'procedures', procedureId, 'surgeries', surgeryId);
    
    await updateDoc(surgeryRef, {
      ...finalData,
      status: 'finalizada',
      finishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Cirurgia finalizada');
    return true;
  } catch (error) {
    console.error('Erro ao finalizar cirurgia:', error);
    throw error;
  }
};

// Contar cirurgias do usuário
export const getUserSurgeriesCount = async (userId) => {
  try {
    let count = 0;
    
    // Buscar em todos os patients
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    
    for (const patientDoc of patientsSnapshot.docs) {
      // Buscar procedures do patient
      const proceduresRef = collection(db, 'patients', patientDoc.id, 'procedures');
      const proceduresQuery = query(
        proceduresRef,
        where('createdBy', '==', userId)
      );
      const proceduresSnapshot = await getDocs(proceduresQuery);
      
      for (const procedureDoc of proceduresSnapshot.docs) {
        // Verificar se tem surgeries
        const surgeriesRef = collection(db, 'patients', patientDoc.id, 'procedures', procedureDoc.id, 'surgeries');
        const surgeriesSnapshot = await getDocs(surgeriesRef);
        
        count += surgeriesSnapshot.size;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Erro ao contar cirurgias do usuário:', error);
    return 0;
  }
};

//

const getFieldWithFallback = (obj, ...fieldNames) => {
  for (const field of fieldNames) {
    if (obj[field]) {
      return obj[field]; // Retorna o valor correto em vez do nome do campo
    }
  }
  return '';
};

const extractHospitalName = (hospitalData) => {
  if (typeof hospitalData === 'string' && hospitalData.startsWith('{')) {
    try {
      const hospitalObj = JSON.parse(hospitalData);
      return hospitalObj.shortName || hospitalObj.name;
    } catch (e) {
      return hospitalData;
    }
  }
  if (typeof hospitalData === 'object' && (hospitalData?.shortName || hospitalData?.name)) {
    return hospitalData.shortName || hospitalData.name;
  }
  return hospitalData;
};

const getMainProcedure = (procedures) => {
  const validProcedures = procedures.filter(proc => 
    proc && proc.procedimento && proc.procedimento.trim() !== ''
  );
  
  if (validProcedures.length === 0) return null;
  
  return validProcedures.reduce((main, current) => 
    (current.porte || 0) > (main.porte || 0) ? current : main, 
    validProcedures[0]
  );
};

const cleanObject = (obj, fieldsToRemove = []) => {
  const cleaned = { ...obj };
  fieldsToRemove.forEach(field => delete cleaned[field]);
  return cleaned;
};

const addTimestamps = (data, includeCreated = true) => ({
  ...data,
  ...(includeCreated && { createdAt: serverTimestamp() }),
  updatedAt: serverTimestamp()
});

const validateByType = (procedureData) => {
  const { procedureType } = procedureData;
  
  if (procedureType === 'sus') {
    const surgeryDescription = procedureData.proposedSurgery || procedureData.procedimento;
    if (!surgeryDescription || surgeryDescription.trim() === '') {
      throw new Error('Procedimento é obrigatório para procedimentos SUS');
    }
  }
  
  if (procedureType === 'convenio') {
    const validProcedures = (procedureData.cbhpmProcedures || []).filter(proc => 
      proc && proc.procedimento && proc.procedimento.trim() !== ''
    );
    if (validProcedures.length === 0) {
      throw new Error('Pelo menos um procedimento CBHPM é obrigatório para convênios');
    }
  }
};

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

// ============= FUNÇÕES PRINCIPAIS =============

export const savePatient = async (patientData) => {
  try {
    const patientsRef = collection(db, 'patients');
    const standardizedPatient = addTimestamps({
      name: getFieldWithFallback(patientData, 'name', 'patientName'),
      birthDate: getFieldWithFallback(patientData, 'birthDate', 'patientBirthDate'),
      sex: getFieldWithFallback(patientData, 'sex', 'patientSex'),
      cns: getFieldWithFallback(patientData, 'cns', 'patientCNS'),
      createdBy: patientData.createdBy || null
    });
    console.log('DEBUG - Paciente sendo salvo no Firestore:', standardizedPatient);
    const newDocRef = await addDoc(patientsRef, standardizedPatient);
    return { id: newDocRef.id, ...standardizedPatient };
  } catch (error) {
    throw error;
  }
};

export const saveProcedure = async (patientId, procedureData) => {
  try {
    validateByType(procedureData);
    
    let processedData = { ...procedureData };

    // Para SUS
    if (procedureData.procedureType === 'sus') {
      const surgeryDescription = procedureData.proposedSurgery || procedureData.procedimento;
      processedData = {
        ...processedData,
        hospital: extractHospitalName(procedureData.hospital),
        procedimento: surgeryDescription.trim()
      };
      processedData = cleanObject(processedData, [
        'proposedSurgery', 'cbhpmProcedures', 'insuranceNumber', 'insuranceName'
      ]);
    }

    // Para Convênio
    if (procedureData.procedureType === 'convenio') {
      const mainProcedure = getMainProcedure(procedureData.cbhpmProcedures || []);
      processedData = {
        ...processedData,
        procedimento: mainProcedure.procedimento.trim()
      };
      processedData = cleanObject(processedData, [
        'cbhpmProcedures', 'proposedSurgery', 'hospitalRecord'
      ]);
    }

    // Limpeza final
    processedData = cleanObject(processedData, ['proposedSurgery', 'cbhpmProcedures']);
    
    // Verificação final
    if (!processedData.procedimento || processedData.procedimento.trim() === '') {
      throw new Error('Campo procedimento não pode estar vazio');
    }

    const proceduresRef = collection(db, 'patients', patientId, 'procedures');
    const dataToSave = addTimestamps({
      ...processedData,
      createdBy: processedData.createdBy || null,
      status: processedData.status || 'ativo'
    });
    
    const newDocRef = await addDoc(proceduresRef, dataToSave);
    return { id: newDocRef.id, ...processedData };
  } catch (error) {
    throw error;
  }
};

// ============= FUNÇÕES DE ANÁLISE DE NOMES =============

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
  
  // 2. NOME EXPANDIDO
  const { isExpanded, confidence: expandedConfidence } = checkNameExpansion(normalizedExisting, normalizedNew);
  if (expandedConfidence > 0.8) {
    return {
      type: 'name_expanded',
      confidence: expandedConfidence,
      details: isExpanded 
        ? `Nome expandido: "${existingName}" → "${newName}"`
        : `Nome reduzido: "${existingName}" ← "${newName}"`
    };
  }
  
  // 3. DIFERENÇA DE ACENTOS/GRAFIA
  const accentAnalysis = checkAccentDifferences(normalizedExisting, normalizedNew);
  if (accentAnalysis.confidence > 0.8) {
    return {
      type: 'accent_difference',
      confidence: accentAnalysis.confidence,
      details: `Diferenças de acentuação/grafia: "${existingName}" vs "${newName}"`
    };
  }
  
  // 4. NOMES SIMILARES
  const overallSimilarity = calculateNameSimilarity(normalizedExisting, normalizedNew);
  if (overallSimilarity > 0.6) {
    const siblingAnalysis = checkPossibleSibling(normalizedExisting, normalizedNew);
    if (siblingAnalysis.isPossible) {
      return {
        type: 'possible_sibling',
        confidence: 0.7,
        details: `Possível parentesco - sobrenomes compartilhados: ${siblingAnalysis.sharedSurnames.join(', ')}`
      };
    }
    
    return {
      type: 'similar_names',
      confidence: overallSimilarity,
      details: `Nomes similares (${Math.round(overallSimilarity * 100)}% de similaridade)`
    };
  }
  
  // 5. NOMES DIFERENTES
  return {
    type: 'different',
    confidence: 0,
    details: 'Nomes significativamente diferentes'
  };
};

const checkNameExpansion = (name1, name2) => {
  const shorterName = name1.length < name2.length ? name1 : name2;
  const longerName = name1.length < name2.length ? name2 : name1;
  const isExpanded = name1.length < name2.length;
  
  const shorterWords = shorterName.split(' ');
  const longerWords = longerName.split(' ');
  
  const allWordsFound = shorterWords.every(shortWord => 
    longerWords.some(longWord => longWord.includes(shortWord) || shortWord.includes(longWord))
  );
  
  const confidence = allWordsFound && shorterWords.length >= 2 ? 0.9 : 0;
  return { isExpanded, confidence };
};

const checkAccentDifferences = (name1, name2) => {
  const words1 = name1.split(' ');
  const words2 = name2.split(' ');
  
  if (words1.length !== words2.length) return { confidence: 0 };
  
  let matchingWords = 0;
  let accentDifferences = 0;
  
  for (let i = 0; i < words1.length; i++) {
    const similarity = calculateWordSimilarity(words1[i], words2[i]);
    if (similarity === 1) {
      matchingWords++;
    } else if (similarity > 0.8) {
      matchingWords++;
      accentDifferences++;
    }
  }
  
  const matchPercentage = matchingWords / words1.length;
  const confidence = matchPercentage >= 0.8 && accentDifferences > 0 ? 0.85 : 0;
  
  return { confidence, accentDifferences };
};

const checkPossibleSibling = (name1, name2) => {
  const words1 = name1.split(' ');
  const words2 = name2.split(' ');
  
  const surnames1 = words1.slice(1);
  const surnames2 = words2.slice(1);
  
  const sharedSurnames = surnames1.filter(surname => 
    surnames2.some(newSurname => 
      surname === newSurname || calculateWordSimilarity(surname, newSurname) > 0.8
    )
  );
  
  return {
    isPossible: sharedSurnames.length > 0,
    sharedSurnames
  };
};

const calculateWordSimilarity = (word1, word2) => {
  if (word1 === word2) return 1;
  
  const maxLength = Math.max(word1.length, word2.length);
  const minLength = Math.min(word1.length, word2.length);
  
  if (maxLength === 0) return 1;
  if (minLength / maxLength < 0.5) return 0;
  
  let commonChars = 0;
  const shorter = word1.length < word2.length ? word1 : word2;
  const longer = word1.length < word2.length ? word2 : word1;
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      commonChars++;
    }
  }
  
  return commonChars / maxLength;
};

const calculateNameSimilarity = (name1, name2) => {
  const words1 = name1.split(' ');
  const words2 = name2.split(' ');
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let totalSimilarity = 0;
  let maxComparisons = Math.max(words1.length, words2.length);
  
  words1.forEach(word1 => {
    let bestMatch = 0;
    words2.forEach(word2 => {
      const similarity = calculateWordSimilarity(word1, word2);
      bestMatch = Math.max(bestMatch, similarity);
    });
    totalSimilarity += bestMatch;
  });
  
  return totalSimilarity / maxComparisons;
};

const calculateConfidenceLevel = (nameAnalysis, birthdateMatch, sexMatch, cnsMatch) => {
  let confidence = 0;
  let factors = [];
  
  if (cnsMatch) {
    confidence += 0.6;
    factors.push('CNS idêntico (+60%)');
  }
  
  confidence += nameAnalysis.confidence * 0.3;
  factors.push(`${nameAnalysis.details} (+${Math.round(nameAnalysis.confidence * 30)}%)`);
  
  if (birthdateMatch) {
    confidence += 0.08;
    factors.push('Data nascimento idêntica (+8%)');
  }
  
  if (sexMatch) {
    confidence += 0.02;
    factors.push('Sexo idêntico (+2%)');
  }
  
  return {
    score: Math.min(confidence, 1.0),
    level: confidence > 0.85 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
    factors: factors
  };
};

const identifyPatientDifferences = (existingPatient, newPatientData) => {
  const differences = {};
  
  const fieldMappings = [
    { existing: 'name', new: 'patientName', key: 'name' },
    { existing: 'birthDate', new: 'patientBirthDate', key: 'birthDate' },
    { existing: 'sex', new: 'patientSex', key: 'sex' },
    { existing: 'cns', new: 'patientCNS', key: 'cns' }
  ];
  
  fieldMappings.forEach(({ existing, new: newField, key }) => {
    const existingValue = existingPatient[existing] || '';
    const newValue = newPatientData[newField] || '';
    
    const shouldCompare = key === 'name' 
      ? normalizeName(existingValue) !== normalizeName(newValue)
      : existingValue !== newValue;
      
    if (shouldCompare) {
      differences[key] = { existing: existingValue, new: newValue };
    }
  });
  
  return differences;
};

const generateContextualMessage = (nameAnalysis, confidenceLevel, differences) => {
  const messages = {
    name_expanded: {
      title: 'Provável mesmo paciente com nome expandido',
      description: 'O nome digitado parece ser uma versão mais completa do nome cadastrado.',
      recommendation: 'Se for o mesmo paciente, recomendamos atualizar para o nome completo.'
    },
    accent_difference: {
      title: 'Mesmo paciente com diferenças de acentuação',
      description: 'Os nomes são praticamente idênticos, apenas com diferenças de acentos ou grafia.',
      recommendation: 'Verifique qual grafia está correta.'
    },
    possible_sibling: {
      title: 'Possível paciente da mesma família',
      description: 'Encontramos paciente com nome similar e mesma data de nascimento.',
      recommendation: 'Verifique se são irmãos gêmeos ou pessoas diferentes.'
    },
    similar_names: {
      title: 'Pacientes com nomes similares encontrados',
      description: 'Há similaridade nos nomes que pode indicar parentesco ou erro de digitação.',
      recommendation: 'Verifique cuidadosamente se é a mesma pessoa.'
    },
    identical: {
      title: 'Paciente encontrado com dados ligeiramente diferentes',
      description: 'O nome é idêntico, mas há outras diferenças nos dados.',
      recommendation: 'Verifique qual versão dos dados está correta.'
    }
  };
  
  return messages[nameAnalysis.type] || messages.identical;
};

/**
 * Busca paciente por nome completo e data de nascimento (busca exata)
 */
export const getPatientByNameAndBirth = async (name, birthDate) => {
  try {
    const patientsRef = collection(db, 'patients');
    const normalizedName = normalizeName(name);
    
    // Buscar todos os pacientes com a mesma data de nascimento
    const q = query(patientsRef, where('birthDate', '==', birthDate));
    const snapshot = await getDocs(q);
    
    // Filtrar por nome normalizado
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const patientName = data.name || data.patientName || '';
      
      if (normalizeName(patientName) === normalizedName) {
        const standardized = {
          id: docSnap.id,
          name: data.name ?? data.patientName ?? '',
          birthDate: data.birthDate ?? data.patientBirthDate ?? '',
          sex: data.sex ?? data.patientSex ?? '',
          cns: data.cns ?? data.patientCNS ?? '',
          ...data
        };
        // Remover campos duplicados
        delete standardized.patientName;
        delete standardized.patientBirthDate;
        delete standardized.patientSex;
        delete standardized.patientCNS;
        return standardized;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar paciente por nome e data:', error);
    throw error;
  }
};

export const findExistingPatient = async (formData) => {
  try {
    console.log('🔍 === BUSCA INTELIGENTE DE PACIENTES ===');
    console.log('📥 Dados para busca:', formData);
    
    let foundPatient = null;
    let searchMethod = '';
    
    // 1. PRIORIDADE 1: Buscar por CNS (se disponível)
    if (formData.patientCNS && formData.patientCNS.trim()) {
      console.log('🎯 Buscando por CNS:', formData.patientCNS);
      const cleanCNS = formData.patientCNS.replace(/\D/g, '');
      const formattedCNS = cleanCNS.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
      foundPatient = await getPatientByCNS(formattedCNS);
      searchMethod = 'cns';
      
      if (foundPatient) {
        console.log('✅ Paciente encontrado por CNS:', foundPatient.id);
      }
    }
    
    if (!foundPatient && formData.patientName && formData.patientBirthDate) {
      console.log('📝 Buscando por nome + data...');
      foundPatient = await getPatientByNameAndBirth(
        formData.patientName.trim(), 
        formData.patientBirthDate
      );
      searchMethod = 'name_date';
      
      if (foundPatient) {
        console.log('✅ Paciente encontrado por nome + data:', foundPatient.id);
      }
    }
    
    if (foundPatient) {
      console.log('🔬 Analisando paciente encontrado...');
      
      const nameAnalysis = analyzeNameRelationship(
        foundPatient.name || '', 
        formData.patientName || ''
      );
      console.log('📝 Análise do nome:', nameAnalysis);
      
      const birthdateMatch = foundPatient.birthDate === formData.patientBirthDate;
      const sexMatch = foundPatient.sex === formData.patientSex;
      const cnsMatch = searchMethod === 'cns'; // Se encontrou por CNS, então CNS bate
      
      console.log('✅ Matches:', { birthdateMatch, sexMatch, cnsMatch });
      
      const confidenceLevel = calculateConfidenceLevel(
        nameAnalysis, 
        birthdateMatch, 
        sexMatch, 
        cnsMatch
      );
      console.log('📊 Nível de confiança:', confidenceLevel);
      
      const differences = identifyPatientDifferences(foundPatient, formData);
      console.log('🔍 Diferenças encontradas:', differences);
      
      if (Object.keys(differences).length === 0) {
        console.log('✅ PACIENTE IDÊNTICO - sem modal');
        return { 
          type: 'exact', 
          patient: foundPatient,
          searchMethod: searchMethod
        };
      }
      
      if (confidenceLevel.level === 'high' || confidenceLevel.score >= 0.8) {
        console.log('⚠️ PACIENTE COM DIFERENÇAS (alta confiança) - mostrar modal');
        
        const contextualMessage = generateContextualMessage(
          nameAnalysis, 
          confidenceLevel, 
          differences
        );
        
        return {
          type: 'exact_with_differences',
          patient: foundPatient,
          confidence: confidenceLevel,
          relationship: nameAnalysis.type,
          differences: differences,
          message: contextualMessage,
          searchMethod: searchMethod
        };
      }
      
      console.log('🤔 CONFIANÇA MÉDIA/BAIXA - tratar como similar');
      foundPatient.similarity = Math.round(confidenceLevel.score * 100);
      foundPatient.analysisDetails = nameAnalysis.details;
      
      return {
        type: 'similar',
        patients: [foundPatient],
        searchMethod: searchMethod
      };
    }
    
    // 4. PRIORIDADE 3: Buscar similares (fuzzy matching)
    if (formData.patientName && formData.patientBirthDate) {
      console.log('🔄 Buscando pacientes similares...');
      const similarPatients = await findSimilarPatients(
        formData.patientName.trim(), 
        formData.patientBirthDate,
        0.6 // threshold reduzido para capturar mais casos
      );
      
      if (similarPatients.length > 0) {
        console.log(`🤔 ${similarPatients.length} paciente(s) similar(es) encontrado(s)`);
        
        // Enriquecer cada paciente similar com análise contextual
        const enrichedPatients = similarPatients.map(patient => {
          const nameAnalysis = analyzeNameRelationship(
            patient.name || '', 
            formData.patientName || ''
          );
          
          return {
            ...patient,
            analysisType: nameAnalysis.type,
            analysisDetails: nameAnalysis.details,
            similarity: Math.round(nameAnalysis.confidence * 100)
          };
        });
        
        return { 
          type: 'similar', 
          patients: enrichedPatients,
          searchMethod: 'similarity'
        };
      }
    }
    
    // 5. Nenhum paciente encontrado
    console.log('❌ Nenhum paciente encontrado - criará novo');
    return null;
    
  } catch (error) {
    console.error('❌ Erro na busca inteligente de pacientes:', error);
    throw error;
  }
};

/**
 * Função atualizada para buscar pacientes similares com threshold flexível
 */
export const findSimilarPatients = async (name, birthDate, threshold = 0.6) => {
  try {
    const patientsRef = collection(db, 'patients');
    
    // Buscar todos os pacientes com a mesma data de nascimento
    const q = query(patientsRef, where('birthDate', '==', birthDate));
    const snapshot = await getDocs(q);
    
    const similarPatients = [];
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const patientName = data.name || data.patientName || '';
      
      // Usar nossa nova função de análise
      const nameAnalysis = analyzeNameRelationship(name, patientName);
      
      if (nameAnalysis.confidence >= threshold && nameAnalysis.confidence < 1) {
        const standardized = {
          id: docSnap.id,
          name: data.name ?? data.patientName ?? '',
          birthDate: data.birthDate ?? data.patientBirthDate ?? '',
          sex: data.sex ?? data.patientSex ?? '',
          cns: data.cns ?? data.patientCNS ?? '',
          similarity: Math.round(nameAnalysis.confidence * 100),
          ...data
        };
        delete standardized.patientName;
        delete standardized.patientBirthDate;
        delete standardized.patientSex;
        delete standardized.patientCNS;
        similarPatients.push(standardized);
      }
    });
    
    // Ordenar por confiança (maior primeiro)
    return similarPatients.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Erro ao buscar pacientes similares:', error);
    throw error;
  }
};


export const createPatientAndProcedureIntelligent = async (formData) => {
  try {
    console.log('🚀 === INÍCIO createPatientAndProcedureIntelligent ===');
    console.log('📥 formData completo:', JSON.stringify(formData, null, 2));
    
    const { patientData, procedureData, metadata } = formData;
    
    console.log('👤 patientData:', JSON.stringify(patientData, null, 2));
    console.log('🏥 procedureData:', JSON.stringify(procedureData, null, 2));
    console.log('📋 metadata:', JSON.stringify(metadata, null, 2));
    
    // 1. Buscar paciente existente com análise contextual
    console.log('🔍 Iniciando busca inteligente de paciente...');
    const searchResult = await findExistingPatient(patientData);
    console.log('🔍 Resultado da busca:', searchResult);
    
    // 2. CASO: Paciente idêntico encontrado
    if (searchResult?.type === 'exact') {
      console.log('✅ Paciente IDÊNTICO encontrado - criando apenas procedimento');
      console.log('🏥 Método de busca:', searchResult.searchMethod);
      
      const procedureDataToSave = {
        ...procedureData,
        status: 'planned',
        createdAt: serverTimestamp(),
        createdBy: metadata.createdBy,
        sharedWith: [],
        lastUpdated: serverTimestamp()
      };
      
      console.log('💾 Chamando saveProcedure...');
      const savedProcedure = await saveProcedure(searchResult.patient.id, procedureDataToSave);
      
      return {
        action: 'procedure_created',
        patient: searchResult.patient,
        procedure: savedProcedure,
        message: `Paciente existente encontrado (${searchResult.searchMethod === 'cns' ? 'por CNS' : 'por nome+data'}) - novo procedimento criado`,
        searchMethod: searchResult.searchMethod
      };
    }
    
    // 3. CASO: Paciente com diferenças (alta confiança)
    if (searchResult?.type === 'exact_with_differences') {
      console.log('⚠️ Paciente com DIFERENÇAS encontrado - retornando para modal contextual');
      console.log('🔬 Tipo de relação:', searchResult.relationship);
      console.log('📊 Confiança:', searchResult.confidence);
      console.log('🔍 Diferenças:', searchResult.differences);
      
      return {
        action: 'exact_patient_with_differences',
        existingPatient: searchResult.patient,
        confidence: searchResult.confidence,
        relationship: searchResult.relationship,
        differences: searchResult.differences,
        contextualMessage: searchResult.message,
        searchMethod: searchResult.searchMethod,
        formData: formData // Manter dados para decisão posterior
      };
    }
    
    // 4. CASO: Pacientes similares encontrados (média/baixa confiança)
    if (searchResult?.type === 'similar') {
      console.log('🤔 Pacientes SIMILARES encontrados - retornando para modal de investigação');
      console.log('📋 Pacientes encontrados:', searchResult.patients.length);
      
      return {
        action: 'similar_patients_found',
        similarPatients: searchResult.patients,
        searchMethod: searchResult.searchMethod,
        formData: formData
      };
    }
    
    // 5. CASO: Nenhum paciente encontrado - criar novo
    console.log('🆕 Nenhum paciente encontrado - criando NOVO paciente e procedimento');
    
    const savedPatient = await savePatient({
      ...patientData,
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Novo paciente criado:', savedPatient.id);
    
    const procedureDataToSave = {
      ...procedureData,
      status: 'planned',
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      sharedWith: [],
      lastUpdated: serverTimestamp()
    };
    
    console.log('💾 Criando procedimento para novo paciente...');
    const savedProcedure = await saveProcedure(savedPatient.id, procedureDataToSave);
    
    return {
      action: 'patient_and_procedure_created',
      patient: savedPatient,
      procedure: savedProcedure,
      message: 'Novo paciente e procedimento criados com sucesso'
    };
    
  } catch (error) {
    console.error('❌ ERRO em createPatientAndProcedureIntelligent:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Função para usar paciente existente sem atualizar (mantém dados originais)
 */
export const useExistingPatientAndCreateProcedure = async (existingPatientId, formData) => {
  try {
    console.log('🔄 Usando paciente existente SEM atualização:', existingPatientId);
    
    const { procedureData, metadata } = formData;
    
    // Criar apenas o procedimento
    const savedProcedure = await saveProcedure(existingPatientId, {
      ...procedureData,
      status: 'planned',
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      sharedWith: [],
      lastUpdated: serverTimestamp()
    });
    
    // Buscar dados atualizados do paciente
    const patient = await getPatient(existingPatientId);
    
    return {
      action: 'procedure_created_existing_patient',
      patient: patient,
      procedure: savedProcedure,
      message: 'Procedimento criado para paciente existente (dados mantidos)'
    };
    
  } catch (error) {
    console.error('❌ Erro ao usar paciente existente:', error);
    throw error;
  }
};

/**
 * Função para atualizar paciente existente e criar procedimento
 * (quando usuário confirma que é o mesmo paciente e quer atualizar dados)
 */
export const updatePatientAndCreateProcedure = async (existingPatientId, formData) => {
  try {
    console.log('🔄 Atualizando paciente existente e criando procedimento:', existingPatientId);
    
    const { patientData, procedureData, metadata } = formData;
    
    // 1. Atualizar dados do paciente (merge inteligente)
    await updatePatient(existingPatientId, {
      ...patientData,
      lastUpdatedBy: metadata.createdBy,
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Dados do paciente atualizados');
    
    // 2. Buscar dados atualizados do paciente
    const updatedPatient = await getPatient(existingPatientId);
    
    // 3. Criar novo procedimento
    const savedProcedure = await saveProcedure(existingPatientId, {
      ...procedureData,
      status: 'planned',
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      sharedWith: [],
      lastUpdated: serverTimestamp()
    });
    
    return {
      action: 'patient_updated_procedure_created',
      patient: updatedPatient,
      procedure: savedProcedure,
      message: 'Dados do paciente atualizados e novo procedimento criado'
    };
    
  } catch (error) {
    console.error('❌ Erro ao atualizar paciente e criar procedimento:', error);
    throw error;
  }
};

/**
 * Função para forçar criação de novo paciente 
 * (quando usuário confirma que são pessoas diferentes)
 */
export const forceCreateNewPatientAndProcedure = async (formData) => {
  try {
    console.log('🆕 Forçando criação de NOVO paciente (usuário confirmou que são diferentes)');
    
    const { patientData, procedureData, metadata } = formData;
    
    // Criar novo paciente
    const savedPatient = await savePatient({
      ...patientData,
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      lastUpdated: serverTimestamp()
    });
    
    // Criar procedimento
    const savedProcedure = await saveProcedure(savedPatient.id, {
      ...procedureData,
      status: 'planned',
      createdAt: serverTimestamp(),
      createdBy: metadata.createdBy,
      sharedWith: [],
      lastUpdated: serverTimestamp()
    });
    
    return {
      action: 'new_patient_forced',
      patient: savedPatient,
      procedure: savedProcedure,
      message: 'Novo paciente criado conforme solicitado'
    };
    
  } catch (error) {
    console.error('❌ Erro ao forçar criação de novo paciente:', error);
    throw error;
  }
};


export const updateProcedure = async (patientId, procedureId, procedureData) => {
  try {
    // Aplicar o mesmo processamento da função saveProcedure
    let processedData = { ...procedureData };
    
    if (procedureData.procedureType === 'sus') {
      if (typeof procedureData.hospital === 'string' && procedureData.hospital.startsWith('{')) {
        try {
          const hospitalObj = JSON.parse(procedureData.hospital);
          processedData.hospital = hospitalObj.shortName || hospitalObj.name;
        } catch (e) {
          processedData.hospital = procedureData.hospital;
        }
      }
      
      if (!processedData.procedimento && procedureData.proposedSurgery) {
        processedData.procedimento = procedureData.proposedSurgery;
      }
      
      delete processedData.insuranceNumber;
      delete processedData.insuranceName;
      delete processedData.cbhpmProcedures;
    }
    
    if (procedureData.procedureType === 'convenio') {
      if (!processedData.procedimento && procedureData.cbhpmProcedures) {
        const cbhpmProcedures = procedureData.cbhpmProcedures || [];
        const mainProcedure = cbhpmProcedures.find(proc => proc.procedimento && proc.procedimento.trim() !== '') || cbhpmProcedures[0];
        processedData.procedimento = mainProcedure?.procedimento || 'Procedimento não informado';
      }
      
      delete processedData.hospitalRecord;
      delete processedData.proposedSurgery;
    }
    
    const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);
    await updateDoc(procedureRef, {
      ...processedData,
      updatedAt: serverTimestamp()
    });
    
    console.log('Procedimento atualizado:', procedureId);
    return { id: procedureId, ...processedData };
  } catch (error) {
    console.error('Erro ao atualizar procedimento:', error);
    throw error;
  }
};

export const updatePatient = async (patientId, updates) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    let currentData = patientDoc.exists() ? patientDoc.data() : {};
    let newHistory = currentData.insuranceHistory || [];

    const standardizedUpdates = {
      name: updates.name ?? updates.patientName ?? currentData.name ?? '',
      birthDate: updates.birthDate ?? updates.patientBirthDate ?? currentData.birthDate ?? '',
      sex: updates.sex ?? updates.patientSex ?? currentData.sex ?? '',
      cns: updates.cns ?? updates.patientCNS ?? currentData.cns ?? '',
    };
    for (const key of Object.keys(updates)) {
      if (!['name', 'patientName', 'birthDate', 'patientBirthDate', 'sex', 'patientSex', 'cns', 'patientCNS'].includes(key)) {
        standardizedUpdates[key] = updates[key];
      }
    }

    if (updates.currentInsuranceName && updates.currentInsuranceName !== currentData.currentInsuranceName) {
      newHistory = newHistory.map(h => ({ ...h, to: h.to || new Date().toISOString() }));
      newHistory.push({
        name: updates.currentInsuranceName,
        number: updates.currentInsuranceNumber || '',
        from: new Date().toISOString(),
        to: null
      });
    }

    await updateDoc(patientRef, {
      ...standardizedUpdates,
      insuranceHistory: newHistory,
      updatedAt: serverTimestamp()
    });
    console.log('Paciente atualizado com histórico de convênio:', patientId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
};

export const getPatient = async (patientId) => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    if (patientDoc.exists()) {
      const data = patientDoc.data();
      // Padronizar campos
      const standardized = {
        id: patientDoc.id,
        name: data.name ?? data.patientName ?? '',
        birthDate: data.birthDate ?? data.patientBirthDate ?? '',
        sex: data.sex ?? data.patientSex ?? '',
        cns: data.cns ?? data.patientCNS ?? '',
        ...data
      };
      // Remover campos duplicados
      delete standardized.patientName;
      delete standardized.patientBirthDate;
      delete standardized.patientSex;
      delete standardized.patientCNS;
      return standardized;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
};

export const getPatientByCNS = async (cns) => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, where('cns', '==', cns));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      const standardized = {
        id: docSnap.id,
        name: data.name ?? data.patientName ?? '',
        birthDate: data.birthDate ?? data.patientBirthDate ?? '',
        sex: data.sex ?? data.patientSex ?? '',
        cns: data.cns ?? data.patientCNS ?? '',
        ...data
      };
      delete standardized.patientName;
      delete standardized.patientBirthDate;
      delete standardized.patientSex;
      delete standardized.patientCNS;
      return standardized;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar paciente por CNS:', error);
    throw error;
  }
};


export const getPatientsWithProcedures = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, limit(50)); // Máximo 50 pacientes
    const patientsSnapshot = await getDocs(q);
    const patients = [];

    // Para cada paciente, buscar procedimentos
    for (const patientDoc of patientsSnapshot.docs) {
      const data = patientDoc.data();
      // Normalizar campos do paciente
      const patientData = {
        id: patientDoc.id,
        name: data.name ?? data.patientName ?? '',
        birthDate: data.birthDate ?? data.patientBirthDate ?? '',
        sex: data.sex ?? data.patientSex ?? '',
        cns: data.cns ?? data.patientCNS ?? '',
        ...data
      };
      delete patientData.patientName;
      delete patientData.patientBirthDate;
      delete patientData.patientSex;
      delete patientData.patientCNS;

      const proceduresRef = collection(db, 'patients', patientDoc.id, 'procedures');
      const proceduresSnapshot = await getDocs(proceduresRef);
      const procedures = proceduresSnapshot.docs.map(procDoc => ({ id: procDoc.id, ...procDoc.data() }));
      patients.push({ ...patientData, procedures });
    }
    return patients;
  } catch (error) {
    console.error('Erro ao buscar pacientes com procedimentos:', error);
    throw error;
  }
};

export const deleteProcedure = async (patientId, procedureId) => {
  try {
    const subcollections = ['Surgery', 'PreAnestheticEvaluation', 'SRPA'];
    for (const subcol of subcollections) {
      const subcolRef = collection(db, 'patients', patientId, 'procedures', procedureId, subcol);
      const subcolSnapshot = await getDocs(subcolRef);
      for (const docSnap of subcolSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }
    // Agora exclui o procedimento em si
    const procedureRef = doc(db, 'patients', patientId, 'procedures', procedureId);
    await deleteDoc(procedureRef);
    console.log(`Procedimento ${procedureId} e suas subcoleções removidos para paciente ${patientId}`);
    return true;
  } catch (error) {
    console.error('Erro ao excluir procedimento:', error);
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    // Primeiro, buscar todos os procedimentos
    const proceduresRef = collection(db, 'patients', patientId, 'procedures');
    const proceduresSnapshot = await getDocs(proceduresRef);
    for (const procDoc of proceduresSnapshot.docs) {
      // Exclui cada procedimento e suas subcoleções
      await deleteProcedure(patientId, procDoc.id);
    }
    // Após remover procedimentos, remove o paciente
    const patientRef = doc(db, 'patients', patientId);
    await deleteDoc(patientRef);
    console.log(`Paciente ${patientId} e todos os procedimentos removidos`);
    return true;
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    throw error;
  }
};

// Adicionar ao final do seu firestore.js

export const getPatientsWithProceduresOptimized = async (userId) => {
  try {
    console.log('Buscando pacientes...');
    
    // Usar sua função existente como base
    const allPatients = await getPatientsWithProcedures();
    
    // Filtrar por usuário se o campo existir
    const userPatients = allPatients.filter(patient => {
      // Se não tem createdBy, mostrar todos (compatibilidade)
      return !patient.createdBy || patient.createdBy === userId;
    });
    
    console.log(`Encontrados ${userPatients.length} pacientes`);
    return userPatients;
    
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    throw error;
  }
};

// Adicione esta função SIMPLES no seu firestore.js:

// Volte para a versão simples sem contagem:

export const getPatientsBasic = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    
    return patientsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? data.patientName ?? '',
        birthDate: data.birthDate ?? data.patientBirthDate ?? '',
        sex: data.sex ?? data.patientSex ?? '',
        cns: data.cns ?? data.patientCNS ?? '',
        procedures: [] // Vazio por enquanto
      };
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    throw error;
  }
};

// Adicione esta função no seu firestore.js:

export const getPatientProcedures = async (patientId) => {
  try {
    const proceduresRef = collection(db, 'patients', patientId, 'procedures');
    const proceduresSnapshot = await getDocs(proceduresRef);
    
    return proceduresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar procedimentos:', error);
    return [];
  }
};

// Função de fallback
export const getPatientsWithProceduresOriginal = getPatientsWithProcedures;