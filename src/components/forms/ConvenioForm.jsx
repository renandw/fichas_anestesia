import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, Send } from 'lucide-react';

const ConvenioForm = ({ patientData, template, onSubmit, onSaveDraft }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ficha Anestésica Convênio
        </h2>
        <p className="text-sm text-gray-600">
          Paciente: {patientData?.name} | Template: {template?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Dados básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Horário de Início</label>
            <input
              type="time"
              className="input-field"
              {...register('startTime', { required: 'Horário de início é obrigatório' })}
            />
            {errors.startTime && <p className="error-text">{errors.startTime.message}</p>}
          </div>

          <div>
            <label className="label">Horário de Término</label>
            <input
              type="time"
              className="input-field"
              {...register('endTime')}
            />
          </div>
        </div>

        <div>
          <label className="label">Tipo de Anestesia</label>
          <select
            className="input-field"
            {...register('anesthesiaType', { required: 'Tipo de anestesia é obrigatório' })}
          >
            <option value="">Selecione</option>
            <option value="geral">Geral</option>
            <option value="regional">Regional</option>
            <option value="local">Local</option>
            <option value="sedacao">Sedação</option>
          </select>
          {errors.anesthesiaType && <p className="error-text">{errors.anesthesiaType.message}</p>}
        </div>

        <div>
          <label className="label">Cirurgia Realizada</label>
          <input
            type="text"
            className="input-field"
            placeholder="Nome do procedimento cirúrgico"
            {...register('surgeryName', { required: 'Nome da cirurgia é obrigatório' })}
          />
          {errors.surgeryName && <p className="error-text">{errors.surgeryName.message}</p>}
        </div>

        {/* Campos específicos do convênio */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-t pt-6">
            Códigos do Convênio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Código do Procedimento Principal</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: 40701012"
                {...register('mainProcedureCode')}
              />
            </div>

            <div>
              <label className="label">Código do Ato Anestésico</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: 40701060"
                {...register('anesthesiaCode')}
              />
            </div>
          </div>

          <div>
            <label className="label">Códigos de Procedimentos Auxiliares</label>
            <textarea
              className="input-field"
              rows="2"
              placeholder="Códigos de procedimentos adicionais, separados por vírgula"
              {...register('auxiliaryProcedureCodes')}
            />
          </div>
        </div>

        <div>
          <label className="label">Equipe Cirúrgica</label>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Cirurgião principal, auxiliares, instrumentador..."
            {...register('surgicalTeam')}
          />
        </div>

        <div>
          <label className="label">Descrição do Ato Anestésico</label>
          <textarea
            className="input-field"
            rows="4"
            placeholder="Descreva o procedimento anestésico realizado..."
            {...register('anesthesiaDescription')}
          />
        </div>

        <div>
          <label className="label">Medicações Utilizadas</label>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Liste as medicações e doses utilizadas..."
            {...register('medications')}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onSaveDraft}
            className="btn-outline flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </button>

          <button
            type="submit"
            className="btn-primary flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Finalizar Ficha
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConvenioForm;