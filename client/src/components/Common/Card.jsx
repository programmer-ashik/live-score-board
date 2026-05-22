
export default function Card({ children, className = '' }) {
  return (
    <div className={`glass-panel p-5 ${className}`}>
      {children}
    </div>
  );
}