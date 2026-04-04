import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { ExternalLink, Plus, BarChart2, X } from 'lucide-react';
import AdminSidebar from '../components/layout/AdminSidebar';
import { FORM_TEMPLATES, createTemplateSchema } from '../utils/formTemplates';

export default function Admin() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const forms = useFormStore((s) => s.forms);
  const createForm = useFormStore((s) => s.createForm);
  const selectForm = useFormStore((s) => s.selectForm);
  const isInitialized = useFormStore((s) => s.isInitialized);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateNewForm = () => {
    setShowTemplatePicker(true);
  };

  const handleCreateFromTemplate = (templateId) => {
    const templateSchema = templateId === 'scratch' ? null : createTemplateSchema(templateId);
    const newFormId = createForm(templateSchema);
    setShowTemplatePicker(false);
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

      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[var(--color-bg-surface)] w-full max-w-[960px] rounded-3xl border border-[var(--color-border-warm)] shadow-[0_28px_80px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--color-border-warm)] bg-[color-mix(in_srgb,var(--color-bg-surface)_86%,#fff_14%)]">
              <div>
                <h2 className="text-[32px] leading-none display-font text-[var(--color-text-primary)]">Create a new form</h2>
                <p className="text-[14px] text-[var(--color-text-secondary)] mt-2">Start clean or pick a polished starter template.</p>
              </div>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 gap-5 bg-[var(--color-bg-base)] overflow-hidden">
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(79,109,255,0.14),rgba(79,109,255,0)_72%)]" />
              {FORM_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template.id)}
                  className={`text-left p-5 rounded-2xl border border-[var(--color-border-warm)] bg-gradient-to-br ${template.gradient} hover:shadow-[0_18px_38px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-[24px] leading-tight display-font text-[var(--color-text-primary)]">{template.name}</h3>
                    <span className="text-[11px] font-semibold tracking-[0.02em] px-2.5 py-1 rounded-full bg-black/10 text-[var(--color-text-primary)] backdrop-blur">
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] max-w-[92%]">{template.description}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-text-primary)] bg-black/10 rounded-full px-3.5 py-2 backdrop-blur">
                    Use this template
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
