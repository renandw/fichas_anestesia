import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
