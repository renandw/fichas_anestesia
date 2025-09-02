// src/new/newfinancial/components/FinancialEditModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  AlertTriangle, 
  Save, 
  Calculator,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

const FinancialEditModal = ({ 
  isOpen, 
  onClose, 
  anesthesia, 
  onSave, 
  loading 
}) => {
  const [formData, setFormData] = useState({
    value: '',
    hasGlosa: false,
    glosedValue: '',
    paid: false,
    paymentDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [finalValue, setFinalValue] = useState(0);

  // Inicializar formulário quando anesthesia muda
  useEffect(() => {
    if (anesthesia) {
      const financial = anesthesia.financial || {};
      setFormData({
        value: financial.value || '',
        hasGlosa: financial.glosa?.hasGlosa || false,
        glosedValue: financial.glosa?.glosedValue || '',
        paid: financial.paid || false,
        paymentDate: financial.paymentDate 
          ? new Date(financial.paymentDate).toISOString().split('T')[0] 
          : '',
        notes: financial.notes || ''
      });
    }
  }, [anesthesia]);

  // Calcular valor final automaticamente
  useEffect(() => {
    const value = parseFloat(formData.value) || 0;
    const glosedValue = formData.hasGlosa ? (parseFloat(formData.glosedValue) || 0) : 0;
    setFinalValue(Math.max(0, value - glosedValue));
  }, [formData.value, formData.hasGlosa, formData.glosedValue]);

  // Formatar moeda para exibição
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Validações
  const validateForm = () => {
    const newErrors = {};

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valor é obrigatório e deve ser maior que zero';
    }

    if (formData.hasGlosa) {
      const glosedValue = parseFloat(formData.glosedValue) || 0;
      const value = parseFloat(formData.value) || 0;
      
      if (glosedValue < 0) {
        newErrors.glosedValue = 'Valor da glosa não pode ser negativo';
      }
      
      if (glosedValue > value) {
        newErrors.glosedValue = 'Valor da glosa não pode ser maior que o valor total';
      }
    }

    if (formData.paid && !formData.paymentDate) {
      newErrors.paymentDate = 'Data de pagamento é obrigatória quando marcado como pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    
    // Limpar valores relacionados quando desmarcar
    if (field === 'hasGlosa' && formData.hasGlosa) {
      setFormData(prev => ({ ...prev, glosedValue: '' }));
    }
    
    if (field === 'paid' && formData.paid) {
      setFormData(prev => ({ ...prev, paymentDate: '' }));
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const financialData = {
      value: parseFloat(formData.value),
      glosa: {
        hasGlosa: formData.hasGlosa,
        glosedValue: formData.hasGlosa ? (parseFloat(formData.glosedValue) || 0) : 0,
        finalValue: finalValue
      },
      paid: formData.paid,
      paymentDate: formData.paid && formData.paymentDate ? new Date(formData.paymentDate) : null,
      notes: formData.notes.trim()
    };

    const success = await onSave(anesthesia, financialData);
    if (success) {
      onClose();
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      value: '',
      hasGlosa: false,
      glosedValue: '',
      paid: false,
      paymentDate: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Dados Financeiros
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {anesthesia?.patientName} - {anesthesia?.code || anesthesia?.surgeryId}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Valor principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Valor do Procedimento *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">R$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  required
                />
              </div>
              {errors.value && (
                <p className="text-red-600 text-sm mt-1">{errors.value}</p>
              )}
            </div>

            {/* Glosa */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasGlosa"
                  checked={formData.hasGlosa}
                  onChange={() => handleCheckboxChange('hasGlosa')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasGlosa" className="text-sm font-medium text-gray-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                  Este procedimento teve glosa
                </label>
              </div>

              {formData.hasGlosa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Glosa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">R$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.glosedValue}
                      onChange={(e) => handleInputChange('glosedValue', e.target.value)}
                      className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors.glosedValue ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.glosedValue && (
                    <p className="text-red-600 text-sm mt-1">{errors.glosedValue}</p>
                  )}
                </div>
              )}
            </div>

            {/* Cálculo do valor final */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">Valor Final:</span>
                </div>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(finalValue)}
                </span>
              </div>
              {formData.hasGlosa && parseFloat(formData.glosedValue) > 0 && (
                <div className="text-xs text-blue-700 mt-1">
                  {formatCurrency(parseFloat(formData.value) || 0)} - {formatCurrency(parseFloat(formData.glosedValue) || 0)} = {formatCurrency(finalValue)}
                </div>
              )}
            </div>

            {/* Status de Pagamento */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid"
                  checked={formData.paid}
                  onChange={() => handleCheckboxChange('paid')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="paid" className="text-sm font-medium text-gray-700 flex items-center">
                  {formData.paid ? (
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 mr-1 text-orange-500" />
                  )}
                  Procedimento foi pago
                </label>
              </div>

              {formData.paid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.paymentDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.paymentDate}</p>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Observações sobre o pagamento, glosa, etc..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinancialEditModal;