import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const BackButton = ({ 
  to, 
  label = 'Back', 
  onClick,
  className = 'mb-4'
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back one page in history
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft />
      {label}
    </Button>
  );
};

export default BackButton;