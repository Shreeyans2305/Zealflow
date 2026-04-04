import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';
import TopBar from '../layout/TopBar';
import LeftSidebar from '../layout/LeftSidebar';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';
import DesignPanel from './DesignPanel';
import LogicPanel from './LogicPanel';
import { useUIStore } from '../../store/uiStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import { CollaboratorCursors } from '../collaboration/CollaboratorCursors';
import { useAuthStore } from '../../store/authStore';
import AIGeneratePanel from './AIGeneratePanel';

export default function Workshop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectForm = useFormStore((state) => state.selectForm);
  const createForm = useFormStore((state) => state.createForm);
  const isInitialized = useFormStore((state) => state.isInitialized);
  const schema = useFormStore((state) => state.schema);
  const currentTab = useUIStore((state) => state.currentTab);
  const currentPageId = useUIStore((state) => state.currentPageId);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const admin = useAuthStore((s) => s.admin);

  const {
    collaborators,
    broadcastCursor,
    broadcastSync,
    broadcastSchema,
    onRemoteYjsUpdate,
    onSchemaSnapshot,
  } = useCollaboration(id);
  const setYjsProvider = useFormStore((s) => s.setYjsProvider);
  const resetYjsDoc = useFormStore((s) => s.resetYjsDoc);
  const applyRemoteUpdate = useFormStore((s) => s.applyRemoteUpdate);
  const applyRemoteSchemaSnapshot = useFormStore((s) => s.applyRemoteSchemaSnapshot);
  const flushAutoSaveNow = useFormStore((s) => s.flushAutoSaveNow);

  // Initialize Yjs provider connection
  useEffect(() => {
    if (id && id !== 'new' && schema?.id === id) {
      resetYjsDoc();
      setYjsProvider(broadcastSync, broadcastSchema);
    }
  }, [id, schema?.id, resetYjsDoc, setYjsProvider, broadcastSync, broadcastSchema]);

  // Handle incoming Yjs updates
  useEffect(() => {
    const dispose = onRemoteYjsUpdate((update) => {
      if (admin?.id) {
        applyRemoteUpdate(update);
      }
    });
    return () => {
      dispose();
    };
  }, [admin?.id, applyRemoteUpdate, onRemoteYjsUpdate]);

  useEffect(() => {
    const dispose = onSchemaSnapshot((snapshotSchema) => {
      if (admin?.id) {
        applyRemoteSchemaSnapshot(snapshotSchema);
      }
    });
    return () => {
      dispose();
    };
  }, [admin?.id, applyRemoteSchemaSnapshot, onSchemaSnapshot]);

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
    const pages = schema?.settings?.pages || [];
    if (pages.length === 0) {
      setCurrentPage(null);
      return;
    }

    const hasValidCurrentPage = currentPageId && pages.some((p) => p.id === currentPageId);
    if (!hasValidCurrentPage) {
      setCurrentPage(pages[0].id);
    }
  }, [schema?.id, schema?.settings?.pages, currentPageId, setCurrentPage]);

  useEffect(() => {
    const handlePageHide = () => {
      flushAutoSaveNow();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAutoSaveNow();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushAutoSaveNow();
    };
  }, [flushAutoSaveNow]);

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
        {currentTab === 'logic' && <LogicPanel />}
        {currentTab === 'design' && <DesignPanel />}

        <AIGeneratePanel />
      </div>
    </div>
  );
}
