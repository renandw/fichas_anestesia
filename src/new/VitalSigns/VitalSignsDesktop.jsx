import React from 'react';
import {
  Clock,
  Heart,
  AirVent,
  Edit3,
  Trash2
} from 'lucide-react';

const VitalSignsDesktop = ({ 
  records = [],
  fieldsWithData = [],
  editingRecord,
  isLoading = false,
  formatValue,
  getRhythmBadgeColor,
  onStartEdit,
  onDeleteClick,
  editForm,
  deleteModal
}) => {

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Cabeçalho da Tabela */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Campos Fixos */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <div>
                    <div>Horário</div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <div>
                    <div>Ritmo</div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <div>
                    <div>FC</div>
                    <div className="text-xs text-gray-400">bpm</div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <div>
                    <div>PA</div>
                    <div className="text-xs text-gray-400">mmHg</div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <AirVent className="w-4 h-4" />
                  <div>
                    <div>SpO₂</div>
                    <div className="text-xs text-gray-400">%</div>
                  </div>
                </div>
              </th>
              
              {/* Campos Dinâmicos (apenas os que têm dados) */}
              {fieldsWithData.map(field => (
                <th key={field.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <field.icon className="w-4 h-4" />
                    <div>
                      <div>{field.label}</div>
                      {field.unit && <div className="text-xs text-gray-400">{field.unit}</div>}
                    </div>
                  </div>
                </th>
              ))}
              
              {/* Ações */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>

          {/* Corpo da Tabela */}
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <React.Fragment key={record.id}>
                {/* Linha normal do registro */}
                <tr className="hover:bg-gray-50">
                  {/* Campos Fixos */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.displayTime}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRhythmBadgeColor(record.ritmo)}`}>
                      {record.ritmo || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.fc || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.pasSistolica && record.pasDiastolica 
                      ? `${record.pasSistolica}/${record.pasDiastolica}` 
                      : '—'}
                    {record.pam && (
                      <div className="text-xs text-gray-500">PAM: {record.pam}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.spo2 ? `${record.spo2}%` : '—'}
                  </td>
                  
                  {/* Campos Dinâmicos */}
                  {fieldsWithData.map(field => (
                    <td key={field.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(record[field.key], field.unit)}
                    </td>
                  ))}
                  
                  {/* Ações */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartEdit(record.id)}
                        disabled={isLoading || editingRecord}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Editar registro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(record.id)}
                        disabled={isLoading || editingRecord}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Linha expansível do formulário (aparece abaixo do registro sendo editado) */}
                {editingRecord === record.id && editForm && (
                  <tr>
                    <td colSpan={7 + fieldsWithData.length} className="px-0 py-0">
                      <div className="border-t-2 border-blue-200">
                        {editForm}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal}
    </div>
  );
};

export default VitalSignsDesktop;