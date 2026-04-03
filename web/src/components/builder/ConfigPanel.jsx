import { X, Trash2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useFormStore } from '../../store/formStore';
import { fieldRegistry } from '../../registry/fieldRegistry';

export default function ConfigPanel() {
  const isConfigPanelOpen = useUIStore(state => state.isConfigPanelOpen);
  const selectedFieldId = useUIStore(state => state.selectedFieldId);
  const deselectField = useUIStore(state => state.deselectField);
  const schema = useFormStore(state => state.schema);
  const updateField = useFormStore(state => state.updateField);
  const deleteField = useFormStore(state => state.deleteField);
  const pages = schema.settings?.pages || [{ id: 'page_1', title: 'Page 1' }];

  const selectedField = schema.fields.find(f => f.id === selectedFieldId);

  // Derive the specific configuration component
  const SpecificConfigComponent = selectedField 
    ? (fieldRegistry[selectedField.type]?.ConfigComponent || null)
    : null;

  return (
    <>
      <div 
        className={`fixed inset-0 backdrop-blur z-40 transition-opacity duration-200 ease-out ${
          isConfigPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={deselectField}
      />

      <aside 
        className={`absolute right-0 top-0 bottom-0 w-[400px] bg-[#FFFFFF] border-l border-[var(--color-border-warm)] shadow-2xl transition-transform duration-200 ease-out z-50 flex flex-col ${
          isConfigPanelOpen ? 'translate-x-0' : 'translate-x-[110%]'
        }`}
      >
        <div className="flex items-center justify-between p-8 border-b border-[var(--color-border-warm)]">
          <h2 className="label-upper text-[var(--color-text-secondary)]">Settings</h2>
          <button 
            onClick={deselectField} 
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {selectedField ? (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="space-y-8">
              {/* Universal Properties */}
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Label</label>
                <input 
                  type="text" 
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  className="input-base w-full"
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Placeholder text</label>
                <input 
                  type="text" 
                  value={selectedField.placeholder || ''}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-[var(--color-border-warm)]">
                <label htmlFor="required" className="text-[15px] font-medium text-[var(--color-text-primary)] cursor-pointer">Require an answer</label>
                <input 
                  type="checkbox" 
                  id="required" 
                  checked={selectedField.required}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                  className="w-[18px] h-[18px] accent-[var(--color-accent)] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Page</label>
                <select
                  value={selectedField.meta?.pageId || pages[0]?.id}
                  onChange={(e) => updateField(selectedField.id, { meta: { ...(selectedField.meta || {}), pageId: e.target.value } })}
                  className="input-base w-full"
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Specific Config Component from Registry */}
              {SpecificConfigComponent && (
                <SpecificConfigComponent field={selectedField} updateField={updateField} />
              )}
              
              <div className="pt-12">
                 <button 
                  onClick={() => { deleteField(selectedField.id); deselectField(); }}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-transparent border border-[var(--color-error)] text-[var(--color-error)] rounded-[8px] font-medium text-[14px] hover:bg-red-50 transition-colors"
                 >
                   <Trash2 size={16} strokeWidth={1.5} />
                   Delete this block
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-[15px] text-[var(--color-text-tertiary)] flex flex-col items-center justify-center h-full">
              <p>No block selected.</p>
          </div>
        )}
      </aside>
    </>
  );
}
