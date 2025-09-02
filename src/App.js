import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';

import NewPatient from './pages/NewPatient';
//import PatientDetails from './pages/PatientDetails';
import EditPatient from './pages/EditPatient';
import NewPatientProcedure from './pages/NewPatientProcedure';
import ExistingPatientNewProcedure from './pages/ExistingPatientNewProcedure';
import ExistingPatientNewProcedureSurgery from './pages/ExistingPatientNewProcedureSurgery';
import ProcedureDetails from './components/patient/procedures/ProcedureDetails'; 
import EditProcedure from './components/patient/procedures/EditProcedure'; 

import NewSurgery from './components/patient/procedures/surgery/NewSurgery';
import NewPatientProcedureSurgery from './pages/NewPatientProcedureSurgery';

//new
import PatientForm from './new/PatientForm';
import SurgeryForm from './new/SurgeryForm/SurgeryForm';
import NewAnesthesiaPage from './new/NewAnesthesiaPage';
import AnesthesiaDetails from './new/AnesthesiaDetails';
import AnesthesiaList from './newlist/AnesthesiaList';
import PatientList from './newlist/PatientList';
import PatientDetails from './new/PatientDetails';
import SurgeryDetails from './new/SurgeryDetails';
import AnesthesiaForm from './new/AnesthesiaForm';
import AnesthesiaFinancial from './new/newfinancial/AnesthesiaFinancial';


import MyPatients from './pages/MyPatients';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Surgeries from './pages/Surgeries';

// Layout
import Layout from './components/layout/Layout';

// Styles
import './styles/globals.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="new-patient" element={<NewPatient />} />
              <Route path="patients/:patientId" element={<PatientDetails />} />
              <Route path="patients/:patientId/edit" element={<EditPatient />} />
              <Route path="new-patient-procedure" element={<NewPatientProcedure />} />
              <Route path="new-patient-procedure-surgery" element={<NewPatientProcedureSurgery />} />
              <Route path="/patients/:patientId/procedures/:procedureId" element={<ProcedureDetails />} />
              <Route path="/patients/:patientId/procedures/:procedureId/edit" element={<EditProcedure />} />              
              <Route path="/patients/:patientId/procedures/new" element={<ExistingPatientNewProcedure />} />
              <Route path="/patients/:patientId/newproceduresurgery" element={<ExistingPatientNewProcedureSurgery />} />
              <Route path="/patients/:patientId/procedures/:procedureId/surgery/new" element={<NewSurgery />} />
              <Route path="/patients/:patientId/surgeries/:surgeryId/surgery" element={<SurgeryDetails />} />
              <Route path="patients" element={<PatientList />} />
              <Route path="financial" element={<AnesthesiaFinancial />} />
              <Route path="settings" element={<Settings />} />
              <Route path="surgeries" element={<Surgeries />} />
              <Route path="patient-form" element={<PatientForm />} />
              <Route path="surgery-form" element={<SurgeryForm />} />
              <Route path="newanesthesia" element={<NewAnesthesiaPage />} />
              <Route path="/patients/:patientId/surgeries/:surgeryId/anesthesia/:anesthesiaId" element={<AnesthesiaDetails />} />
              <Route path="/patients/:patientId/surgeries/:surgeryId/anesthesia/new" element={<AnesthesiaForm />} />
              <Route path="anesthesialist" element={<AnesthesiaList />} />

            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;