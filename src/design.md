# Design System - Componentes Médicos

## 🎨 **Princípios Base**

### Responsividade
- **Mobile First**: Interface única para mobile (`block md:hidden`)
- **Desktop Complementar**: Interface separada (`hidden md:block`)
- **Breakpoint**: `md:` (768px+)

### Tipografia
```css
/* Mobile */
text-xs    /* 12px - textos secundários */
text-sm    /* 14px - textos principais */

/* Desktop */
text-sm    /* 14px - textos secundários */  
text-base  /* 16px - textos principais */
text-lg    /* 18px - títulos */
```

### Espaçamentos
```css
/* Mobile */
p-3        /* padding interno */
py-2       /* padding vertical campos */
gap-2      /* espaços entre elementos */
space-y-2  /* espaços verticais */

/* Desktop */
p-4 md:p-6 /* padding interno */
py-3       /* padding vertical campos */
gap-3 md:gap-4 /* espaços entre elementos */
space-y-3 md:space-y-4 /* espaços verticais */
```

## 📱 **Padrão Mobile**

### Container Base
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
```

### Header com Gradiente
```jsx
<div className="bg-gradient-to-r from-[COR]-500 to-[COR]-600 px-3 py-3">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="text-white font-medium text-sm leading-tight truncate">
        Título Principal
      </h2>
      <p className="text-[COR]-100 text-xs truncate">
        Subtítulo ou informações extras
      </p>
    </div>
    {/* Status opcional */}
    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-white/90">
      Status
    </span>
  </div>
</div>
```

### Conteúdo Compacto
```jsx
<div className="p-3 space-y-3">
  {/* Campos com labels pequenos */}
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Label *
    </label>
    <input className="w-full px-2 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500" />
  </div>
</div>
```

## 💻 **Padrão Desktop**

### Container Base
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
```

### Header Sutil
```jsx
<div className="bg-gradient-to-r from-[COR]-50 to-[COR2]-50 px-4 py-3 border-b border-gray-100">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-[COR]-500 to-[COR]-600 rounded-full flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Título Principal
        </h2>
        <p className="text-xs text-gray-600">
          Subtítulo com informações contextuais
        </p>
      </div>
    </div>
    
    {/* Informação destacada à direita */}
    <div className="text-right">
      <div className="text-xs text-gray-500 mb-1">Label</div>
      <div className="text-sm font-medium text-gray-900">
        Valor Importante
      </div>
    </div>
  </div>
</div>
```

### Conteúdo Espaçoso
```jsx
<div className="p-4 space-y-4">
  {/* Campos com labels normais */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Label *
    </label>
    <input className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
  </div>
</div>
```

## 🎨 **Cores por Contexto**

### Paciente (Azul)
```css
from-blue-500 to-blue-600      /* Header mobile */
from-blue-50 to-indigo-50      /* Header desktop */
bg-blue-100 text-blue-600      /* Ícone desktop */
```

### Cirurgia (Verde)
```css
from-green-500 to-green-600    /* Header mobile */
from-green-50 to-emerald-50    /* Header desktop */
bg-green-100 text-green-600    /* Ícone desktop */
```

### Anestesia (Roxo)
```css
from-purple-500 to-purple-600  /* Header mobile */
from-purple-50 to-purple-50    /* Header desktop */
bg-purple-100 text-purple-600  /* Ícone desktop */
```

### Pré-anestesia (Índigo)
```css
from-indigo-500 to-indigo-600  /* Header mobile */
from-indigo-50 to-indigo-50    /* Header desktop */
bg-indigo-100 text-indigo-600  /* Ícone desktop */
```

### SRPA (Esmeralda)
```css
from-emerald-500 to-emerald-600 /* Header mobile */
from-emerald-50 to-emerald-50   /* Header desktop */
bg-emerald-100 text-emerald-600 /* Ícone desktop */
```

## 📋 **Padrões de Status**
```jsx
const getStatusColor = (status) => {
  const colors = {
    'Em andamento': 'bg-green-100 text-green-800 border-green-200',
    'Concluída': 'bg-blue-100 text-blue-800 border-blue-200',
    'Agendada': 'bg-gray-100 text-gray-800 border-gray-200',
    'Cancelada': 'bg-red-100 text-red-800 border-red-200',
    'Pausada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};
```

## 🔧 **Estrutura Responsiva**

### Template Base
```jsx
const ComponentName = ({ data }) => {
  // Mobile View
  const MobileView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header colorido */}
      <div className="bg-gradient-to-r from-[COR]-500 to-[COR]-600 px-3 py-3">
        {/* Conteúdo header mobile */}
      </div>
      
      {/* Conteúdo compacto */}
      <div className="p-3 space-y-3">
        {/* Campos e informações mobile */}
      </div>
    </div>
  );

  // Desktop View  
  const DesktopView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header sutil */}
      <div className="bg-gradient-to-r from-[COR]-50 to-[COR2]-50 px-4 py-3 border-b border-gray-100">
        {/* Conteúdo header desktop */}
      </div>
      
      {/* Conteúdo espaçoso */}
      <div className="p-4 space-y-4">
        {/* Campos e informações desktop */}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="block md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <DesktopView />
      </div>
    </div>
  );
};
```

## 🎯 **Checklist de Implementação**

### ✅ Mobile
- [ ] Header com gradiente colorido
- [ ] Ícones w-4 h-4, containers w-8 h-8
- [ ] Textos text-xs/text-sm
- [ ] Padding p-3, gap-2
- [ ] Truncate em textos longos
- [ ] rounded-xl no container

### ✅ Desktop  
- [ ] Header com background sutil
- [ ] Ícones w-5 h-5, containers w-10 h-10
- [ ] Textos text-sm/text-base
- [ ] Padding p-4, gap-3/gap-4
- [ ] Informações contextuais à direita
- [ ] rounded-lg no container

### ✅ Geral
- [ ] Interfaces completamente separadas
- [ ] Cores consistentes por contexto
- [ ] Status padronizados
- [ ] Estados de erro tratados
- [ ] Responsividade com md: breakpoint

## 💡 **Dicas de Uso**

1. **Sempre criar Views separadas** - não reutilizar JSX entre mobile/desktop
2. **Cores por contexto** - cada área médica tem sua paleta
3. **Informação hierárquica** - mais importante no header, detalhes no corpo
4. **Performance** - usar `hidden md:block` em vez de CSS media queries
5. **Acessibilidade** - manter semântica HTML mesmo com estilos diferentes