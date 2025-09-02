import React, { useState } from 'react';
import {
  Clock,
  Heart,
  AirVent,
  Edit3,
  Trash2,
  HeartPulse
} from 'lucide-react';

const VitalSignsMobile = ({ 
  records = [],
  fieldsWithData = [],
  groupedFields = {},
  editingRecord,
  isLoading = false,
  formatValue,
  getRhythmBadgeColor,
  onStartEdit,
  onDeleteClick,
  editForm,
  deleteModal
}) => {
  // Estados específicos do mobile
  // Removed expandedCards state and toggleCardExpansion callback

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const isEditing = editingRecord === record.id;
        
        return (
          <div key={record.id} className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden border-l-4 border-blue-200">
            {/* Cabeçalho do Card */}
            <div 
              className="p-2 bg-blue-50 border-b border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{record.displayTime}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ring-1 ring-inset ring-gray-200 ${getRhythmBadgeColor(record.ritmo)}`}>
                    {record.ritmo || '—'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Ações */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onStartEdit(record.id); }}
                    disabled={isLoading || editingRecord}
                    className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Editar registro"
                    title="Editar registro"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(record.id); }}
                    disabled={isLoading || editingRecord}
                    className="h-7 w-7 flex items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Excluir registro"
                    title="Excluir registro"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                </div>
              </div>
            </div>

            {/* Resumo Principal (sempre visível) */}
            <div className="p-2">
              <div className="grid grid-cols-3 gap-2">
                {/* FC */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">FC</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{record.fc || '—'}</div>
                  <div className="text-xs text-gray-500">bpm</div>
                </div>
                
                {/* PA */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HeartPulse className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">PA</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {record.pasSistolica && record.pasDiastolica 
                      ? `${record.pasSistolica}/${record.pasDiastolica}` 
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.pam ? `PAM: ${record.pam}` : 'mmHg'}
                  </div>
                </div>
                
                {/* SpO2 */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AirVent className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">SpO₂</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{record.spo2 || '—'}</div>
                  <div className="text-xs text-gray-500">%</div>
                </div>
              </div>
            </div>

            {/* Área Expandida (campos adicionais) */}
            {fieldsWithData.length > 0 && (
              <div className="border-t border-gray-200 bg-slate-50">
                <div className="p-3 space-y-3">
                  {Object.entries(groupedFields).map(([groupName, fields]) => {
                    // Verificar se algum campo do grupo tem dados
                    const fieldsInGroup = fields.filter(field => fieldsWithData.includes(field));
                    const hasData = fieldsInGroup.some(field => 
                      record[field.key] !== undefined && 
                      record[field.key] !== null && 
                      record[field.key] !== ''
                    );
                    
                    if (!hasData) return null;

                    const groupLabels = {
                      respiratory: '🫁 Respiratório',
                      neurological: '🧠 Neurológico',
                      hemodynamic: '🩸 Hemodinâmico',
                      metabolic: '🔬 Metabólico',
                      fluids: '📊 Fluidos'
                    };

                    return (
                      <div key={groupName}>
                        <h4 className="text-xs font-medium text-gray-700 mb-2 inline-flex px-2 py-1 rounded-full bg-gray-100">
                          {groupLabels[groupName] || groupName}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {fieldsInGroup.map(field => {
                            const value = record[field.key];
                            if (value === undefined || value === null || value === '') return null;
                            
                            return (
                              <div key={field.key} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                <field.icon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600 flex-1">{field.label}:</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatValue(value, field.unit)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulário de Edição Expansível */}
            {isEditing && editForm && (
              <div className="border-t-2 border-blue-200" role="region" aria-labelledby={`edit-${record.id}`} aria-live="polite">
                <div id={`edit-${record.id}`} className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">Editar registro</span>
                    <span className="text-[11px] text-gray-500">•</span>
                    <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    <span className="text-xs text-gray-700">{record.displayTime}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ring-1 ring-inset ring-gray-200 ${getRhythmBadgeColor(record.ritmo)}`}>
                    {record.ritmo || '—'}
                  </span>
                </div>
                <div className="p-3">
                  {editForm}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal}
    </div>
  );
};

export default VitalSignsMobile;