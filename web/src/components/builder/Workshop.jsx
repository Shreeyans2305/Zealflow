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

function scopeThemeCssForBuilder(css) {
  if (!css) return '';
  const scope = '.zealflow-builder-preview';

  return css
    .replace(/:root\b/g, scope)
    .replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (match, brace, selectorBlock) => {
      const scopedSelectors = selectorBlock
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((selector) => {
          if (selector.startsWith(scope)) return selector;
          if (selector.startsWith('@')) return selector;
          if (selector.startsWith('html') || selector.startsWith('body')) {
            return `${scope}${selector.replace(/^(html|body)/, '')}`;
          }
          return `${scope} ${selector}`;
        })
        .join(', ');
      return `${brace}${brace ? ' ' : ''}${scopedSelectors} {`;
    });
}

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

  const themeCss = scopeThemeCssForBuilder(schema?.theme?.customCSS || '');
  const isDarkTheme = /--color-bg-base:\s*#(?:000|0b1020|111111|101010)/i.test(schema?.theme?.customCSS || '')
    || /--color-text-primary:\s*#(?:fff|f7f8ff|ffffff)/i.test(schema?.theme?.customCSS || '')
    || schema?.theme?.preset === 'dark';

  const builderPreviewOverrides = `
      .zealflow-builder-preview .zealflow-field-card,
      .zealflow-builder-preview .card,
      .zealflow-builder-preview .modal-glass {
        background: var(--color-bg-surface) !important;
        border-color: var(--color-border-warm) !important;
        color: var(--color-text-primary) !important;
        box-shadow: 0 18px 50px rgba(0,0,0,${isDarkTheme ? '0.34' : '0.06'}) !important;
        backdrop-filter: blur(16px);
      }

      .zealflow-builder-preview .input-base,
      .zealflow-builder-preview input:not([type="checkbox"]):not([type="radio"]),
      .zealflow-builder-preview textarea,
      .zealflow-builder-preview select {
        background: var(--color-bg-surface) !important;
        border-color: var(--color-border-warm) !important;
        color: var(--color-text-primary) !important;
      }

      .zealflow-builder-preview .input-base::placeholder,
      .zealflow-builder-preview input::placeholder,
      .zealflow-builder-preview textarea::placeholder {
        color: var(--color-text-tertiary) !important;
      }

      .zealflow-builder-preview .bg-\[\#FFFFFF\],
      .zealflow-builder-preview [class*="bg-white"],
      .zealflow-builder-preview [class*="bg-\[\#fafaf8\]"],
      .zealflow-builder-preview [class*="bg-\[\#FAFAF8\]"] {
        background-color: var(--color-bg-surface) !important;
      }

      .zealflow-builder-preview .border-\[var\(--color-border-warm\)\] {
        border-color: var(--color-border-warm) !important;
      }

      .zealflow-builder-preview .text-\[var\(--color-text-primary\)\] {
        color: var(--color-text-primary) !important;
      }

      .zealflow-builder-preview .text-\[var\(--color-text-secondary\)\],
      .zealflow-builder-preview .text-\[var\(--color-text-tertiary\)\] {
        color: var(--color-text-secondary) !important;
      }

      .zealflow-builder-preview .btn-secondary {
        background: color-mix(in srgb, var(--color-bg-surface) 88%, #fff 12%) !important;
        border-color: var(--color-border-warm) !important;
        color: var(--color-text-primary) !important;
      }

      .zealflow-builder-preview .btn-secondary:hover {
        background: color-mix(in srgb, var(--color-bg-surface) 72%, #fff 28%) !important;
      }

      .zealflow-builder-preview .btn-primary {
        color: #08111F !important;
        background: linear-gradient(135deg, #7C8CFF 0%, #57D8FF 100%) !important;
      }

      .zealflow-builder-preview,
      .zealflow-builder-preview * {
        color-scheme: ${isDarkTheme ? 'dark' : 'light'};
      }
    `;

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
      {themeCss && (
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      )}
      {builderPreviewOverrides && (
        <style dangerouslySetInnerHTML={{ __html: builderPreviewOverrides }} />
      )}
      
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar />

        <main className="zealflow-builder-preview flex-1 flex justify-center overflow-y-auto relative py-12 z-10 w-full px-6">
          <CollaboratorCursors collaborators={collaborators} currentUserId={admin?.id} />
          <Canvas />
        </main>
        
        {currentTab === 'builder' && <ConfigPanel />}
        {currentTab === 'logic' && <LogicPanel />}
        {currentTab === 'design' && <DesignPanel />}
      </div>
    </div>
  );
}
