import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSurgeryAnesthesia } from '../../services/anesthesiaService';

/**
 * Hook simples para carregar e processar dados de sinais vitais
 * Foco apenas nos dados necessários para o VitalChart
 */
const useVitalSigns = (patientId, surgeryId) => {
  const [vitalSigns, setVitalSigns] = useState([]);
  const [anesthesia, setAnesthesia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Geração de IDs únicos
  const createId = useCallback(() => (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  ), []);

  // Normaliza IDs para garantir unicidade
  const normalizeIds = useCallback((arr = []) => {
    const seen = new Set();
    return arr.map((item) => {
      let id = item.id ?? createId();
      if (typeof id !== 'string') id = String(id);
      if (seen.has(id)) {
        id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
      }
      seen.add(id);
      return { ...item, id };
    });
  }, [createId]);


  useEffect(() => {
    const loadVitalSigns = async () => {
      if (!patientId || !surgeryId) {
        setError('IDs de paciente ou cirurgia não fornecidos');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const fetchedAnesthesia = await getSurgeryAnesthesia(patientId, surgeryId);
        
        if (!fetchedAnesthesia) {
          setError('Anestesia não encontrada');
          setVitalSigns([]);
          setAnesthesia(null);
          return;
        }

        // Processar e ordenar sinais vitais
        const withIds = normalizeIds(fetchedAnesthesia.vitalSigns || []);
        const sortedVitalSigns = withIds.sort((a, b) => {
          const t1 = a.absoluteTimestamp?.toDate?.() ?? new Date(a.absoluteTimestamp);
          const t2 = b.absoluteTimestamp?.toDate?.() ?? new Date(b.absoluteTimestamp);
          return t1 - t2;
        });

        setVitalSigns(sortedVitalSigns);
        setAnesthesia(fetchedAnesthesia);

      } catch (err) {
        console.error('❌ Erro ao carregar sinais vitais:', err);
        setError('Erro ao carregar sinais vitais');
        setVitalSigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVitalSigns();
  }, [patientId, surgeryId]); // Remover normalizeIds daqui

  // Dados processados prontos para o VitalChart
  const chartData = useMemo(() => ({
    vitalSigns,
    anesthesia
  }), [vitalSigns, anesthesia]);

  return {
    vitalSigns,
    anesthesia,
    isLoading,
    error,
    chartData
  };
};

export default useVitalSigns;