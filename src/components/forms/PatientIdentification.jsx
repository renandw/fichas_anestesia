import React from 'react';
import { useForm } from 'react-hook-form';
import { User, ArrowRight } from 'lucide-react';

const PatientIdentification = ({ formType, onSubmit, initialData = {} }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData
  });

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  const formatCNS = (value) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    // Aplica a máscara XXX XXXX XXXX XXXX
    return numbers.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
          <User className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Identificação do Paciente
          </h2>
          <p className="text-sm text-gray-600">
            {formType === 'sus' ? 'Dados para ficha SUS' : 'Dados para ficha de Convênio/Particular'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Completo */}
          <div className="md:col-span-2">
            <label className="label">Nome Completo do Paciente *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nome completo do paciente"
              {...register('name', {
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Nome deve ter pelo menos 2 caracteres'
                }
              })}
            />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="label">Data de Nascimento *</label>
            <input
              type="date"
              className="input-field"
              {...register('birthDate', {
                required: 'Data de nascimento é obrigatória'
              })}
            />
            {errors.birthDate && <p className="error-text">{errors.birthDate.message}</p>}
          </div>

          {/* Sexo */}
          <div>
            <label className="label">Sexo *</label>
            <select
              className="input-field"
              {...register('gender', {
                required: 'Sexo é obrigatório'
              })}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
            {errors.gender && <p className="error-text">{errors.gender.message}</p>}
          </div>

          {/* Peso */}
          <div>
            <label className="label">Peso (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="300"
              className="input-field"
              placeholder="70.5"
              {...register('weight', {
                required: 'Peso é obrigatório',
                min: { value: 0.1, message: 'Peso deve ser maior que 0' },
                max: { value: 300, message: 'Peso deve ser menor que 300kg' }
              })}
            />
            {errors.weight && <p className="error-text">{errors.weight.message}</p>}
          </div>

          {/* Altura */}
          <div>
            <label className="label">Altura (cm) *</label>
            <input
              type="number"
              min="30"
              max="250"
              className="input-field"
              placeholder="175"
              {...register('height', {
                required: 'Altura é obrigatória',
                min: { value: 30, message: 'Altura deve ser maior que 30cm' },
                max: { value: 250, message: 'Altura deve ser menor que 250cm' }
              })}
            />
            {errors.height && <p className="error-text">{errors.height.message}</p>}
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {formType === 'sus' ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-t pt-6">
              Dados SUS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CNS */}
              <div>
                <label className="label">CNS (Cartão Nacional de Saúde) *</label>
                <input
                  type="text"
                  maxLength="18"
                  className="input-field"
                  placeholder="123 4567 8901 2345"
                  {...register('cns', {
                    required: 'CNS é obrigatório',
                    pattern: {
                      value: /^\d{3}\s\d{4}\s\d{4}\s\d{4}$/,
                      message: 'CNS deve ter o formato: 123 4567 8901 2345'
                    }
                  })}
                  onChange={(e) => {
                    e.target.value = formatCNS(e.target.value);
                  }}
                />
                {errors.cns && <p className="error-text">{errors.cns.message}</p>}
              </div>

              {/* Registro do Hospital */}
              <div>
                <label className="label">Registro do Hospital *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="12345"
                  {...register('hospitalRecord', {
                    required: 'Registro do hospital é obrigatório'
                  })}
                />
                {errors.hospitalRecord && <p className="error-text">{errors.hospitalRecord.message}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-t pt-6">
              Dados Convênio/Particular
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matrícula do Convênio */}
              <div>
                <label className="label">Matrícula do Convênio *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456789"
                  {...register('insuranceNumber', {
                    required: 'Matrícula do convênio é obrigatória'
                  })}
                />
                {errors.insuranceNumber && <p className="error-text">{errors.insuranceNumber.message}</p>}
              </div>

              {/* Nome do Convênio */}
              <div>
                <label className="label">Nome do Convênio *</label>
                <select
                  className="input-field"
                  {...register('insuranceName', {
                    required: 'Nome do convênio é obrigatório'
                  })}
                >
                  <option value="">Selecione o convênio</option>
                  <option value="unimed">Unimed</option>
                  <option value="bradesco">Bradesco Saúde</option>
                  <option value="amil">Amil</option>
                  <option value="sulamerica">SulAmérica</option>
                  <option value="particular">Particular</option>
                  <option value="outros">Outros</option>
                </select>
                {errors.insuranceName && <p className="error-text">{errors.insuranceName.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Dados de Contato (Opcionais) */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-t pt-6">
            Dados de Contato (Opcionais)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPF */}
            <div>
              <label className="label">CPF</label>
              <input
                type="text"
                maxLength="14"
                className="input-field"
                placeholder="123.456.789-00"
                {...register('cpf', {
                  pattern: {
                    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                    message: 'CPF deve ter o formato: 123.456.789-00'
                  }
                })}
                onChange={(e) => {
                  e.target.value = formatCPF(e.target.value);
                }}
              />
              {errors.cpf && <p className="error-text">{errors.cpf.message}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="label">Telefone</label>
              <input
                type="text"
                maxLength="15"
                className="input-field"
                placeholder="(11) 99999-9999"
                {...register('phone', {
                  pattern: {
                    value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                    message: 'Telefone deve ter o formato: (11) 99999-9999'
                  }
                })}
                onChange={(e) => {
                  e.target.value = formatPhone(e.target.value);
                }}
              />
              {errors.phone && <p className="error-text">{errors.phone.message}</p>}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            className="btn-primary flex items-center"
          >
            Continuar
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientIdentification;