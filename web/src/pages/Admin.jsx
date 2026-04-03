import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { ExternalLink, Plus, BarChart2 } from 'lucide-react';
import AdminSidebar from '../components/layout/AdminSidebar';

export default function Admin() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const forms = useFormStore((s) => s.forms);
  const createForm = useFormStore((s) => s.createForm);
  const selectForm = useFormStore((s) => s.selectForm);
  const isInitialized = useFormStore((s) => s.isInitialized);

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
    <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-[1100px] mx-auto px-12 py-16">

          <header className="flex justify-between items-end mb-[64px]">
            <div>
              <h1 className="text-4xl display-font text-[var(--color-text-primary)] mb-2">Registry</h1>
              <p className="text-[15px] text-[var(--color-text-secondary)]">Form blueprints and configurations.</p>
            </div>

            <button
              onClick={handleCreateNewForm}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span>New Form</span>
            </button>
          </header>

          {!isInitialized ? (
            <p className="text-[var(--color-text-tertiary)] text-[14px]">Loading forms…</p>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[var(--color-text-secondary)] text-[15px] mb-6">
                No forms yet. Create your first form to get started.
              </p>
              <button onClick={handleCreateNewForm} className="btn-primary flex items-center gap-2">
                <Plus size={16} strokeWidth={1.5} />
                New Form
              </button>
            </div>
          ) : (
            <section className="flex flex-col gap-6">
              <h2 className="label-upper mb-2">Active Blueprints</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => {
                  const fieldCount =
                    form.field_count ?? form.schema?.fields?.length ?? form.fields?.length ?? 0;
                  const version = form.version ?? form.schema?.version ?? 1;

                  return (
                    <div
                      key={form.id}
                      onClick={() => handleOpenBuilder(form.id)}
                      className="card cursor-pointer group flex flex-col justify-between min-h-[200px]"
                    >
                      <div className="mb-6">
                        <h3 className="display-font text-2xl text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                          {form.title}
                        </h3>
                        <p className="text-[14px] text-[var(--color-text-secondary)] flex gap-2 items-center">
                          <span>{fieldCount} Elements</span>
                          <span className="text-[var(--color-border-warm)]">|</span>
                          <span>v{version}.0</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[var(--color-border-warm)] pt-4 mt-auto">
                        <span className="text-[12px] font-medium text-[var(--color-success)] bg-[#4A7C5912] px-2 py-1 rounded">
                          {form.is_published ? 'Published' : 'Active'}
                        </span>
                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                          {/* Responses */}
                          <button
                            className="hover:text-[var(--color-text-primary)] transition-colors p-1"
                            title="View Responses"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/vault/${form.id}`);
                            }}
                          >
                            <BarChart2 size={16} strokeWidth={1.5} />
                          </button>
                          {/* Preview */}
                          <button
                            className="hover:text-[var(--color-text-primary)] transition-colors p-1"
                            title="Preview"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/f/${form.id}`, '_blank');
                            }}
                          >
                            <ExternalLink size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
