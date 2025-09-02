// src/new/newfinancial/hooks/useMonthlySummary.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getMonthlyFinancialSummary } from '../../../services/financialService';

export const useMonthlySummary = () => {
  const { currentUserId } = useAuth();
  
  // Estados
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar resumo mensal
  const loadMonthlySummary = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      setError(null);

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const monthlyData = await getMonthlyFinancialSummary(currentUserId, year, month);
      setMonthlySummary(monthlyData);
    } catch (err) {
      console.error('Erro ao carregar resumo mensal:', err);
      setError(err.message || 'Erro ao carregar resumo mensal');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Effect inicial
  useEffect(() => {
    loadMonthlySummary();
  }, [loadMonthlySummary]);

  return {
    monthlySummary,
    loading,
    error,
    refreshMonthlySummary: loadMonthlySummary
  };
};