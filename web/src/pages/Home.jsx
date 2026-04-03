import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const loginAs = useAuthStore((state) => state.loginAs);
  const forms = useFormStore((state) => state.forms);
  const navigate = useNavigate();

  const handleLogin = (role) => {
    loginAs(role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      const targetForm = forms[0];
      if (targetForm) {
        navigate(`/f/${targetForm.id}`);
      } else {
        navigate('/admin');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 text-[var(--color-text-primary)] transition-all duration-150 ease-out">
      
      <div className="w-full max-w-[720px] flex flex-col items-center text-center">
        <h1 className="text-5xl display-font mb-4 text-[var(--color-text-primary)]">The Architect</h1>
        <p className="text-[17px] text-[var(--color-text-secondary)] mb-12 max-w-sm">
          Design structural forms with quiet precision and intentional empty space.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm">
          <button 
            onClick={() => handleLogin('admin')}
            className="btn-primary w-full sm:w-auto"
          >
            Enter Workspace
          </button>
          
          <button 
            onClick={() => handleLogin('user')}
            className="btn-secondary w-full sm:w-auto"
          >
            View Demo Form
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-center text-sm text-[var(--color-text-tertiary)]">
        Data persistance via Local Storage.
      </div>
    </div>
  );
}
