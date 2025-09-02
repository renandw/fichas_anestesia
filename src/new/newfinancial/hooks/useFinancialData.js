// src/new/newfinancial/hooks/useFinancialData.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getConvenioAnesthesias, 
  getFinancialSummary,
  updateAnesthesiaFinancial,
  markAsPaid,
  markAsUnpaid,
  updateGlosa
} from '../../../services/financialService';

export const useFinancialData = () => {
  const { currentUserId } = useAuth();
  
  // Estados principais
  const [anesthesias, setAnesthesias] = useState([]);
  const [filteredAnesthesias, setFilteredAnesthesias] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [filters, setFilters] = useState({
    patientName: '',
    procedure: '',
    hospital: '',
    insuranceName: '',
    paid: '', // '', 'true', 'false'
    hasGlosa: '', // '', 'true', 'false'
    minValue: '',
    maxValue: '',
    paymentDateFrom: '',
    paymentDateTo: ''
  });

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      setError(null);

      const [anesthesiasData, summaryData] = await Promise.all([
        getConvenioAnesthesias(currentUserId),
        getFinancialSummary(currentUserId)
      ]);

      setAnesthesias(anesthesiasData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError(err.message || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    let filtered = [...anesthesias];

    // Filtro por nome do paciente
    if (filters.patientName) {
      filtered = filtered.filter(anesthesia =>
        anesthesia.patientName?.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }

    // Filtro por procedimento
    if (filters.procedure) {
      filtered = filtered.filter(anesthesia => {
        const procedure = anesthesia.proposedSurgery || getProcedureDisplay(anesthesia);
        return procedure?.toLowerCase().includes(filters.procedure.toLowerCase());
      });
    }

    // Filtro por hospital
    if (filters.hospital) {
      filtered = filtered.filter(anesthesia => {
        const hospitalName = getHospitalName(anesthesia);
        return hospitalName?.toLowerCase().includes(filters.hospital.toLowerCase());
      });
    }

    // Filtro por convênio
    if (filters.insuranceName) {
      filtered = filtered.filter(anesthesia =>
        anesthesia.insuranceName?.toLowerCase().includes(filters.insuranceName.toLowerCase())
      );
    }

    // Filtro por status de pagamento
    if (filters.paid !== '') {
      const isPaid = filters.paid === 'true';
      filtered = filtered.filter(anesthesia => anesthesia.financial?.paid === isPaid);
    }

    // Filtro por glosa
    if (filters.hasGlosa !== '') {
      const hasGlosa = filters.hasGlosa === 'true';
      filtered = filtered.filter(anesthesia => anesthesia.financial?.glosa?.hasGlosa === hasGlosa);
    }

    // Filtro por valor mínimo
    if (filters.minValue !== '') {
      const minValue = parseFloat(filters.minValue);
      if (!isNaN(minValue)) {
        filtered = filtered.filter(anesthesia => 
          (anesthesia.financial?.value || 0) >= minValue
        );
      }
    }

    // Filtro por valor máximo
    if (filters.maxValue !== '') {
      const maxValue = parseFloat(filters.maxValue);
      if (!isNaN(maxValue)) {
        filtered = filtered.filter(anesthesia => 
          (anesthesia.financial?.value || 0) <= maxValue
        );
      }
    }

    // Filtro por data de pagamento
    if (filters.paymentDateFrom) {
      const fromDate = new Date(filters.paymentDateFrom);
      filtered = filtered.filter(anesthesia => {
        if (!anesthesia.financial?.paymentDate) return false;
        const paymentDate = new Date(anesthesia.financial.paymentDate);
        return paymentDate >= fromDate;
      });
    }

    if (filters.paymentDateTo) {
      const toDate = new Date(filters.paymentDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(anesthesia => {
        if (!anesthesia.financial?.paymentDate) return false;
        const paymentDate = new Date(anesthesia.financial.paymentDate);
        return paymentDate <= toDate;
      });
    }

    setFilteredAnesthesias(filtered);
    setCurrentPage(1);
  }, [anesthesias, filters]);

  // Funções auxiliares para filtros
  const getProcedureDisplay = (anesthesia) => {
    if (anesthesia.proposedSurgery) {
      return anesthesia.proposedSurgery;
    }
    
    if (anesthesia.cbhpmProcedures && anesthesia.cbhpmProcedures.length > 0) {
      const validProcedures = anesthesia.cbhpmProcedures.filter(p => p.procedimento && p.procedimento.trim() !== '');
      
      if (validProcedures.length === 0) {
        return 'Procedimento não informado';
      }
      
      if (validProcedures.length === 1) {
        return validProcedures[0].procedimento;
      } else {
        const remaining = validProcedures.length - 1;
        return `${validProcedures[0].procedimento} (+${remaining} ${remaining === 1 ? 'outro' : 'outros'})`;
      }
    }
    
    return 'Procedimento não informado';
  };

  const getHospitalName = (anesthesia) => {
    const rawHospital = anesthesia?.hospital;
  
    if (!rawHospital) return 'Não informado';
  
    if (typeof rawHospital === 'string') {
      try {
        const parsed = JSON.parse(rawHospital);
        return parsed?.name || rawHospital;
      } catch {
        return rawHospital;
      }
    }
  
    if (typeof rawHospital === 'object') {
      return rawHospital?.name || 'Não informado';
    }
  
    return 'Não informado';
  };

  // Operações CRUD
  const updateFinancialData = async (patientId, surgeryId, anesthesiaId, financialData) => {
    try {
      setError(null);
      await updateAnesthesiaFinancial(patientId, surgeryId, anesthesiaId, financialData, currentUserId);
      
      // Atualizar dados locais
      await loadData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar dados financeiros:', err);
      setError(err.message || 'Erro ao atualizar dados financeiros');
      return false;
    }
  };

  const markPaymentStatus = async (patientId, surgeryId, anesthesiaId, paid, paymentDate = null) => {
    try {
      setError(null);
      
      if (paid) {
        await markAsPaid(patientId, surgeryId, anesthesiaId, paymentDate || new Date(), currentUserId);
      } else {
        await markAsUnpaid(patientId, surgeryId, anesthesiaId, currentUserId);
      }
      
      // Atualizar dados locais
      await loadData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar status de pagamento:', err);
      setError(err.message || 'Erro ao atualizar status de pagamento');
      return false;
    }
  };

  const updateGlosaData = async (patientId, surgeryId, anesthesiaId, glosedValue) => {
    try {
      setError(null);
      await updateGlosa(patientId, surgeryId, anesthesiaId, glosedValue, currentUserId);
      
      // Atualizar dados locais
      await loadData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar glosa:', err);
      setError(err.message || 'Erro ao atualizar glosa');
      return false;
    }
  };

  // Controle de filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      patientName: '',
      procedure: '',
      hospital: '',
      insuranceName: '',
      paid: '',
      hasGlosa: '',
      minValue: '',
      maxValue: '',
      paymentDateFrom: '',
      paymentDateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  // Paginação
  const totalPages = Math.ceil(filteredAnesthesias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAnesthesias = filteredAnesthesias.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Atualizar resumo quando anestesias filtradas mudam
  const updateFilteredSummary = useCallback(async () => {
    if (filteredAnesthesias.length === 0) {
      return;
    }

    // Calcular resumo apenas das anestesias filtradas
    let totalFaturado = 0;
    let totalGlosado = 0;
    let totalFinal = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let countTotal = filteredAnesthesias.length;
    let countPaid = 0;
    let countWithGlosa = 0;

    filteredAnesthesias.forEach(anesthesia => {
      const financial = anesthesia.financial;
      if (financial) {
        totalFaturado += financial.value || 0;
        totalGlosado += financial.glosa?.glosedValue || 0;
        totalFinal += financial.glosa?.finalValue || financial.value || 0;
        
        if (financial.paid) {
          totalPago += financial.glosa?.finalValue || financial.value || 0;
          countPaid++;
        } else {
          totalPendente += financial.glosa?.finalValue || financial.value || 0;
        }
        
        if (financial.glosa?.hasGlosa) {
          countWithGlosa++;
        }
      }
    });

    const filteredSummary = {
      totalFaturado,
      totalGlosado,
      totalFinal,
      totalPago,
      totalPendente,
      counts: {
        total: countTotal,
        paid: countPaid,
        pending: countTotal - countPaid,
        withGlosa: countWithGlosa
      },
      percentages: {
        paid: countTotal > 0 ? (countPaid / countTotal) * 100 : 0,
        withGlosa: countTotal > 0 ? (countWithGlosa / countTotal) * 100 : 0
      }
    };

    setSummary(filteredSummary);
  }, [filteredAnesthesias]);

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    updateFilteredSummary();
  }, [updateFilteredSummary]);

  return {
    // Dados
    anesthesias: currentAnesthesias,
    allAnesthesias: anesthesias,
    summary,
    loading,
    error,

    // Filtros
    filters,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,

    // Paginação
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems: filteredAnesthesias.length,

    // Operações
    updateFinancialData,
    markPaymentStatus,
    updateGlosaData,
    refreshData: loadData,

    // Utilitários
    getProcedureDisplay,
    getHospitalName
  };
};