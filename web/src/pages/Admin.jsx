import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { ExternalLink, LogOut, Plus, Settings } from 'lucide-react';

export default function Admin() {
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const forms = useFormStore(state => state.forms);
  const createForm = useFormStore(state => state.createForm);
  const selectForm = useFormStore(state => state.selectForm);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateNewForm = () => {
    const newFormId = createForm();
    navigate(`/builder/${newFormId}`);
  };

  const handleOpenBuilder = (formId) => {
    selectForm(formId);
    navigate(`/builder/${formId}`);
  };

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      {/* Architectural Breadcrumb Sidebar */}
      <aside className="w-16 border-r flex-shrink-0 ghost-border bg-surface-container relative glass-panel flex flex-col items-center py-6">
        <div className="w-8 h-8 rounded-full lit-gradient flex items-center justify-center font-bold text-on-primary">Z</div>
        
        <div className="mt-12 flex-1 flex flex-col items-center gap-12 font-mono text-[10px] tracking-[0.2em] text-on-surface-variant uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            <span className="text-primary font-semibold">Workspace</span>
            <span className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity">Users</span>
            <span className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity">Settings</span>
        </div>

        <button onClick={handleLogout} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors" title="Logout">
            <LogOut size={20} />
        </button>
      </aside>

      <main className="flex-1 px-16 py-12 flex flex-col relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary opacity-[0.03] blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

        <header className="flex justify-between items-end mb-16 z-10">
          <div>
            <h1 className="text-display-lg display-font text-on-surface font-light tracking-tight leading-none mb-2">Form Registry</h1>
            <p className="text-on-surface-variant">Schema management and telemetry.</p>
          </div>
          
          <button 
            onClick={handleCreateNewForm}
            className="flex items-center gap-2 px-6 py-3 lit-gradient text-on-primary rounded-md font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            <span>Construct New Form</span>
          </button>
        </header>

        <section className="flex-1 w-full max-w-4xl z-10">
            {/* Dark Mode Specific Component: Cards with no borders, shift bg explicitly */}
            <div className="flex flex-col gap-8">
                {forms.map(form => (
                    <div 
                        key={form.id} 
                    onClick={() => handleOpenBuilder(form.id)}
                        className="group bg-surface-container hover:bg-surface-container-high transition-colors p-8 rounded-lg cursor-pointer ambient-shadow flex justify-between items-center"
                    >
                        <div>
                            <h3 className="display-font text-2xl font-medium mb-1 text-on-surface group-hover:text-primary transition-colors">{form.title}</h3>
                            <p className="text-on-surface-variant text-sm flex gap-3">
                                <span>{form.fields.length} Nodes</span> • <span>v{form.version}.0</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-on-surface-variant">
                          <button
                            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
                            title="Open form"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/f/${form.id}`, '_blank');
                            }}
                          >
                            <ExternalLink size={20} />
                          </button>
                            <button className="p-2 hover:bg-surface-container-highest rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); /* stub */ }}>
                                <Settings size={20} />
                            </button>
                            <span className="text-xs uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full font-semibold">Active</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}
