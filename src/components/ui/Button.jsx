import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50'
  };
  
  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
