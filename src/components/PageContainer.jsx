import { usePageColor } from '../context/ColorContext';
import '../styles/components/PageContainer.css';

export default function PageContainer({ children }) {
  const colors = usePageColor();

  return (
    <div
      className="page-container animate-route-fade"
      style={{
        borderLeftColor: colors?.primary || '#6366f1',
      }}
    >
      {children}
    </div>
  );
}
