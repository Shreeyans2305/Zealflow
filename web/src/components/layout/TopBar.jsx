import { useFormStore } from '../../store/formStore';
import { useUIStore } from '../../store/uiStore';
import { Share2, Play, Users, ArrowLeft, CheckCircle2, Copy, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { api } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';
import { ConfirmModal } from '../modals/ModalVariants';
import { ShareFormModal } from '../collaboration/ShareFormModal';

export default function TopBar() {
  const schema = useFormStore(state => state.schema);
  const forms = useFormStore(state => state.forms);
  const currentFormId = useFormStore(state => state.currentFormId);
  const applyToCurrentSchema = useFormStore(state => state.applyToCurrentSchema);
  const currentTab = useUIStore(state => state.currentTab);
  const setTab = useUIStore(state => state.setTab);
  const toggleAIPanel = useUIStore(state => state.toggleAIPanel);
  const isAIPanelOpen = useUIStore(state => state.isAIPanelOpen);
  const undo = useFormStore(state => state.undo);
  const redo = useFormStore(state => state.redo);
  const updateTitle = useFormStore(state => state.updateTitle);
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const [publishing, setPublishing] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const canPublish = useMemo(() => Boolean(schema?.id), [schema?.id]);
  const currentForm = useMemo(
    () => forms.find((f) => f.id === currentFormId),
    [forms, currentFormId]
  );
  const isPublished = Boolean(currentForm?.is_published);

  const handlePreview = () => {
    if (!schema?.id) return;

    const previewUrl = `${window.location.origin}/f/${schema.id}`;
    const opened = window.open(previewUrl, '_blank', 'noopener,noreferrer');

    if (!opened) {
      navigate(`/f/${schema.id}`);
    }
  };

  const handlePublish = async () => {
    if (!schema?.id || publishing) return;
    setPublishing(true);
    try {
      const result = await api.patch(`/api/forms/${schema.id}/publish`, {});

      if (!result?.is_published) {
        throw new Error('Could not publish this form');
      }

      if (result?.version) {
        applyToCurrentSchema((draft) => {
          draft.version = Number(result.version) || draft.version || 1;
        });
      }

      const url = `${window.location.origin}/f/${schema.id}`;
      setPublishUrl(url);
      setShowPublishSuccess(true);
      setCopied(false);
    } catch (err) {
      alert(err.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteForm = () => {
    if (!schema?.id) return;

    const modalId = openModal(
      <ConfirmModal
        isOpen={true}
        onClose={() => closeModal(modalId)}
        title="Delete Form"
        message="This will permanently delete the form and all of its responses. This cannot be undone."
        danger={true}
        onConfirm={async () => {
          await api.delete(`/api/forms/${schema.id}`);
          window.location.assign('/admin');
        }}
        onCancel={() => {}}
      />
    );
  };

  const handleShare = () => {
    if (!schema?.id) return;
    openModal(<ShareFormModal formId={schema.id} formTitle={schema.title} />);
  };

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-[#FFFFFF] border-b border-[var(--color-border-warm)] flex-shrink-0 z-30 relative transition-all duration-150 ease-out">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1" title="Back to Registry">
           <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        {/* Title Editor */}
        <input 
          value={schema.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="font-medium text-[15px] text-[var(--color-text-primary)] bg-transparent border-none outline-none focus:bg-[var(--color-bg-hover)] rounded px-2 py-1 transition-colors w-[300px]"
          placeholder="Untitled form"
        />

        {/* Save Status (Mock) */}
        <span className="text-[12px] text-[var(--color-text-tertiary)]">Saved</span>
      </div>

      {/* Center Nav */}
      <div className="flex gap-2">
        {['builder', 'logic', 'design'].map(tab => (
           <button 
             key={tab}
             onClick={() => setTab(tab)}
             className={`px-3 py-1 text-[13px] capitalize font-medium rounded transition-colors ${
                 currentTab === tab 
                 ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]' 
                 : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
             }`}
           >
               {tab}
           </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex border border-[var(--color-border-warm)] rounded-md overflow-hidden bg-[#FFFFFF]">
          <button onClick={undo} className="px-3 py-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors text-[13px] font-medium leading-none" title="Undo">↩</button>
          <div className="w-px bg-[var(--color-border-warm)] h-full"></div>
          <button onClick={redo} className="px-3 py-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors text-[13px] font-medium leading-none" title="Redo">↪</button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <button 
              onClick={toggleAIPanel}
              className={`btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2 transition-all ${isAIPanelOpen ? 'bg-[var(--color-bg-hover)] border-[var(--color-accent)] text-[var(--color-accent)]' : ''}`}
            >
              <Sparkles size={14} className={isAIPanelOpen ? 'text-[var(--color-accent)]' : ''} />
              AI Generate
            </button>
            <button 
              onClick={handleShare}
              className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2"
            >
            <Share2 size={14} strokeWidth={1.5} />
            Share
            </button>
            <button onClick={handlePreview} className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2">
            <Play size={14} strokeWidth={1.5} />
            Preview
            </button>
            <button
              onClick={handlePublish}
              disabled={!canPublish || publishing}
              className="btn-primary py-[6px] px-[16px] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {publishing ? 'Publishing…' : isPublished ? 'Republish' : 'Publish'}
            </button>
            <button
              onClick={handleDeleteForm}
              className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2 text-[var(--color-error)]"
              title="Delete form"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              Delete
            </button>
        </div>
      </div>

      {showPublishSuccess && (
        <div className="absolute top-[64px] right-6 z-50 bg-white border border-[var(--color-border-warm)] shadow-xl rounded-[14px] p-4 w-[360px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-[var(--color-success)] mt-0.5 animate-pulse" size={20} />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[var(--color-text-primary)]">Published successfully</div>
              <div className="text-[12px] text-[var(--color-text-secondary)] mt-1">Share this form URL</div>
              <div className="mt-2 flex items-center gap-2">
                <input readOnly value={publishUrl} className="input-base text-[12px] w-full" />
                <button
                  className="btn-secondary p-2"
                  onClick={() => {
                    navigator.clipboard?.writeText(publishUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  title="Copy URL"
                >
                  <Copy size={14} />
                </button>
              </div>
              {copied && <p className="text-[11px] text-[var(--color-success)] mt-1">Copied</p>}
            </div>
            <button onClick={() => setShowPublishSuccess(false)} className="text-[var(--color-text-tertiary)] text-[12px]">✕</button>
          </div>
        </div>
      )}
    </header>
  );
}
