import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';
import TopBar from '../layout/TopBar';
import LeftSidebar from '../layout/LeftSidebar';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';

export default function Workshop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectForm = useFormStore((state) => state.selectForm);
  const createForm = useFormStore((state) => state.createForm);

  useEffect(() => {
    if (!id) return;

    if (id === 'new') {
      const newFormId = createForm();
      navigate(`/builder/${newFormId}`, { replace: true });
      return;
    }

    const found = selectForm(id);
    if (!found) {
      const fallbackFormId = createForm();
      navigate(`/builder/${fallbackFormId}`, { replace: true });
    }
  }, [id, selectForm, createForm, navigate]);

  return (
    <div className="flex flex-col h-screen w-full bg-surface text-on-surface overflow-hidden relative">
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar />
        
        {/* Ambient Top Glow for Canvas background */}
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] bg-primary opacity-[0.02] blur-[150px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0"></div>

        <main className="flex-1 flex justify-center overflow-y-auto relative p-8 z-10 w-full">
          <Canvas />
        </main>
        
        <ConfigPanel />
      </div>
    </div>
  );
}
