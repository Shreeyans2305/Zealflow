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
  const isInitialized = useFormStore((state) => state.isInitialized);
  const schema = useFormStore((state) => state.schema);
  const currentTab = useUIStore((state) => state.currentTab);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  useEffect(() => {
    if (!id) return;
    if (!isInitialized) return;

    if (id === 'new') {
      const key = 'zealflow_new_form_redirect_id';
      const existingNewFormId = sessionStorage.getItem(key);
      if (existingNewFormId) {
        sessionStorage.removeItem(key);
        navigate(`/builder/${existingNewFormId}`, { replace: true });
        return;
      }

      const newFormId = createForm();
      sessionStorage.setItem(key, newFormId);
      navigate(`/builder/${newFormId}`, { replace: true });
      return;
    }

    const found = selectForm(id);
    if (!found) {
      navigate('/admin', { replace: true });
    }
  }, [id, isInitialized, selectForm, createForm, navigate]);

  useEffect(() => {
    const firstPageId = schema?.settings?.pages?.[0]?.id || null;
    setCurrentPage(firstPageId);
  }, [schema?.id, schema?.settings?.pages, setCurrentPage]);

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
