// src/new/newfinancial/components/PaymentActions.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  X
} from 'lucide-react';

const PaymentActions = ({ 
  anesthesia, 
  onMarkAsPaid, 
  onMarkAsUnpaid, 
  onAddValue,
  onUpdateGlosa,
  loading 
}) => {
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Verificar se tem dados financeiros
  const hasFinancialData = anesthesia.financial && anesthesia.financial.value > 0;
  const isPaid = anesthesia.financial?.paid;
  const hasGlosa = anesthesia.financial?.glosa?.hasGlosa;

  // Quick payment handler
  const handleQuickPayment = async () => {
    if (!paymentDate) return;
    
    const success = await onMarkAsPaid(anesthesia, new Date(paymentDate));
    if (success) {
      setShowQuickPayment(false);
    }
  };

  // Quick unpaid handler
  const handleMarkAsUnpaid = async () => {
    await onMarkAsUnpaid(anesthesia);
  };

  return (
    <div className="flex flex-wrap gap-2">
      
      {/* Adicionar valor - quando não tem dados financeiros */}
      {!hasFinancialData && (
        <button
          onClick={() => onAddValue(anesthesia)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <DollarSign className="h-3 w-3 mr-1" />
          Adicionar Valor
        </button>
      )}

      {/* Ações quando tem dados financeiros */}
      {hasFinancialData && (
        <>
          {/* Marcar como pago/pendente */}
          {!isPaid ? (
            <div className="relative">
              {!showQuickPayment ? (
                <button
                  onClick={() => setShowQuickPayment(true)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 rounded-md hover:bg-green-100 focus:ring-2 focus:ring-green-500 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Marcar Pago
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-white border border-green-300 rounded-md p-2 shadow-sm">
                  <Calendar className="h-3 w-3 text-green-600" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="border-0 text-xs focus:ring-0 p-0 w-24"
                    required
                  />
                  <button
                    onClick={handleQuickPayment}
                    disabled={loading || !paymentDate}
                    className="text-green-700 hover:text-green-900 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setShowQuickPayment(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleMarkAsUnpaid}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-orange-300 text-orange-700 bg-orange-50 rounded-md hover:bg-orange-100 focus:ring-2 focus:ring-orange-500 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Clock className="h-3 w-3 mr-1" />
              Marcar Pendente
            </button>
          )}

          {/* Adicionar/remover glosa */}
          {!hasGlosa ? (
            <button
              onClick={() => onUpdateGlosa(anesthesia, 'add')}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:ring-2 focus:ring-red-500 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Adicionar Glosa
            </button>
          ) : (
            <div className="inline-flex items-center">
              <span className="inline-flex items-center px-2 py-1 rounded-l-md bg-red-100 text-red-800 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {formatCurrency(anesthesia.financial.glosa.glosedValue)}
              </span>
              <button
                onClick={() => onUpdateGlosa(anesthesia, 'edit')}
                disabled={loading}
                className="px-2 py-1 border-l border-red-300 bg-red-50 text-red-700 hover:bg-red-100 rounded-r-md text-xs transition-colors disabled:opacity-50"
              >
                Editar
              </button>
            </div>
          )}
        </>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="inline-flex items-center px-3 py-1.5">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default PaymentActions;