import React, { useState } from 'react';
import { Pill, Plus, X, Edit2, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MedicationsSection = ({ 
  medications = [], 
  surgery, // ADICIONAR esta prop
  onMedicationsChange,
  autoSave 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState('');
  const [dose, setDose] = useState('');
  const [via, setVia] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [editDose, setEditDose] = useState('');
  const [editVia, setEditVia] = useState('');
  const [editTime, setEditTime] = useState('');

  const getSurgeryBaseTime = () => {
    if (!surgery?.createdAt) {
      return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    let surgeryDate;
    if (surgery.createdAt.seconds) {
      // Firestore Timestamp
      surgeryDate = new Date(surgery.createdAt.seconds * 1000);
    } else if (typeof surgery.createdAt === 'string') {
      // ISO String
      surgeryDate = new Date(surgery.createdAt);
    } else {
      // Já é um objeto Date
      surgeryDate = new Date(surgery.createdAt);
    }
    
    return surgeryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Vias de administração disponíveis
  const viasAdministracao = [
    { code: 'EV', name: 'Endovenoso' },
    { code: 'IM', name: 'Intramuscular' },
    { code: 'IT', name: 'Intratecal' },
    { code: 'PD', name: 'Peridural' },
    { code: 'PN', name: 'Perineural' },
    { code: 'SC', name: 'Subcutâneo' },
    { code: 'SL', name: 'Sublingual' },
    { code: 'IN', name: 'Intranasal' },
    { code: 'TOP', name: 'Tópico' },
    { code: 'VO', name: 'Via Oral' },
    { code: 'VR', name: 'Via Respiratória' }
  ];

  // --- UI helpers ---
  const categoryColorMap = {
    'Hipnótico': 'bg-purple-100 text-purple-800',
    'Opioide': 'bg-pink-100 text-pink-800',
    'Bloqueador Neuromuscular': 'bg-red-100 text-red-800',
    'AINE': 'bg-yellow-100 text-yellow-800',
    'Antiemético': 'bg-green-100 text-green-800',
    'Corticoide': 'bg-amber-100 text-amber-800',
    'Antibiótico': 'bg-indigo-100 text-indigo-800',
    'Vasopressor': 'bg-orange-100 text-orange-800',
    // fallback colour
  };

  const getCategoryColor = (category) =>
    categoryColorMap[category] || 'bg-blue-100 text-blue-800';

  const getViaName = (code) => {
    const viaObj = viasAdministracao.find((v) => v.code === code);
    return viaObj ? viaObj.name : '';
  };

  // Sugestões automáticas de via baseadas na medicação
  const getSuggestedVia = (medicationName) => {
    const name = medicationName.toLowerCase();
    
    // Anestésicos endovenosos
    if (name.includes('propofol') || name.includes('etomidato') || name.includes('cetamina')) {
      return 'EV';
    }
    
    // Benzodiazepínicos - geralmente EV em anestesia
    if (name.includes('midazolam') || name.includes('diazepam')) {
      return 'EV';
    }
    
    // Opioides - contexto determina via
    if (name.includes('fentanil') || name.includes('remifentanil') || name.includes('sufentanil')) {
      return 'EV';
    }
    if (name.includes('morfina')) {
      return 'EV'; // Padrão EV, mas pode ser IT
    }
    
    // Bloqueadores neuromusculares - sempre EV
    if (name.includes('rocurônio') || name.includes('atracúrio') || name.includes('vecurônio') || 
        name.includes('cisatracúrio') || name.includes('pancurônio') || name.includes('succinilcolina')) {
      return 'EV';
    }
    
    // Vasopressores/Inotrópicos - sempre EV
    if (name.includes('noradrenalina') || name.includes('adrenalina') || name.includes('fenilefrina') ||
        name.includes('efedrina') || name.includes('dopamina') || name.includes('dobutamina') ||
        name.includes('vasopressina') || name.includes('nitroprusseto') || name.includes('nitroglicerina')) {
      return 'EV';
    }
    
    // Anestésicos locais - dependem do contexto
    if (name.includes('pesada') || name.includes('isobárica')) {
      if (name.includes('sem vasoconstritor')) {
        return 'IT'; // Sem vaso geralmente é para neuroeixo
      }
      return 'PN'; // Com vaso geralmente é para bloqueios
    }
    if (name.includes('lidocaína')) {
      if (name.includes('adrenalina')) {
        return 'PN'; // Com adrenalina geralmente bloqueios/infiltração
      }
      return 'EV'; // Lidocaína sem adrenalina pode ser EV
    }
    
    // Antieméticos - geralmente EV
    if (name.includes('ondansetrona') || name.includes('metoclopramida') || name.includes('droperidol') ||
        name.includes('dimenidrinato') || name.includes('bromoprida')) {
      return 'EV';
    }
    
    // Corticoides - geralmente EV
    if (name.includes('dexametasona')) {
      return 'EV';
    }
    
    // Analgésicos não-opioides
    if (name.includes('dipirona') || name.includes('paracetamol')) {
      return 'EV';
    }
    if (name.includes('cetorolaco') || name.includes('cetoprofeno') || name.includes('tenoxicam') || 
        name.includes('dexketoprofeno')) {
      return 'EV';
    }
    
    // Antibióticos - geralmente EV
    if (name.includes('cefazolina') || name.includes('cefuroxima') || name.includes('ceftriaxona') ||
        name.includes('clindamicina') || name.includes('vancomicina') || name.includes('metronidazol') ||
        name.includes('gentamicina') || name.includes('ciprofloxacino')) {
      return 'EV';
    }
    
    // Reversores - sempre EV
    if (name.includes('neostigmina') || name.includes('sugammadex') || name.includes('atropina')) {
      return 'EV';
    }
    
    // Alfa-2 agonistas
    if (name.includes('dexmedetomidina')) {
      return 'EV';
    }
    
    // Anestésicos inalatórios - via inalatória não está na lista, usar EV como padrão
    if (name.includes('sevoflurano') || name.includes('desflurano') || name.includes('isoflurano')) {
      return 'VR'; // Placeholder, idealmente seria "INAL"
    }
    
    // Padrão para medicações não categorizadas
    return 'EV';
  };
  const medicationPresets = [
    {
      name: 'Anestesia Geral',
      icon: '💉',
      medications: [
        { name: 'Propofol', dose: '200mg', via: 'EV', category: 'Hipnótico' },
        { name: 'Fentanil', dose: '250mcg', via: 'EV', category: 'Opioide' },
        { name: 'Rocurônio', dose: '50mg', via: 'EV', category: 'Bloqueador Neuromuscular' },
      ]
    },
    {
      name: 'Profilaxia Dor e NVPO',
      icon: '🛡️',
      medications: [
        { name: 'Dipirona', dose: '2g', via: 'EV', category: 'Analgésico' },
        { name: 'Cetoprofeno', dose: '100mg', via: 'EV', category: 'AINE' },
        { name: 'Dimenidrinato', dose: '30mg', via: 'EV', category: 'Antiemético' },
        { name: 'Metoclopramida', dose: '10mg', via: 'EV', category: 'Antiemético' },
        { name: 'Ondansetrona', dose: '8mg', via: 'EV', category: 'Antiemético' },
        { name: 'Dexametasona', dose: '10mg', via: 'EV', category: 'Corticoide' }
      ]
    },
    {
      name: 'Raquianestesia - Pesada',
      icon: '💊',
      medications: [
        { name: 'Bupivacaína Pesada', dose: '15mg', via: 'IT', category: 'Anestésico Local' },
        { name: 'Morfina', dose: '80mcg', via: 'IT', category: 'Opioide' }
      ]
    },
    {
        name: 'Raquianestesia - Isobárica',
        icon: '💊',
        medications: [
          { name: 'Bupivacaína Isobárica', dose: '15mg', via: 'IT', category: 'Anestésico Local' },
          { name: 'Morfina', dose: '80mcg', via: 'IT', category: 'Opioide' }
        ]
    },
    {
        name: 'Anestesia Peridural',
        icon: '💉',
        medications: [
          { name: 'Levobupivacaína', dose: '20ml', via: 'PD', category: 'Anestésico Local' },
          { name: 'Fentanil', dose: '100mcg', via: 'PD', category: 'Opioide' },
          { name: 'Morfina', dose: '2mg', via: 'PD', category: 'Opioide' }
        ]
    },
    {
        name: 'Sedação Ambulatorial',
        icon: '💉',
        medications: [
        { name: 'Propofol', dose: '70mg', via: 'EV', category: 'Hipnótico' },
        { name: 'Fentanil', dose: '50mcg', via: 'EV', category: 'Opioide' }
        ]
    },
    {
        name: 'Bloqueio Periférico',
        icon: '🧠',
        medications: [
          { name: 'Levoupivacaína', dose: '50mg', via: 'PN', category: 'Anestésico Local' },
          { name: 'Lidocaína', dose: '100mg', via: 'PN', category: 'Anestésico Local' }
        ]
    },
    {
        name: 'Indução Rápida (RSI)',
        icon: '⚡',
        medications: [
          { name: 'Etomidato', dose: '20mg', via: 'EV', category: 'Indutor Hipnótico' },
          { name: 'Succinilcolina', dose: '100mg', via: 'EV', category: 'Bloqueador Neuromuscular' },
          { name: 'Fentanil', dose: '100mcg', via: 'EV', category: 'Opioide' },
          { name: 'Lidocaína', dose: '1mg/kg', via: 'EV', category: 'Anestésico Local' }
        ]
    }
  ];

  // Lista de todas as medicações com suas categorias
  const allMedications = [
    // Anestésicos Inalatórios
    { name: 'Sevoflurano', category: 'Anestésico Inalatório' },
    { name: 'Desflurano', category: 'Anestésico Inalatório' },
    { name: 'Isoflurano', category: 'Anestésico Inalatório' },
    { name: 'Óxido nitroso', category: 'Anestésico Inalatório' },
    
    // Anestésicos Endovenosos
    { name: 'Propofol', category: 'Hipnótico' },
    { name: 'Etomidato', category: 'Hipnótico' },
    { name: 'Cetamina', category: 'Hipnótico' },
    { name: 'Midazolam', category: 'Benzodiazepínico' },
    { name: 'Dexmedetomidina', category: 'Alfa-2 Agonista' },
    { name: 'Diazepam', category: 'Benzodiazepínico' },
    { name: 'Haloperidol', category: 'Neuroléptico' },
    
    // Bloqueadores Neuromusculares
    { name: 'Succinilcolina', category: 'Bloqueador Neuromuscular' },
    { name: 'Rocurônio', category: 'Bloqueador Neuromuscular' },
    { name: 'Vecurônio', category: 'Bloqueador Neuromuscular' },
    { name: 'Cisatracúrio', category: 'Bloqueador Neuromuscular' },
    { name: 'Atracúrio', category: 'Bloqueador Neuromuscular' },
    { name: 'Pancurônio', category: 'Bloqueador Neuromuscular' },
    
    // Vasopressores / Hipotensores
    { name: 'Noradrenalina', category: 'Vasopressor' },
    { name: 'Fenilefrina', category: 'Vasopressor' },
    { name: 'Efedrina', category: 'Vasopressor' },
    { name: 'Adrenalina', category: 'Vasopressor' },
    { name: 'Dopamina', category: 'Vasopressor' },
    { name: 'Dobutamina', category: 'Inotrópico' },
    { name: 'Vasopressina', category: 'Vasopressor' },
    { name: 'Nitroprusseto de Sódio', category: 'Hipotensor' },
    { name: 'Nitroglicerina', category: 'Hipotensor' },
    { name: 'Metaraminol', category: 'Vasopressor' },
    
    // Analgésicos Opioides
    { name: 'Fentanil', category: 'Opioide' },
    { name: 'Remifentanil', category: 'Opioide' },
    { name: 'Sufentanil', category: 'Opioide' },
    { name: 'Morfina', category: 'Opioide' },
    { name: 'Tramadol', category: 'Opioide' },
    
    // Analgésicos Não-opioides
    { name: 'Dipirona', category: 'Analgésico' },
    { name: 'Paracetamol', category: 'Analgésico' },
    { name: 'Cetorolaco', category: 'AINE' },
    { name: 'Dexketoprofeno', category: 'AINE' },
    { name: 'Cetoprofeno', category: 'AINE' },
    { name: 'Tenoxicam', category: 'AINE' },
    
    // Antieméticos
    { name: 'Ondansetrona', category: 'Antiemético' },
    { name: 'Dexametasona', category: 'Corticoide' },
    { name: 'Droperidol', category: 'Antiemético' },
    { name: 'Metoclopramida', category: 'Antiemético' },
    { name: 'Dimenidrinato', category: 'Antiemético' },
    { name: 'Escopolamina', category: 'Antiemético' },
    { name: 'Bromoprida', category: 'Antiemético' },
    
    // Antibióticos
    { name: 'Cefazolina', category: 'Antibiótico' },
    { name: 'Cefalotina', category: 'Antibiótico' },
    { name: 'Cefuroxima', category: 'Antibiótico' },
    { name: 'Ceftriaxona', category: 'Antibiótico' },
    { name: 'Clindamicina', category: 'Antibiótico' },
    { name: 'Vancomicina', category: 'Antibiótico' },
    { name: 'Metronidazol', category: 'Antibiótico' },
    { name: 'Gentamicina', category: 'Antibiótico' },
    { name: 'Ciprofloxacino', category: 'Antibiótico' },
    { name: 'Ampicilina', category: 'Antibiótico' },
    
    // Antiarritmicos
    { name: 'Amiodarona', category: 'Antiarritmico' },

    //Miscelânia
    { name: 'Clonidina', category: 'Alfa-2 Agonista' },
    { name: 'Ocitocina', category: 'Hormonal' },
    { name: 'Flumazenil', category: 'Reversor' },
    { name: 'Naloxona', category: 'Reversor' },
    { name: 'Esmolol', category: 'Betabloqueador' },
    { name: 'Metoprolol', category: 'Betabloqueador' },
    { name: 'Bisoprolol', category: 'Betabloqueador' },
    { name: 'Hidralazina', category: 'Hipotensor' },
    { name: 'Salbutamol (inalado)', category: 'Beta-2 Agonista' },
    { name: 'Hidrocortisona', category: 'Corticoide' },
    { name: 'Sulfato de Magnésio', category: 'Broncodilatador' },
    { name: 'Prometazina', category: 'Antialérgico' },
    { name: 'Gluconato de Cálcio 10%', category: 'Hidroeletrolítico' },
    { name: 'Bicarbonato de Sódio 8,4%', category: 'Hidroeletrolítico' },
    { name: 'Cloreto de Sódio 0,9%', category: 'Cristalóide' },
    { name: 'Ringer Lactato', category: 'Cristalóide' },
    { name: 'Concentrado de Hemácias', category: 'Hemoderivados' },
    { name: 'Plaquetas', category: 'Hemoderivados' },
    { name: 'Plasma Fresco Congelado', category: 'Hemoderivados' },

    


    // Reversores
    { name: 'Neostigmina', category: 'Reversor' },
    { name: 'Atropina', category: 'Anticolinérgico' },
    { name: 'Sugammadex', category: 'Reversor' },
    
    // Anestésicos Locais
    { name: 'Lidocaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Bupivacaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Ropivacaína + adrenalina', category: 'Anestésico Local' },
    { name: 'Lidocaína', category: 'Anestésico Local' },
    { name: 'Bupivacaína', category: 'Anestésico Local' },
    { name: 'Bupivacaína Pesada', category: 'Anestésico Local' },
    { name: 'Bupivacaína Isobárica', category: 'Anestésico Local' },
    { name: 'Ropivacaína', category: 'Anestésico Local' },
    { name: 'Mepivacaína', category: 'Anestésico Local' },
    { name: 'Prilocaína', category: 'Anestésico Local' },
    { name: 'Levobupivacaína', category: 'Anestésico Local' },
    { name: 'Levobupivacaína + adrenalina', category: 'Anestésico Local' }
  ];

  // Filtrar medicações baseado na busca
  const filteredMedications = allMedications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  // Adicionar preset de medicações
  const addPreset = async (preset) => {
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const timestamp = new Date().toISOString();
    
    const newMedications = preset.medications.map((med, index) => ({
      id: Date.now() + index,
      name: med.name,
      dose: med.dose,
      via: med.via,
      category: med.category,
      time: getSurgeryBaseTime(),
      timestamp: timestamp
    }));

    const updatedMedications = [...medications, ...newMedications];
    onMedicationsChange(updatedMedications);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
    
    toast.success(`${preset.name} adicionado (${newMedications.length} medicações)`);
  };

  // Iniciar edição de medicação
  const startEdit = (medication) => {
    setEditingMedication(medication.id);
    setEditDose(medication.dose || '');
    setEditVia(medication.via || 'EV'); // Padrão EV se não existir via
    // ADICIONAR esta linha:
    setEditTime(medication.time || getSurgeryBaseTime());
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditingMedication(null);
    setEditDose('');
    setEditVia('');
    // ADICIONAR esta linha:
    setEditTime('');
  };

  // Salvar edição
  const saveEdit = async (medId) => {
    if (!editDose || !editDose.trim()) {
      toast.error('Dose não pode estar vazia');
      return;
    }
    if (!editVia || !editVia.trim()) {
      toast.error('Via não pode estar vazia');
      return;
    }

    const updatedMedications = medications.map(med => 
      med.id === medId 
        ? { ...med, dose: editDose.trim(), via: editVia.trim(), time: editTime }
        : med
    );
    
    onMedicationsChange(updatedMedications);
    setEditingMedication(null);
    setEditDose('');
    setEditVia('');
    setEditTime('');
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
    
    toast.success('Medicação atualizada');
  };

  // Adicionar medicação individual
  const addMedication = async () => {
    const medicationName = selectedMedication || searchTerm;
    
    if (!medicationName || !medicationName.trim()) {
      toast.error('Selecione uma medicação');
      return;
    }
    
    if (!dose || !dose.trim()) {
      toast.error('Informe a dose');
      return;
    }

    if (!via || !via.trim()) {
      toast.error('Selecione a via de administração');
      return;
    }

    const medicationData = allMedications.find(med => 
      med.name.toLowerCase() === medicationName.toLowerCase()
    );

    const newMed = {
      id: Date.now(),
      name: medicationName,
      dose: dose.trim(),
      via: via.trim(),
      category: medicationData?.category || 'Personalizada',
      time: getSurgeryBaseTime(),
      timestamp: new Date().toISOString()
    };

    const updatedMedications = [...medications, newMed];
    onMedicationsChange(updatedMedications);
    
    setSearchTerm('');
    setSelectedMedication('');
    setDose('');
    setVia('');
    setShowSuggestions(false);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
    
    toast.success(`${medicationName} adicionado`);
  };

  // Selecionar medicação da lista
  const selectMedication = (medication) => {
    setSelectedMedication(medication.name);
    setSearchTerm(medication.name);
    setVia(getSuggestedVia(medication.name)); // Auto-sugerir via
    setShowSuggestions(false);
  };

  // Remover medicação
  const removeMedication = async (medId) => {
    const updatedMedications = medications.filter(med => med.id !== medId);
    onMedicationsChange(updatedMedications);
    
    if (autoSave) {
      await autoSave({ medications: updatedMedications });
    }
  };

  // Ordenar cronologicamente pela timestamp; se não existir ordenar alfabeticamente
  const orderedMedications = [...medications].sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Medicações aplicadas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Medicações Aplicadas ({medications.length})
        </h3>
        
        {medications.length > 0 ? (
          <div className="space-y-2">
            {orderedMedications.map((med) => (
              <div key={med.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-base text-gray-900 break-words">{med.name}</span>
                      <span className={`text-xs font-semibold mt-0.5 ${getCategoryColor(med.category).replace(/bg-[^ ]+/, '')}`}>
                        {med.category}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-1 sm:gap-0">
                      {editingMedication === med.id ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <input
                            type="text"
                            value={editDose}
                            onChange={(e) => setEditDose(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
                            placeholder="Dose"
                          />
                          <select
                            value={editVia}
                            onChange={(e) => setEditVia(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
                          >
                            {viasAdministracao.map(via => (
                              <option key={via.code} value={via.code}>{via.code}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            step="60"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
                          />
                          <div className="flex gap-2 sm:col-span-3">
                            <button
                              onClick={() => saveEdit(med.id)}
                              className="flex-1 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-800"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{med.dose}</span>
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-800"
                              title={getViaName(med.via || 'EV')}
                            >
                              {med.via || 'EV'}
                            </span>
                          </div>
                          <span className="text-gray-500">{med.time}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {editingMedication !== med.id && (
                    <div className="flex flex-col gap-1 ml-2">
                      <button
                        onClick={() => startEdit(med)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full text-xs font-medium transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => removeMedication(med.id)}
                        className="flex items-center justify-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-full transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma medicação aplicada ainda</p>
          </div>
        )}
      </div>

      {/* Presets de medicações */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Presets Rápidos
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {medicationPresets.map((preset, index) => (
            <div key={index} className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{preset.icon}</span>
                  <h4 className="font-semibold text-gray-900 text-sm">{preset.name}</h4>
                </div>
                <button
                  onClick={() => addPreset(preset)}
                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              <div className="text-xs text-gray-600">
                {preset.medications.map((med, i) => (
                  <span key={i}>
                    {med.name} {med.dose} ({med.via})
                    {i < preset.medications.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adicionar medicação com autocomplete */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Adicionar Medicação
        </h3>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicação
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedMedication('');
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Digite o nome da medicação..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
            
            {showSuggestions && searchTerm && filteredMedications.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredMedications.map((medication, index) => (
                  <button
                    key={index}
                    onClick={() => selectMedication(medication)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{medication.name}</div>
                    <div className="text-xs text-gray-500">{medication.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dose/Quantidade <span className="text-gray-400 text-xs">(ex: 2mg, 2g, 500ml)</span>
            </label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="Inclua a unidade de medida"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lembre-se de incluir a unidade de medida (mg, ml, g, etc.)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Via de Administração
            </label>
            <select
              value={via}
              onChange={(e) => setVia(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base bg-white"
            >
              <option value="">Selecione a via...</option>
              {viasAdministracao.map(viaOption => (
                <option key={viaOption.code} value={viaOption.code}>
                  {viaOption.code} - {viaOption.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={addMedication}
            disabled={!searchTerm || !searchTerm.trim() || !dose || !dose.trim() || !via || !via.trim()}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed text-base font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Medicação
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationsSection;