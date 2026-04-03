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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-lg p-8 glass-panel rounded-xl ghost-border ambient-shadow text-center">
        <h1 className="text-display-lg text-on-surface font-semibold mb-3 display-font">The Architect</h1>
        <p className="text-on-surface-variant font-medium mb-12">
          Design structural forms with precision.
        </p>

        <div className="flex flex-col gap-6 w-full px-6">
          <button 
            onClick={() => handleLogin('admin')}
            className="w-full lit-gradient text-on-primary py-4 rounded-md font-medium text-lg uppercase tracking-wide hover:opacity-90 transition-opacity"
          >
            Enter as Admin
          </button>
          
          <div className="flex items-center gap-4 text-on-surface-variant text-sm">
            <div className="h-px bg-surface-container-highest flex-1"></div>
            <span>OR</span>
            <div className="h-px bg-surface-container-highest flex-1"></div>
          </div>

          <button 
            onClick={() => handleLogin('user')}
            className="w-full bg-transparent ghost-border text-on-surface py-4 rounded-md font-medium text-lg hover:bg-surface-container-high transition-colors"
          >
            Enter as User
          </button>
        </div>
      </div>
      
      <p className="absolute bottom-8 text-on-surface-variant text-sm italic">
        Data persistance strictly retained via Local Storage.
      </p>
    </div>
  );
}
