import { Layers, Plus } from 'lucide-react';
import FieldPicker from '../builder/FieldPicker';
import { useFormStore } from '../../store/formStore';
import { useUIStore } from '../../store/uiStore';

export default function LeftSidebar() {
  const addField = useFormStore(state => state.addField);
  const addPage = useFormStore(state => state.addPage);
  const updatePageTitle = useFormStore(state => state.updatePageTitle);
  const schema = useFormStore(state => state.schema);
  const updateSettings = useFormStore(state => state.updateSettings);
  const currentPageId = useUIStore(state => state.currentPageId);
  const setCurrentPage = useUIStore(state => state.setCurrentPage);

  const pages = schema?.settings?.pages || [{ id: 'page_1', title: 'Page 1' }];
  const resolvedPageId = currentPageId || pages[0]?.id;

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[var(--color-bg-surface)] border-r border-[var(--color-border-warm)] flex flex-col h-full hidden md:flex transition-all duration-150 ease-out z-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="p-6 border-b border-[var(--color-border-warm)] shrink-0 bg-[#F4F3EF] sticky top-0 z-10 space-y-4">
        <button className="w-full text-left p-2 rounded hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-3">
          <Layers size={16} strokeWidth={1.5} className="text-[var(--color-text-secondary)]" />
          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">Pages</span>
        </button>
        <ul className="pl-9 space-y-1">
          {pages.map((page, idx) => (
            <li key={page.id}>
              <div
                className={`w-full text-left text-[13px] py-1 border-l pl-3 ml-[6px] transition-colors ${
                  resolvedPageId === page.id
                    ? 'text-[var(--color-text-primary)] border-[var(--color-accent)] font-medium'
                    : 'text-[var(--color-text-secondary)] border-[var(--color-border-warm)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <input
                  value={page.title || ''}
                  onFocus={() => setCurrentPage(page.id)}
                  onClick={() => setCurrentPage(page.id)}
                  onChange={(e) => updatePageTitle(page.id, e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder={`Page ${idx + 1}`}
                />
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            addPage();
            setTimeout(() => {
              const newest = (useFormStore.getState().schema?.settings?.pages || []).slice(-1)[0];
              if (newest?.id) setCurrentPage(newest.id);
            }, 0);
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 text-[12px] py-2 rounded border border-[var(--color-border-warm)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Plus size={13} /> Add page
        </button>

        <div className="pt-3 border-t border-[var(--color-border-warm)] flex items-center justify-between">
          <span className="text-[12px] text-[var(--color-text-secondary)]">Allow anonymous</span>
          <input
            type="checkbox"
            checked={schema?.settings?.allowAnonymousEntries !== false}
            onChange={(e) => updateSettings({ allowAnonymousEntries: e.target.checked })}
            className="w-[16px] h-[16px] accent-[var(--color-accent)]"
          />
        </div>

        <div className="pt-3 border-t border-[var(--color-border-warm)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-secondary)]">Deadline</span>
            <input
              type="checkbox"
              checked={Boolean(schema?.settings?.deadlineAt)}
              onChange={(e) => {
                if (!e.target.checked) {
                  updateSettings({ deadlineAt: null });
                  return;
                }
                const defaultValue = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const isoLocal = new Date(defaultValue.getTime() - defaultValue.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16);
                updateSettings({ deadlineAt: new Date(isoLocal).toISOString() });
              }}
              className="w-[16px] h-[16px] accent-[var(--color-accent)]"
            />
          </div>
          {schema?.settings?.deadlineAt && (
            <input
              type="datetime-local"
              value={new Date(new Date(schema.settings.deadlineAt).getTime() - new Date(schema.settings.deadlineAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              onChange={(e) => {
                const value = e.target.value;
                updateSettings({ deadlineAt: value ? new Date(value).toISOString() : null });
              }}
              className="input-base w-full text-[12px]"
            />
          )}
        </div>

        <div className="pt-3 border-t border-[var(--color-border-warm)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-secondary)]">Timed response</span>
            <input
              type="checkbox"
              checked={Boolean(schema?.settings?.timedResponseEnabled)}
              onChange={(e) => {
                const enabled = e.target.checked;
                if (!enabled) {
                  updateSettings({ timedResponseEnabled: false });
                  return;
                }

                const current = Number(schema?.settings?.timedResponseSeconds || 0);
                updateSettings({
                  timedResponseEnabled: true,
                  timedResponseSeconds: current > 0 ? current : 60,
                });
              }}
              className="w-[16px] h-[16px] accent-[var(--color-accent)]"
            />
          </div>
          {schema?.settings?.timedResponseEnabled && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                step={10}
                value={schema?.settings?.timedResponseSeconds || 60}
                onChange={(e) => updateSettings({ timedResponseSeconds: Math.max(10, Number(e.target.value) || 10) })}
                className="input-base w-full text-[12px]"
              />
              <span className="text-[11px] text-[var(--color-text-secondary)]">sec</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-grow relative pb-12 w-full">
        <FieldPicker onSelect={(type) => addField(type, resolvedPageId)} />
      </div>
    </aside>
  );
}
