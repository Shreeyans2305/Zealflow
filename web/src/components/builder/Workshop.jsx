import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';
import TopBar from '../layout/TopBar';
import LeftSidebar from '../layout/LeftSidebar';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';
import DesignPanel from './DesignPanel';
import { useUIStore } from '../../store/uiStore';

export default function Workshop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectForm = useFormStore((state) => state.selectForm);
  const createForm = useFormStore((state) => state.createForm);
  const schema = useFormStore((state) => state.schema);
  const currentTab = useUIStore((state) => state.currentTab);

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
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-all duration-150 ease-out">
      {schema?.theme?.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: schema.theme.customCSS }} />
      )}
      
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar />

        <main className="flex-1 flex justify-center overflow-y-auto relative py-12 z-10 w-full px-6">
          <Canvas />
        </main>
        
        {currentTab === 'builder' && <ConfigPanel />}
        {currentTab === 'design' && <DesignPanel />}
      </div>
    </div>
  );
}
