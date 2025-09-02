import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import PatientDisplay from '../../newvariations/PatientDisplay';
import SurgeryDisplay from '../../newvariations/SurgeryDisplay';  
import AnesthesiaDisplay from '../../newvariations/AnesthesiaDisplay';
import PatientForm from './../PatientForm';
import SurgeryForm from '../SurgeryForm/SurgeryForm';
import AnesthesiaFormComponent from '../AnesthesiaFormComponent';

const AnesthesiaIdentification = ({ 
  patient, 
  surgery, 
  anesthesia, 
  onUpdate,
  onPatientUpdate,
  onSurgeryUpdate 
}) => {
  // Estados de edição
  const [editingPatient, setEditingPatient] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState(false);
  const [editingAnesthesia, setEditingAnesthesia] = useState(false);

  // Handlers para paciente
  const handlePatientEditToggle = () => {
    setEditingPatient(!editingPatient);
  };

  const handlePatientUpdated = (updatedPatient) => {
    setEditingPatient(false);
    if (onPatientUpdate) {
      onPatientUpdate(updatedPatient);
    }
  };

  // Handlers para cirurgia
  const handleSurgeryEditToggle = () => {
    setEditingSurgery(!editingSurgery);
  };

  const handleSurgeryUpdated = (updatedSurgery) => {
    setEditingSurgery(false);
    if (onSurgeryUpdate) {
      onSurgeryUpdate(updatedSurgery);
    }
  };

  // Handlers para anestesia
  const handleAnesthesiaEditToggle = () => {
    console.log('🔍 Debug - Dados da anestesia:', anesthesia);
    console.log('🔍 Debug - Paciente:', patient);
    console.log('🔍 Debug - Cirurgia:', surgery);
    setEditingAnesthesia(!editingAnesthesia);
  };

  const handleAnesthesiaUpdated = (updatedAnesthesia) => {
    setEditingAnesthesia(false);
    if (onUpdate) {
      onUpdate(updatedAnesthesia);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium m-4">Identificação e Dados</h3>
      
      {/* Seção Paciente */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Dados do Paciente</h4>
            <button
              onClick={handlePatientEditToggle}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                editingPatient 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editingPatient ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Editar
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {!editingPatient ? (
            <PatientDisplay patient={patient} />
          ) : (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="mb-3">
                <h5 className="font-medium text-blue-900">Editando Dados do Paciente</h5>
                <p className="text-sm text-blue-700">Faça as alterações necessárias nos dados do paciente</p>
              </div>
              <PatientForm 
                mode="edit"
                initialData={patient}
                onPatientSelected={handlePatientUpdated}
              />
            </div>
          )}
        </div>
      </div>

      {/* Seção Cirurgia */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Dados da Cirurgia</h4>
            <button
              onClick={handleSurgeryEditToggle}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                editingSurgery 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {editingSurgery ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Editar
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {!editingSurgery ? (
            <SurgeryDisplay surgery={surgery} />
          ) : (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <div className="mb-3">
                <h5 className="font-medium text-green-900">Editando Dados da Cirurgia</h5>
                <p className="text-sm text-green-700">Faça as alterações necessárias nos dados da cirurgia</p>
              </div>
              <SurgeryForm 
                mode="edit"
                existingSurgery={surgery}
                selectedPatient={patient}
                onSurgeryUpdated={handleSurgeryUpdated}
              />
            </div>
          )}
        </div>
      </div>

      {/* Seção Anestesia */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Dados da Anestesia</h4>
            <button
              onClick={handleAnesthesiaEditToggle}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                editingAnesthesia 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {editingAnesthesia ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Editar
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {!editingAnesthesia ? (
            <AnesthesiaDisplay anesthesia={anesthesia} />
          ) : (
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="mb-3">
                <h5 className="font-medium text-purple-900">Editando Dados da Anestesia</h5>
                <p className="text-sm text-purple-700">Faça as alterações necessárias nos dados da anestesia</p>
              </div>
              <AnesthesiaFormComponent 
                mode="edit"
                initialData={anesthesia}
                selectedPatient={patient}
                selectedSurgery={surgery}
                onAnesthesiaUpdated={handleAnesthesiaUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnesthesiaIdentification;