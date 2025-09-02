import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? 'border-red-300 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="error-text">{error}</p>
      )}
    </div>
  );
};

export default Input;
