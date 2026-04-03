import { Layers, MousePointer2 } from 'lucide-react';

export default function LeftSidebar() {
  return (
    <aside className="w-[240px] flex-shrink-0 bg-surface-container flex flex-col h-full hidden md:flex transition-all duration-300 z-20">
      <div className="p-4 mb-4">
        <button className="w-full text-left p-2 rounded hover:bg-surface-container-high transition-colors flex items-center gap-3">
          <Layers size={18} className="text-on-surface-variant" />
          <span className="text-sm font-medium text-on-surface">Form Pages</span>
        </button>
        {/* Placeholder for pages / sections list */}
        <ul className="mt-2 pl-9">
          <li className="text-sm text-on-surface font-medium py-1">Page 1 (Start)</li>
        </ul>
      </div>
      
      <div className="p-4 flex-grow">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Field Palette</h3>
        <p className="text-xs text-on-surface-variant opacity-70 mb-4">Click + in canvas or press / to add fields.</p>
        
        {/* Quick select palette could go here */}
        <div className="ghost-border border rounded p-3 bg-surface-container-low flex flex-col items-center gap-3 text-center">
            <MousePointer2 className="text-on-surface-variant" size={24} />
            <p className="text-xs text-on-surface-variant">Drag fields from here or use the Field Picker on canvas.</p>
        </div>
      </div>
    </aside>
  );
}
