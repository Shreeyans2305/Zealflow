import { useFormStore } from '../../store/formStore';
import { useUIStore } from '../../store/uiStore';
import { Share2, Play, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const schema = useFormStore(state => state.schema);
  const currentTab = useUIStore(state => state.currentTab);
  const setTab = useUIStore(state => state.setTab);
  const undo = useFormStore(state => state.undo);
  const redo = useFormStore(state => state.redo);
  const updateTitle = useFormStore(state => state.updateTitle);
  const navigate = useNavigate();

  const handlePreview = () => {
    if (!schema?.id) return;

    const previewUrl = `${window.location.origin}/f/${schema.id}`;
    const opened = window.open(previewUrl, '_blank', 'noopener,noreferrer');

    if (!opened) {
      navigate(`/f/${schema.id}`);
    }
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
            <button className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2">
            <Share2 size={14} strokeWidth={1.5} />
            Share
            </button>
            <button onClick={handlePreview} className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2">
            <Play size={14} strokeWidth={1.5} />
            Preview
            </button>
            <button className="btn-primary py-[6px] px-[16px] text-[13px]">
            Publish
            </button>
        </div>
      </div>
    </header>
  );
}
