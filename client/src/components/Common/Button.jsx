
const variants = {
  primary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  warning: 'bg-amber-600 hover:bg-amber-500 text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  outline: 'border border-slate-600 hover:bg-slate-800 text-white'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export default function Button({ children, onClick, variant = 'primary', size = 'md', fullWidth = false, className = '', disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}