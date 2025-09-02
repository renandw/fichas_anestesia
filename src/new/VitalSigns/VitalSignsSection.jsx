import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Activity, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSurgeryAnesthesia, updateAnesthesia } from '../../services/anesthesiaService';
import VitalSignsForm from './VitalSignsForm';
import VitalSignsTable from './VitalSignsTable';
import VitalChartSection from './VitalChartSection';

/**
 * VitalSignsSection - Componente Principal de Sinais Vitais
 * 
 * Responsabilidades:
 * - Gerenciar estado dos sinais vitais
 * - Carregar dados do Firestore
 * - Controlar exibição do formulário de criação
 * - Coordenar CRUD de registros
 */
const VitalSignsSection = ({ 
  patientId, 
  surgeryId, 
  anesthesiaId, 
  surgery 
}) => {
  const { currentUserId } = useAuth();

  // Estados principais
  const [vitalSigns, setVitalSigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [anesthesia, setAnesthesia] = useState(null);
  
  // Estados do formulário (apenas para criação)
  const [showForm, setShowForm] = useState(false);

  // Estado para "excluir tudo" com press-and-hold
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 a 100
  const holdTimerRef = useRef(null);
  const HOLD_MS = 5000;
  const [holdMsLeft, setHoldMsLeft] = useState(HOLD_MS);
  const isHoldingRef = useRef(false);
  // Modal de confirmação custom (substitui window.confirm)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Geração de IDs estáveis e únicos para React keys
  const createId = useCallback(() => (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  ), []);

  // Normaliza/garante unicidade de IDs nos sinais vitais
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

  // Carregar dados dos sinais vitais
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

        console.log('🔍 Carregando sinais vitais...', { patientId, surgeryId });

        const fetchedAnesthesia = await getSurgeryAnesthesia(patientId, surgeryId);
        
        if (!fetchedAnesthesia) {
          setError('Anestesia não encontrada');
          setVitalSigns([]);
          setAnesthesia(null);
          return;
        }

        // Ordenar sinais vitais por timestamp
        const withIds = normalizeIds(fetchedAnesthesia.vitalSigns || []);
        const sortedVitalSigns = withIds.sort((a, b) => {
          const t1 = a.absoluteTimestamp?.toDate?.() ?? new Date(a.absoluteTimestamp);
          const t2 = b.absoluteTimestamp?.toDate?.() ?? new Date(b.absoluteTimestamp);
          return t1 - t2;
        });

        console.log('✅ Sinais vitais carregados:', sortedVitalSigns);
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
  }, [patientId, surgeryId]);

  // Normaliza diferentes formatos de timestamp para um Date válido
  const normalizeTimestamp = useCallback((val) => {
    if (!val) return null;

    // Firestore Timestamp
    if (typeof val?.toDate === 'function') {
      const d = val.toDate();
      return isNaN(d) ? null : d;
    }

    // Já é Date
    if (val instanceof Date) {
      return isNaN(val) ? null : val;
    }

    // Epoch (ms)
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d) ? null : d;
    }

    // String: tenta ISO/locale direto
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return null;

      // Tenta Data completa
      const tryDate = new Date(trimmed);
      if (!isNaN(tryDate)) return tryDate;

      // Tenta HH:mm[:ss]
      const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (m) {
        // Base: início de anestesia ou cirurgia
        const base = normalizeTimestamp(
          anesthesia?.anesthesiaStart || surgery?.startAt || surgery?.date || Date.now()
        );
        const d = new Date(base);
        const hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        const ss = m[3] ? parseInt(m[3], 10) : 0;
        d.setHours(hh, mm, ss, 0);
        return isNaN(d) ? null : d;
      }
    }

    // Não reconhecido
    return null;
  }, [anesthesia, surgery]);

  // Executa a exclusão de todos os registros
  const executeDeleteAll = useCallback(async () => {
    try {
      setIsSaving(true);
      // Limpa qualquer timer ainda ativo
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsDeletingAll(false);
      setHoldProgress(0);
      setHoldMsLeft(HOLD_MS);
      setIsConfirmOpen(false);

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesiaId,
        { vitalSigns: [] },
        currentUserId
      );

      setVitalSigns([]);
      console.log('🧹 Todos os registros de sinais vitais foram apagados.');
    } catch (err) {
      console.error('❌ Erro ao apagar todos os registros:', err);
      setError('Erro ao apagar todos os registros de sinais vitais');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, surgeryId, anesthesiaId, currentUserId]);

  // Inicia o press-and-hold
  const startHoldDelete = useCallback(() => {
    if (isSaving || vitalSigns.length === 0) return;
    const start = Date.now();
    isHoldingRef.current = true;
    setIsDeletingAll(true);
    setHoldProgress(0);
    setHoldMsLeft(HOLD_MS);

    holdTimerRef.current = setInterval(() => {
      if (!isHoldingRef.current) return; // segurança extra
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, HOLD_MS - elapsed);
      setHoldMsLeft(remaining);
      const pct = Math.min(100, Math.floor((elapsed / HOLD_MS) * 100));
      setHoldProgress(pct);
      if (elapsed >= HOLD_MS) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        isHoldingRef.current = false;
        setIsDeletingAll(false);
        setHoldProgress(100);
        setHoldMsLeft(0);
        setIsConfirmOpen(true); // abre modal em vez de excluir imediatamente
      }
    }, 100);
  }, [isSaving, vitalSigns.length, executeDeleteAll]);

  // Cancela o press-and-hold
  const cancelHoldDelete = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldingRef.current = false;
    setIsDeletingAll(false);
    setHoldProgress(0);
    setHoldMsLeft(HOLD_MS);
  }, []);
  // Cancela hold se a aba perder foco/visibilidade
  useEffect(() => {
    const cancelOnBlur = () => cancelHoldDelete();
    const cancelOnHidden = () => {
      if (document.hidden) cancelHoldDelete();
    };
    window.addEventListener('blur', cancelOnBlur);
    document.addEventListener('visibilitychange', cancelOnHidden);
    return () => {
      window.removeEventListener('blur', cancelOnBlur);
      document.removeEventListener('visibilitychange', cancelOnHidden);
    };
  }, [cancelHoldDelete]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  // Adicionar novo registro de sinais vitais
  const handleAddVitalSign = useCallback(async (newRecord) => {
    try {
      setIsSaving(true);
      console.log('📝 Adicionando novo registro:', newRecord);

      const tsSingle = normalizeTimestamp(newRecord.absoluteTimestamp);
      if (!tsSingle) throw new Error('Horário inválido no novo registro');
      const vitalSignRecord = {
        ...newRecord,
        id: createId(),
        absoluteTimestamp: tsSingle
      };

      const updatedVitalSigns = normalizeIds([...vitalSigns, vitalSignRecord]).sort((a, b) => {
        const t1 = a.absoluteTimestamp?.toDate?.() ?? new Date(a.absoluteTimestamp);
        const t2 = b.absoluteTimestamp?.toDate?.() ?? new Date(b.absoluteTimestamp);
        return t1 - t2;
      });

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesiaId,
        { vitalSigns: updatedVitalSigns },
        currentUserId
      );

      setVitalSigns(updatedVitalSigns);
      setShowForm(false);
      console.log('✅ Registro adicionado com sucesso');

    } catch (err) {
      console.error('❌ Erro ao adicionar registro:', err);
      setError('Erro ao salvar registro de sinais vitais');
    } finally {
      setIsSaving(false);
    }
  }, [normalizeTimestamp, createId, normalizeIds, vitalSigns, patientId, surgeryId, anesthesiaId, currentUserId]);

  // Adicionar múltiplos registros (modo automático)
  const handleAddMultipleVitalSigns = useCallback(async (records) => {
    try {
      setIsSaving(true);
      console.log('📝 Adicionando múltiplos registros:', records.length);

      const vitalSignRecords = records.map(record => {
        const ts = normalizeTimestamp(record.absoluteTimestamp);
        if (!ts) throw new Error('Horário inválido em um dos registros automáticos');
        return {
          ...record,
          id: createId(),
          absoluteTimestamp: ts
        };
      });

      const updatedVitalSigns = normalizeIds([...vitalSigns, ...vitalSignRecords]).sort((a, b) => {
        const t1 = a.absoluteTimestamp?.toDate?.() ?? new Date(a.absoluteTimestamp);
        const t2 = b.absoluteTimestamp?.toDate?.() ?? new Date(b.absoluteTimestamp);
        return t1 - t2;
      });

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesiaId,
        { vitalSigns: updatedVitalSigns },
        currentUserId
      );

      setVitalSigns(updatedVitalSigns);
      setShowForm(false);
      console.log('✅ Múltiplos registros adicionados com sucesso');

    } catch (err) {
      console.error('❌ Erro ao adicionar múltiplos registros:', err);
      setError('Erro ao salvar registros de sinais vitais');
    } finally {
      setIsSaving(false);
    }
  }, [normalizeTimestamp, createId, normalizeIds, vitalSigns, patientId, surgeryId, anesthesiaId, currentUserId]);

  // Editar registro existente (chamado pela VitalSignsTable)
  const handleEditVitalSign = useCallback(async (recordId, updatedData) => {
    try {
      setIsSaving(true);
      console.log('✏️ Editando registro via Table:', recordId, updatedData);
      
      if (!updatedData || (typeof updatedData === 'object' && Object.keys(updatedData).length === 0)) {
        console.warn('⚠️ Nenhuma alteração fornecida para edição. Abortando save.');
        setError('Nada para editar: abra o formulário e confirme as alterações.');
        setIsSaving(false);
        return;
      }

      const updatedVitalSigns = vitalSigns.map(vs => {
        if (vs.id !== recordId) return vs;
        const tsEdit = normalizeTimestamp(updatedData.absoluteTimestamp ?? vs.absoluteTimestamp);
        if (!tsEdit) throw new Error('Horário inválido ao editar');
        return { ...vs, ...updatedData, absoluteTimestamp: tsEdit };
      }).map(v => ({ ...v, id: typeof v.id === 'string' ? v.id : String(v.id) }))
        .sort((a, b) => {
          const t1 = a.absoluteTimestamp?.toDate?.() ?? new Date(a.absoluteTimestamp);
          const t2 = b.absoluteTimestamp?.toDate?.() ?? new Date(b.absoluteTimestamp);
          return t1 - t2;
        });

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesiaId,
        { vitalSigns: updatedVitalSigns },
        currentUserId
      );

      setVitalSigns(updatedVitalSigns);
      setError(null);
      
      console.log('🔔 Alterações confirmadas e salvas via Table.');
      console.log('✅ Registro editado com sucesso');

    } catch (err) {
      console.error('❌ Erro ao editar registro:', err);
      setError(err?.message?.includes('Horário inválido') ? err.message : 'Erro ao atualizar registro de sinais vitais');
    } finally {
      setIsSaving(false);
    }
  }, [vitalSigns, normalizeTimestamp, patientId, surgeryId, anesthesiaId, currentUserId]);

  // Deletar registro
  const handleDeleteVitalSign = useCallback(async (recordId) => {
    try {
      setIsSaving(true);
      console.log('🗑️ Deletando registro:', recordId);

      const filteredVitalSigns = vitalSigns.filter(vs => vs.id !== recordId);

      await updateAnesthesia(
        patientId,
        surgeryId,
        anesthesiaId,
        { vitalSigns: filteredVitalSigns },
        currentUserId
      );

      setVitalSigns(filteredVitalSigns);
      console.log('✅ Registro deletado com sucesso');

    } catch (err) {
      console.error('❌ Erro ao deletar registro:', err);
      setError('Erro ao deletar registro de sinais vitais');
    } finally {
      setIsSaving(false);
    }
  }, [vitalSigns, patientId, surgeryId, anesthesiaId, currentUserId]);

  // Iniciar criação de novo registro
  const handleStartCreate = useCallback(() => {
    console.log('➕ Iniciando criação de novo registro');
    setShowForm(true);
    setError(null);
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Cancelar formulário de criação
  const handleCancelForm = useCallback(() => {
    console.log('❌ Cancelando formulário de criação');
    setShowForm(false);
    setError(null);
  }, []);

  // Recarregar dados
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Altura responsiva para o gráfico (mobile vs desktop)
  const chartHeight = useMemo(() => (
    typeof window !== 'undefined' && window.innerWidth < 640 ? 260 : 380
  ), []);

  // Validação de props
  if (!patientId || !surgeryId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Erro: IDs de paciente ou cirurgia não fornecidos</p>
      </div>
    );
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="p-4">
        {/* Mobile skeleton */}
        <div className="sm:hidden space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {/* Desktop spinner unchanged */}
        <div className="hidden sm:flex flex-col items-center text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sinais vitais...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg mx-auto shadow-sm transition active:translate-y-px hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20 sm:pb-0">
      {/* 1. HEADER COM BOTÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sinais Vitais</h3>
              {/* Mobile badge with count */}
              <span className="sm:hidden inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {vitalSigns.length}
                <span>reg.</span>
              </span>
            </div>
            {/* Desktop subtitle remains */}
            <p className="hidden sm:block text-sm text-gray-600">
              {vitalSigns.length} registro{vitalSigns.length !== 1 ? 's' : ''} encontrado{vitalSigns.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {!showForm && (
          <div className="hidden sm:flex items-center gap-2">
            {vitalSigns.length > 0 && (
              <button
                onMouseDown={startHoldDelete}
                onMouseUp={cancelHoldDelete}
                onMouseLeave={cancelHoldDelete}
                onTouchStart={startHoldDelete}
                onTouchEnd={cancelHoldDelete}
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transition"
                title="Segure para iniciar exclusão"
                onContextMenu={(e) => e.preventDefault()}
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">
                  {isDeletingAll ? 'Segure para excluir' : 'Excluir tudo'}
                </span>
                {isDeletingAll && (
                  <span className="ml-2 text-[11px] opacity-90">
                    {Math.ceil(holdMsLeft / 1000)}s
                  </span>
                )}
                {/* barra de progresso */}
                <span
                  className="absolute left-0 top-0 h-full bg-red-800/30 transition-[width]"
                  style={{ width: `${holdProgress}%` }}
                />
              </button>
            )}

            <button
              onClick={handleStartCreate}
              disabled={isSaving}
              className="sm:w-auto inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Registro
            </button>
          </div>
        )}
      </div>

      {/* Indicador de salvamento */}
      {isSaving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-800 text-sm">Salvando alterações...</p>
          </div>
        </div>
      )}

      {/* 2. FORMULÁRIO DE CRIAÇÃO (apenas quando showForm = true) */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <VitalSignsForm 
            mode="create"
            surgery={surgery}
            anesthesia={anesthesia}
            vitalSigns={vitalSigns}
            onAddSingle={handleAddVitalSign}
            onAddMultiple={handleAddMultipleVitalSigns}
            onCancel={handleCancelForm}
            isSubmitting={isSaving}
          />
        </div>
      )}

      {/* 3. VISUALIZAÇÃO (GRÁFICO) */}
      {vitalSigns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 -mx-3 sm:mx-0 overflow-hidden">
         <VitalChartSection
            vitalSigns={vitalSigns}        
            surgery={surgery}
            anesthesia={anesthesia}        
            isLoading={isLoading}          
            error={error}                  
            height={400}
            compact={false}
          />
        </div>
      )}

      {/* 4. TABELA DE REGISTROS */}
      {vitalSigns.length > 0 ? (
            <VitalSignsTable 
              vitalSigns={vitalSigns}
              onEdit={handleEditVitalSign}
              onDelete={handleDeleteVitalSign}
              isLoading={isSaving}
            />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h4>
          <p className="text-gray-600 mb-4">
            Comece adicionando o primeiro registro de sinais vitais.
          </p>
          {!showForm && (
            <button 
              onClick={handleStartCreate}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Registro
            </button>
          )}
        </div>
      )}

      {/* Debug info - remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs text-gray-600">
          <p><strong>Debug:</strong> Patient: {patientId} | Surgery: {surgeryId} | Anesthesia: {anesthesiaId}</p>
          <p><strong>Records:</strong> {vitalSigns.length} | Form: {showForm ? 'create' : 'Hidden'}</p>
          <p><strong>AnesthesiaStart:</strong> {anesthesia?.anesthesiaStart ? 'OK' : '—'}</p>
        </div>
      )}
      {/* 5. MOBILE FAB BUTTON */}
      {!showForm && (
        <>
          {vitalSigns.length > 0 && (
            <button
              onMouseDown={startHoldDelete}
              onMouseUp={cancelHoldDelete}
              onMouseLeave={cancelHoldDelete}
              onTouchStart={startHoldDelete}
              onTouchEnd={cancelHoldDelete}
              disabled={isSaving}
              onContextMenu={(e) => e.preventDefault()}
              className={
                `sm:hidden fixed bottom-4 right-20 ` +
                `h-12 rounded-full shadow-lg bg-red-600 text-white flex items-center ` +
                `focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ` +
                `transition-all duration-200 ` +
                `${isDeletingAll ? 'w-56 px-4 justify-between' : 'w-12 justify-center'}`
              }
              aria-label="Excluir todos os registros"
              title={isDeletingAll ? `Segurando… ${Math.ceil(holdMsLeft / 1000)}s` : 'Segure para iniciar exclusão'}
            >
              {/* Ordem: progresso (esq) → texto (meio) → ícone (dir) */}
              {isDeletingAll && (
                <div className="relative flex items-center">
                  <svg width="28" height="28" viewBox="0 0 36 36" className="block">
                    {/* trilha */}
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                    {/* progresso */}
                    {
                      (() => {
                        const r = 15;
                        const c = 2 * Math.PI * r;
                        const pct = Math.min(100, Math.max(0, holdProgress));
                        const offset = c * (1 - pct / 100);
                        return (
                          <circle
                            cx="18"
                            cy="18"
                            r={r}
                            fill="none"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={c}
                            strokeDashoffset={offset}
                            transform="rotate(-90 18 18)"
                          />
                        );
                      })()
                    }
                  </svg>
                </div>
              )}

              {isDeletingAll && (
                <span className="mx-3 text-[12px] font-medium whitespace-nowrap">
                  Segure {Math.ceil(holdMsLeft / 1000)}s
                </span>
              )}

              {/* Ícone sempre visível (centralizado quando não está segurando) */}
              <div className={`flex items-center ${isDeletingAll ? '' : ''}`}>
                <Trash2 className={`w-5 h-5 ${isDeletingAll ? '' : ''}`} />
              </div>
            </button>
          )}

          <button
            onClick={handleStartCreate}
            disabled={isSaving}
            className="sm:hidden fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center active:translate-y-px hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Novo Registro"
            title="Novo Registro"
          >
            <Plus className="w-5 h-5" />
          </button>
        </>
      )}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsConfirmOpen(false)}
          />
          {/* modal */}
          <div 
            role="dialog" 
            aria-modal="true"
            className="relative w-full sm:w-[28rem] bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-4 sm:p-6 z-10"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                  Apagar todos os registros?
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Esta ação apagará <strong>todos</strong> os registros de sinais vitais desta anestesia. Não será possível desfazer.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row-reverse gap-2 sm:gap-3">
              <button
                onClick={executeDeleteAll}
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4" />
                Apagar tudo
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalSignsSection;