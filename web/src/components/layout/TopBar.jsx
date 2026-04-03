import { useFormStore } from '../../store/formStore';
import { Share2, Play, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const schema = useFormStore(state => state.schema);
  const undo = useFormStore(state => state.undo);
  const redo = useFormStore(state => state.redo);
  const updateTitle = useFormStore(state => state.updateTitle);
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-surface-container glass-panel ghost-border border-b shadow-sm flex-shrink-0 z-30 relative">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
           <ArrowLeft size={18} />
        </button>

        {/* Title Editor */}
        <input 
          value={schema.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="font-medium text-on-surface bg-transparent border-none outline-none focus:bg-surface-container-highest focus:ring-1 focus:ring-primary rounded px-2 py-1 transition-colors w-64"
          placeholder="Untitled form"
        />

        {/* Save Status (Mock) */}
        <span className="text-xs text-on-surface-variant opacity-70">Saved ✓</span>
      </div>

      <div className="flex gap-1 bg-surface-container-high p-1 rounded-md">
        <button className="px-3 py-1 text-sm font-medium rounded bg-surface-container-highest text-on-surface shadow-sm">Workshop</button>
        <button className="px-3 py-1 text-sm font-medium rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">Logic</button>
        <button className="px-3 py-1 text-sm font-medium rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">Theme</button>
      </div>

      <div className="flex items-center gap-3">
        {/* Undo/Redo */}
        <div className="flex ghost-border border rounded-md overflow-hidden bg-surface-container-low">
          <button onClick={undo} className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-mono text-sm leading-none" title="Undo (Cmd+Z)">↩</button>
          <div className="w-px bg-outline-variant h-full opacity-20"></div>
          <button onClick={redo} className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-mono text-sm leading-none" title="Redo (Shift+Cmd+Z)">↪</button>
        </div>

        {/* Actions */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-on-surface-variant bg-transparent ghost-border border rounded hover:bg-surface-container-high transition-colors">
          <Share2 size={16} />
          Share
        </button>
        <button onClick={() => window.open(`/f/${schema.id}`, '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-on-surface-variant bg-transparent ghost-border border rounded hover:bg-surface-container-high transition-colors">
          <Play size={16} />
          Preview
        </button>
        <button className="px-4 py-1.5 text-sm font-medium text-on-primary lit-gradient rounded hover:opacity-90 transition-opacity shadow-lg">
          Publish
        </button>
      </div>
    </header>
  );
}
