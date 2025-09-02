import React, { useState } from 'react';
import useVitalSigns from './useVitalSigns';
import PreviewWrapper from './PreviewWrapper';
import AnesthesiaSheet from './AnesthesiaSheet';
import PrintContainer from './PrintContainer';
import PreAnestheticSheet from './PreAnestheticSheet';

import { normalizeAnesthesiaRecord } from '../../services/anesthesiaService';
import { X, CheckCircle2, Loader2, AlertTriangle, XCircle } from 'lucide-react';

// Toast simples (sucesso/erro) – responsivo
const Toast = ({ open, type = 'success', message, onClose }) => {
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 3500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  const base = "fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-[110] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm";
  const theme = type === 'error'
    ? 'bg-red-600 text-white'
    : 'bg-emerald-600 text-white';

  if (!open) return null;
  return (
    <div className={`${base} ${theme}`} role="status" aria-live="polite">
      {type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      <span className="max-w-[80vw] sm:max-w-md break-words">{message}</span>
      <button onClick={onClose} aria-label="Fechar" className="ml-2/5 p-1/5 opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Modal de confirmação (responsivo: mobile e desktop)
const ConfirmModal = ({ open, title, description, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel, busy = false }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 px-2 sm:px-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md md:rounded-xl bg-white shadow-xl rounded-t-2xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 hidden sm:block" />
            <div className="flex-1">
              <h2 id="confirm-modal-title" className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
            <button
              onClick={onCancel}
              disabled={busy}
              className="p-2 -mr-2 sm:-mr-3 text-gray-500 hover:text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onCancel}
              disabled={busy}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnesthesiaPreview = ({ patient, surgery, anesthesia, patientId, surgeryId, preAnesthesia }) => {
  const [scale, setScale] = useState(0.7);
  const [sheetType, setSheetType] = useState('anesthesia'); // 'anesthesia' | 'preanesthesia'
  const [responsibleResolved, setResponsibleResolved] = useState(null);
  const [responsibleLoading, setResponsibleLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 1.2;
  const { 
    vitalSigns, 
    anesthesia: freshAnesthesia, 
    isLoading: vitalSignsLoading, 
    error: vitalSignsError 
  } = useVitalSigns(patientId, surgeryId);

  const displayAnesthesia = React.useMemo(() => {
    const rec = freshAnesthesia || anesthesia;
    try {
      return normalizeAnesthesiaRecord ? normalizeAnesthesiaRecord(rec) : rec;
    } catch {
      return rec;
    }
  }, [freshAnesthesia, anesthesia]);
  const displayVitalSigns = vitalSigns;
  const chartHeight = 250;

  const formatUserAsResponsible = (u) => {
    if (!u) return null;
    const name = u.name || u.displayName || u.nome;
    const crm = u.crm || u.CRM || u.registro;
    if (name) return crm ? `${name} CRM ${crm}` : name;
    return null;
  };

  // Try to resolve responsible from Firestore if createdBy is a UID
  React.useEffect(() => {
    const createdBy = surgery?.metadata?.createdBy;
    if (!createdBy || typeof createdBy !== 'string') {
      setResponsibleResolved(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setResponsibleLoading(true);
        // Dynamic imports to avoid hard dependency if Firebase is not present here
        const appMod = await import('firebase/app');
        const { getApps, getApp } = appMod;
        const apps = getApps();
        if (!apps || apps.length === 0) {
          // No initialized Firebase app — give up silently
          return;
        }
        const app = getApp();
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, 'users', createdBy));
        if (!cancelled && snap.exists()) {
          const u = snap.data();
          const display = formatUserAsResponsible(u);
          if (display) setResponsibleResolved(display);
        }
      } catch (e) {
        // swallow errors; fallback will display uid or raw string
      } finally {
        if (!cancelled) setResponsibleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [surgery?.metadata?.createdBy]);

  const data = {
    patient,
    surgery,
    anesthesia: displayAnesthesia
  };

  // ===== HELPER FUNCTIONS =====

  // Utilitário: detectar Timestamp do Firestore (plain ou SDK)
  const isFsTimestamp = (v) =>
    v && typeof v === 'object' && (("seconds" in v && "nanoseconds" in v) || typeof v.toDate === 'function');

  // Converte valores diversos em Date local sem surpresas de UTC
  const toDate = (value, { referenceDate } = {}) => {
    if (!value) return null;

    if (isFsTimestamp(value)) {
      return typeof value.toDate === 'function' ? value.toDate() : new Date(value.seconds * 1000);
    }

    if (value instanceof Date) return isNaN(value) ? null : value;

    if (typeof value === 'string') {
      const trimmed = value.trim();

      // YYYY-MM-DD → construir Date local (evita shift para UTC)
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('-').map(Number);
        return new Date(y, m - 1, d);
      }

      // DD/MM/YYYY → BR
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const [d, m, y] = trimmed.split('/').map(Number);
        return new Date(y, m - 1, d);
      }

      // Apenas hora HH:MM → ancora na referenceDate (ou hoje)
      if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        const [h, mi] = trimmed.split(':').map(Number);
        const base = toDate(referenceDate) || new Date();
        return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mi, 0, 0);
      }

      const d2 = new Date(trimmed);
      return isNaN(d2) ? null : d2;
    }

    return null;
  };

  // Formata data usando fuso fixo para determinismo
  const formatDate = (value, { timeZone = 'America/Porto_Velho', locale = 'pt-BR' } = {}) => {
    const d = toDate(value);
    if (!d) return '';
    return new Intl.DateTimeFormat(locale, { timeZone }).format(d);
  };

  // Função para converter Firestore Timestamp para string (determinística por fuso)
  const formatFirestoreDate = (dateValue) => {
    return formatDate(dateValue, { timeZone: 'America/Porto_Velho' });
  };

  // Formatar hora a partir de string/Date/Timestamp; se vier apenas HH:MM, ancora em referenceDate
  const formatTime = (value, opts = {}) => {
    const { referenceDate, timeZone = 'America/Porto_Velho', locale = 'pt-BR' } = opts;
    const d = toDate(value, { referenceDate });
    if (!d) return '';
    return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
  };

  // Parse helper: accepts Firestore Timestamp, Date, or string in 'YYYY-MM-DD' or 'DD/MM/YYYY'
  const parseDateStrict = (value) => {
    if (!value) return null;

    // Firestore Timestamp
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      return new Date(value.seconds * 1000);
    }

    // Already a Date
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();

      // ISO date only (YYYY-MM-DD) – construct local date to avoid UTC shift
      const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
      if (isoMatch) {
        const [y, m, d] = trimmed.split('-').map(Number);
        return new Date(y, m - 1, d); // local date, no timezone conversion
      }

      // Brazilian format (DD/MM/YYYY)
      const brMatch = trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/);
      if (brMatch) {
        const [d, m, y] = trimmed.split('/').map(Number);
        return new Date(y, m - 1, d);
      }

      // Fallback: try native Date (may include time component)
      const d2 = new Date(trimmed);
      if (!isNaN(d2.getTime())) return d2;
      return null;
    }

    return null;
  };


  // Helpers para diferença precisa em anos/meses/dias e formatação por faixa etária
  const daysInMonth = (year, month /* 0-11 */) => new Date(year, month + 1, 0).getDate();

  const diffYMD = (startDate, endDate) => {
    const start = parseDateStrict(startDate);
    const end = parseDateStrict(endDate) || new Date();
    if (!start || !end) return null;

    let y = end.getFullYear() - start.getFullYear();
    let m = end.getMonth() - start.getMonth();
    let d = end.getDate() - start.getDate();

    if (d < 0) {
      // empresta dias do mês anterior ao "end"
      const prevMonth = (end.getMonth() - 1 + 12) % 12;
      const prevMonthYear = prevMonth === 11 ? end.getFullYear() - 1 : end.getFullYear();
      d += daysInMonth(prevMonthYear, prevMonth);
      m -= 1;
    }
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    if (y < 0) return null; // end antes de start
    return { years: y, months: m, days: d };
  };

  const plural = (n, s, p) => (n === 1 ? s : (p || s + 's'));


  const formatAge = (birthDate, referenceDate) => {
    const parts = diffYMD(birthDate, referenceDate);
    if (!parts) return null;
    const { years: y, months: m, days: d } = parts;

    if (y >= 14) {
      return `${y} ${plural(y, 'ano')}`;
    }

    if (y >= 1) {
      // 1 a 13 anos → anos e meses
      if (m > 0) return `${y} ${plural(y, 'ano')} e ${m} ${plural(m, 'mês', 'meses')}`;
      return `${y} ${plural(y, 'ano')}`;
    }

    // < 1 ano
    if (m >= 1) {
      // meses e (opcional) dias
      if (d > 0) return `${m} ${plural(m, 'mês', 'meses')} e ${d} ${plural(d, 'dia')}`;
      return `${m} ${plural(m, 'mês', 'meses')}`;
    }

    // < 1 mês → dias
    return `${d} ${plural(d, 'dia')}`;
  };

  // Converte um valor de horário (Timestamp/Date/string) para um Date completo
  // Se for apenas "HH:MM", ancora na referenceDate (ex.: data da cirurgia)
  const toDateFromTimeLike = (value, referenceDate) => {
    if (!value) return null;

    // Firestore Timestamp
    if (isFsTimestamp(value)) return new Date(value.seconds * 1000);

    // Date nativa
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      const str = value.trim();

      // Apenas hora HH:MM
      if (/^\d{1,2}:\d{2}$/.test(str)) {
        const [h, m] = str.split(':').map(Number);
        const base = parseDateStrict(referenceDate) || new Date();
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
        return d;
      }

      // Qualquer outra string: deixar o motor do Date interpretar (pode conter data+timezone)
      const d2 = new Date(str);
      return isNaN(d2) ? null : d2;
    }

    return null;
  };

  // Retorna o instante Date de uma medicação, priorizando `timestamp` quando existir
  const getMedicationInstant = (med, referenceDate) => {
    if (!med) return null;
    // Prioriza timestamp completo; se não houver, usa time
    const source = med.timestamp ?? med.time;
    return toDateFromTimeLike(source, referenceDate);
  };

  // Formata a hora da medicação usando o instante calculado (HH:MM)
  const formatMedicationTime = (med, referenceDate) => {
    const d = getMedicationInstant(med, referenceDate);
    if (!d) return '';
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Porto_Velho', hour: '2-digit', minute: '2-digit' }).format(d);
  };

  // Organizar medicações
  const organizeMedications = (medications, referenceDate) => {
    if (!medications || !Array.isArray(medications)) {
      return {
        'VR': [],
        'Cristalóide': [],
        'Hemoderivados': [],
        'EV': [],
        'IT': [],
        'PD': [],
        'PN': [],
        'IM': [],
        'SC': [],
        'SL': [],
        'IN': [],
        'TOP': [],
        'VO': []
      };
    }

    const getMillisFromMed = (med) => {
      const d = getMedicationInstant(med, referenceDate);
      return d ? d.getTime() : Number.POSITIVE_INFINITY; // sem horário → final
    };
    const sorted = [...medications].sort((a, b) => getMillisFromMed(a) - getMillisFromMed(b));

    const groups = {
      'VR': [],
      'Cristalóide': [],
      'Hemoderivados': [],
      'EV': [],
      'IT': [],
      'PD': [],
      'PN': [],
      'IM': [],
      'SC': [],
      'SL': [],
      'IN': [],
      'TOP': [],
      'VO': []
    };

    sorted.forEach(med => {
      if (med.via === 'Respiratória') {
        groups['VR']?.push(med); // unifica com VR (Via Respiratória)
      } else if (med.category === 'Cristalóide') {
        groups['Cristalóide'].push(med);
      } else if (med.category === 'Hemoderivados') {
        groups['Hemoderivados'].push(med);
      } else {
        groups[med.via]?.push(med);
      }
    });

    return groups;
  };

  // Rótulos legíveis para vias de administração
  const VIA_LABELS = {
    'EV': 'Endovenoso',
    'IM': 'Intramuscular',
    'IT': 'Intratecal',
    'PD': 'Peridural',
    'PN': 'Perineural',
    'SC': 'Subcutâneo',
    'SL': 'Sublingual',
    'IN': 'Intranasal',
    'TOP': 'Tópico',
    'VO': 'Via Oral',
    'VR': 'Via Respiratória'
  };

  const formatMedicationGroup = (groupName, medications) => {
    if (!medications || medications.length === 0) return null;

    // Mantém rótulos especiais como estão; mapeia códigos de via para nomes completos
    const specialLabels = new Set(['Respiratória', 'Cristalóide', 'Hemoderivados']);
    const displayName = specialLabels.has(groupName) ? groupName : (VIA_LABELS[groupName] || groupName);

    const medsText = medications
      .map(med => `${med.name} ${med.dose} (${formatMedicationTime(med, data.surgery?.surgeryDate) || '--:--'})`)
      .join('; ');

    return { groupLabel: displayName, medsText };
  };

  // Normaliza lista de procedimentos CBHPM (aceita diferentes chaves)
  const normalizeCbhpmProcedures = (arr = []) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((p) => ({
      code: p.code ?? p.codigo ?? p.cod ?? p.id ?? '',
      description: p.description ?? p.procedimento ?? p.desc ?? '',
      porte: p.porte ?? p.porte_anestesico ?? p.porteAnestesico ?? ''
    }));
  };

  // ===== EVENT HANDLERS =====
  const showSuccess = (msg) => setToast({ open: true, type: 'success', message: msg });
  const showError = (msg) => setToast({ open: true, type: 'error', message: msg });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const openFinalizeConfirm = () => setConfirmOpen(true);
  const closeFinalizeConfirm = () => { if (!confirmBusy) setConfirmOpen(false); };
  const confirmFinalize = async () => {
    try {
      setConfirmBusy(true);
      await handleFinalize();
      setConfirmOpen(false);
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleFinalize = async () => {
    try {
      // Resolve IDs
      const anesthesiaId = displayAnesthesia?.id ?? anesthesia?.id;
      if (!patientId || !surgeryId || !anesthesiaId) {
        console.error('IDs insuficientes para finalizar (patientId, surgeryId, anesthesiaId).');
        showError('Não foi possível finalizar: IDs incompletos.');
        return;
      }

      // Tenta obter o usuário atual do Firebase Auth (se disponível)
      let currentUserId = null;
      try {
        const appMod = await import('firebase/app');
        const { getApps, getApp } = appMod;
        const apps = getApps();
        if (apps && apps.length > 0) {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth(getApp());
          currentUserId = auth?.currentUser?.uid || null;
        }
      } catch (e) {
        // sem Firebase Auth inicializado — segue sem currentUserId
      }

      // Importes dinâmicos para evitar hard dependency no bundle
      const anesthesiaSvc = await import('../../services/anesthesiaService');

      // Chama as duas finalizações (passe um objeto com dados finais se necessário)
      await anesthesiaSvc.finalizeAnesthesiaAndSurgery(
        patientId,
        surgeryId,
        anesthesiaId,
        {},
        {},
        currentUserId
      );

      showSuccess('Ficha anestésica finalizada com sucesso.');
    } catch (err) {
      console.error('Erro ao finalizar ficha anestésica:', err);
      showError('Falha ao finalizar a ficha anestésica. Verifique e tente novamente.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleScaleChange = (newScale) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    if (clamped !== newScale) {
      setToast({
        open: true,
        type: 'error',
        message: clamped === MIN_SCALE ? 'Zoom mínimo atingido' : 'Zoom máximo atingido'
      });
    }
    setScale(clamped);
  };

  const handleSheetTypeChange = (newSheetType) => {
    setSheetType(newSheetType);
  };

  // ===== COMPUTED VALUES =====

  const medicationGroups = organizeMedications(data.anesthesia?.medications || [], data.surgery?.surgeryDate);

  // Props para AnesthesiaSheet
  const anesthesiaSheetProps = {
    data,
    responsibleResolved,
    medicationGroups,
    displayVitalSigns,
    displayAnesthesia,
    vitalSignsLoading,
    vitalSignsError,
    surgery,
    chartHeight,
    formatFirestoreDate,
    formatTime,
    formatAge,
    formatMedicationTime,
    formatMedicationGroup,
    normalizeCbhpmProcedures
  };
  
  // Props para PreAnestheticSheet
  const preanestheticSheetProps = {
    data,
    responsibleResolved,
    preAnesthesia,
    formatFirestoreDate,
    formatTime,
    normalizeCbhpmProcedures,
    formatAge
  };
  
  // Componente selecionado baseado no sheetType
  const selectedSheet = sheetType === 'anesthesia' 
    ? <AnesthesiaSheet {...anesthesiaSheetProps} />
    : <PreAnestheticSheet {...preanestheticSheetProps} />;

  // ===== FINALIZE BUTTON STATE =====
  const anesthesiaCompleted = displayAnesthesia?.status === 'Concluída';
  const surgeryCompleted = surgery?.status === 'Concluída';
  const bothCompleted = anesthesiaCompleted && surgeryCompleted;
  const inconsistent = (anesthesiaCompleted && !surgeryCompleted) || (!anesthesiaCompleted && surgeryCompleted);

  const finalizeExtraAction = (
    bothCompleted ? (
      <span
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
        title={`Concluída${surgery?.metadata?.finishedAt ? ` em ${formatFirestoreDate(surgery?.metadata?.finishedAt)}` : ''}`}
      >
        <CheckCircle2 className="w-4 h-4" />
        Concluída
      </span>
    ) : inconsistent ? (
      <span
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200"
        title="Estados diferentes entre anestesia e cirurgia"
      >
        <AlertTriangle className="w-4 h-4" />
        Inconsistência
      </span>
    ) : null
  );

  return (
    <div className="screen-version pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 print:pb-0">
       <PreviewWrapper
          scale={scale} 
          onScaleChange={handleScaleChange} 
          onPrint={handlePrint}
          onFinalize={bothCompleted ? undefined : openFinalizeConfirm}
          extraActions={finalizeExtraAction}
          sheetType={sheetType}
          onSheetTypeChange={handleSheetTypeChange}
        >
          {selectedSheet}
      </PreviewWrapper>
  
      <PrintContainer>
        {selectedSheet}
      </PrintContainer>
      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={closeToast} />
      <ConfirmModal
        open={confirmOpen}
        title="Finalizar ficha anestésica?"
        description="Depois de finalizada, a ficha será marcada como concluída. Verifique se todas as informações estão corretas."
        confirmText="Finalizar agora"
        cancelText="Cancelar"
        onConfirm={confirmFinalize}
        onCancel={closeFinalizeConfirm}
        busy={confirmBusy}
      />
    </div>
  );
};

export default AnesthesiaPreview;