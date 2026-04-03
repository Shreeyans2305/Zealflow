import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';
import TopBar from '../layout/TopBar';
import LeftSidebar from '../layout/LeftSidebar';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';
import DesignPanel from './DesignPanel';
import { useUIStore } from '../../store/uiStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import { CollaboratorCursors } from '../collaboration/CollaboratorCursors';
import { useAuthStore } from '../../store/authStore';

export default function Workshop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectForm = useFormStore((state) => state.selectForm);
  const createForm = useFormStore((state) => state.createForm);
  const isInitialized = useFormStore((state) => state.isInitialized);
  const schema = useFormStore((state) => state.schema);
  const currentTab = useUIStore((state) => state.currentTab);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const admin = useAuthStore((s) => s.admin);

  const { collaborators, broadcastCursor, broadcastSync, channel } = useCollaboration(id);
  const setYjsProvider = useFormStore((s) => s.setYjsProvider);
  const applyRemoteUpdate = useFormStore((s) => s.applyRemoteUpdate);

  // Initialize Yjs provider connection
  useEffect(() => {
    if (id && id !== 'new') {
      setYjsProvider(broadcastSync);
    }
  }, [id, setYjsProvider, broadcastSync]);

  // Handle incoming Yjs updates
  useEffect(() => {
    if (!channel) return;
    
    const sub = channel.on('broadcast', { event: 'yjs_update' }, ({ payload }) => {
      if (payload.user_id !== admin?.id) {
        applyRemoteUpdate(payload.update);
      }
    });

    return () => {
      // Subscriptions are handled by channel.unsubscribe in hook
    };
  }, [channel, admin?.id, applyRemoteUpdate]);

  const handleMouseMove = (e) => {
    if (!id || id === 'new') return;
    broadcastCursor(e.clientX, e.clientY);
  };

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
    <div 
      className="flex flex-col h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-all duration-150 ease-out relative"
      onMouseMove={handleMouseMove}
    >
      {schema?.theme?.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: schema.theme.customCSS }} />
      )}
      
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar />

        <main className="flex-1 flex justify-center overflow-y-auto relative py-12 z-10 w-full px-6">
          <CollaboratorCursors collaborators={collaborators} currentUserId={admin?.id} />
          <Canvas />
        </main>
        
        {currentTab === 'builder' && <ConfigPanel />}
        {currentTab === 'design' && <DesignPanel />}
      </div>
    </div>
  );
}
