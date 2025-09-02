import React from 'react';

const Loading = ({ text = 'Carregando...', size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`loading-spinner ${sizes[size]} mr-2`}></div>
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

export default Loading;
