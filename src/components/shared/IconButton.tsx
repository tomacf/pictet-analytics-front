import type { LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';
import './IconButton.css';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'edit' | 'duplicate';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  className = '',
}) => {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`}
        aria-label={label}
        disabled={disabled}
      >
        <Icon size={size === 'sm' ? 16 : 20} />
      </button>
    </Tooltip>
  );
};

export default IconButton;
