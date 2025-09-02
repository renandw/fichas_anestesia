

import React from 'react';
import PatientFormBase from './PatientFormBase';
import { addPatient, updatePatient } from '@/services/firestore';
import { autoSaveSRPAForm } from '@/services/firestore';

const PatientFormSRPA = ({ srpaId, initialData, onSaved }) => {
  
  // Função de submit específica para SRPA
  const handleSubmit = async (formData) => {
    try {
      // 1. Cria ou atualiza o paciente
      let patientId = formData.patientId;
      if (patientId) {
        await updatePatient(patientId, formData.patient);
      } else {
        const newPatient = await addPatient(formData.patient);
        patientId = newPatient.id;
      }

      // 2. Salva os dados SRPA vinculando ao patientId
      await autoSaveSRPAForm(srpaId, {
        patientId,
        patientSnapshot: {
          insuranceName: formData.currentInsuranceName,
          insuranceNumber: formData.currentInsuranceNumber,
          weight: formData.patientWeight,
          hospitalRecord: formData.hospitalRecord
        }
      });

      if (onSaved) onSaved();
    } catch (error) {
      console.error('Erro ao salvar SRPA:', error);
    }
  };

  return (
    <PatientFormBase
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
};

export default PatientFormSRPA;