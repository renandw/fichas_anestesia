import React from 'react';
import { 
  Calendar,
  Clock,
  Stethoscope,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const SurgeryForm = ({
  surgeryData,
  onChange,
  onSubmit,
  isLoading = false,
  submitButtonText = "Criar Cirurgia"
}) => {
  const handleInputChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!surgeryData.surgeryDate || !surgeryData.surgeryTime) {
      toast.error('Data e hora são obrigatórias');
      return;
    }

    if (!surgeryData.patientPosition) {
      toast.error('Posicionamento do paciente é obrigatório');
      return;
    }

    onSubmit(surgeryData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Data da Cirurgia *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              className="input-field pl-10"
              value={surgeryData.surgeryDate}
              onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Hora de Início *</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="time"
              className="input-field pl-10"
              value={surgeryData.surgeryTime}
              onChange={(e) => handleInputChange('surgeryTime', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Posicionamento do Paciente *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="input-field pl-10"
            value={surgeryData.patientPosition}
            onChange={(e) => handleInputChange('patientPosition', e.target.value)}
            required
          >
            <option value="">Selecione o posicionamento</option>
            <option value="Decúbito Dorsal">Decúbito Dorsal</option>
            <option value="Decúbito Ventral">Decúbito Ventral</option>
            <option value="Decúbito Lateral direito">Decúbito Lateral direito</option>
            <option value="Decúbito Lateral esquerdo">Decúbito Lateral esquerdo</option>
            <option value="Trendelenburg">Trendelenburg</option>
            <option value="Canivete">Canivete</option>
            <option value="Litotomia">Litotomia</option>
            <option value="Cadeira de Praia">Cadeira de Praia</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Observações Iniciais</label>
        <textarea
          className="input-field"
          rows="3"
          placeholder="Observações sobre o início da cirurgia (opcional)"
          value={surgeryData.observations}
          onChange={(e) => handleInputChange('observations', e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner mr-2"></div>
              {submitButtonText.includes('...') ? submitButtonText : `${submitButtonText}...`}
            </>
          ) : (
            <>
              <Stethoscope className="h-4 w-4 mr-2" />
              {submitButtonText}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SurgeryForm;