

import { useState } from "react";

/**
 * Hook to manage the logic for creating a Patient and its Procedures
 */
export default function usePatientFormLogic(onCreatePatient, onCreateProcedure) {
  // State for patient data
  const [patientData, setPatientData] = useState({
    name: "",
    birthDate: "",
    sex: "",
    cns: "",
    weight: "",
  });

  // State for procedure data
  const [procedureData, setProcedureData] = useState({
    type: "SUS", // or "CONVENIO"
    hospital: "",
    surgeryDescription: "",
    registroHospital: "",
    convenio: "",
    matricula: "",
    cbhpmCode: "",
    surgeon: "",
    auxiliaries: [],
  });

  // Handlers to update states
  const handlePatientChange = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleProcedureChange = (field, value) => {
    setProcedureData(prev => ({ ...prev, [field]: value }));
  };

  // Save logic for patient
  const savePatient = async () => {
    if (!patientData.name || !patientData.birthDate || !patientData.sex || !patientData.cns) {
      throw new Error("Missing required patient fields.");
    }
    const patientId = await onCreatePatient(patientData);
    return patientId;
  };

  // Save logic for procedure (requires patientId)
  const saveProcedure = async (patientId) => {
    if (!patientId) throw new Error("Patient ID is required to create a procedure.");
    const requiredFields = ["type", "hospital", "surgeon"];
    for (const field of requiredFields) {
      if (!procedureData[field]) {
        throw new Error(`Missing required procedure field: ${field}`);
      }
    }
    await onCreateProcedure(patientId, procedureData);
  };

  // Function to handle full creation workflow
  const createPatientWithProcedure = async () => {
    const patientId = await savePatient();
    await saveProcedure(patientId);
    return patientId;
  };

  return {
    patientData,
    procedureData,
    handlePatientChange,
    handleProcedureChange,
    savePatient,
    saveProcedure,
    createPatientWithProcedure
  };
}