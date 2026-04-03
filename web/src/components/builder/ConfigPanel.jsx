import { X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useFormStore } from '../../store/formStore';

export default function ConfigPanel() {
  const isConfigPanelOpen = useUIStore(state => state.isConfigPanelOpen);
  const selectedFieldId = useUIStore(state => state.selectedFieldId);
  const deselectField = useUIStore(state => state.deselectField);
  const schema = useFormStore(state => state.schema);
  const updateField = useFormStore(state => state.updateField);
  const deleteField = useFormStore(state => state.deleteField);

  const selectedField = schema.fields.find(f => f.id === selectedFieldId);

  return (
    <aside 
      className={`absolute right-0 top-0 bottom-0 w-[400px] bg-surface-container glass-panel ghost-border border-l shadow-2xl transition-transform duration-300 ease-out z-40 flex flex-col ${
        isConfigPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-6">
        <h2 className="text-xs tracking-[0.2em] uppercase font-semibold text-on-surface-variant">Properties</h2>
        <button 
          onClick={deselectField} 
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {selectedField ? (
        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-8">
            <div>
              <label className="block text-sm text-on-surface-variant mb-2">Label</label>
              <input 
                type="text" 
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low ghost-border border rounded-md focus:outline-none focus:border-primary text-on-surface transition-all text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-on-surface-variant mb-2">Placeholder</label>
              <input 
                type="text" 
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-low ghost-border border rounded-md focus:outline-none focus:border-primary text-on-surface transition-all text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <label htmlFor="required" className="text-sm text-on-surface font-medium cursor-pointer">Required Field</label>
              <input 
                type="checkbox" 
                id="required" 
                checked={selectedField.required}
                onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                className="w-5 h-5 accent-primary bg-surface-container-low border-none rounded cursor-pointer"
              />
            </div>
            
            <div className="pt-12">
               <button 
                onClick={() => { deleteField(selectedField.id); deselectField(); }}
                className="w-full py-3 px-4 bg-transparent ghost-border border text-error rounded hover:bg-error/10 font-medium text-sm transition-colors text-center"
               >
                 Destroy Node
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-on-surface-variant flex flex-col items-center justify-center h-full opacity-50">
            <p>Awaiting selection.</p>
        </div>
      )}
    </aside>
  );
}
