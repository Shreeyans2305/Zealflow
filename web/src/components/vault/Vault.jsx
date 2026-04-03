import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ExternalLink, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { api } from '../../utils/apiClient';
import AdminSidebar from '../layout/AdminSidebar';

export default function Vault() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);         // { form_title, schema, responses }
  const [loadState, setLoadState] = useState('loading');
  const [sheetsModal, setSheetsModal] = useState(false);
  const [exportUrl, setExportUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    api.get(`/api/forms/${id}/responses`)
      .then((result) => { setData(result); setLoadState('ready'); })
      .catch(() => setLoadState('error'));
  }, [id]);

  const handleExportCsv = async () => {
    const res = await api.getRaw(`/api/forms/${id}/responses/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data?.form_title || 'responses').replace(/ /g, '_')}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenSheets = () => {
    const token = localStorage.getItem('zealflow_token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${base}/api/forms/${id}/responses/export`;
    // Append token as query param so the URL can be pasted in Google Sheets
    setExportUrl(`${url}?Authorization=Bearer ${token}`);
    setSheetsModal(true);
  };

  const fields = data?.schema?.fields?.filter((f) => !f.meta?.hidden) || [];
  const responses = data?.responses || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-[var(--color-border-warm)] bg-[#FFFFFF]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-2xl display-font text-[var(--color-text-primary)]">
                {data?.form_title || 'Responses'}
              </h1>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                {responses.length} {responses.length === 1 ? 'response' : 'responses'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenSheets}
              disabled={loadState !== 'ready'}
              className="btn-secondary py-[6px] px-[12px] text-[13px] flex items-center gap-2 disabled:opacity-40"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              Google Sheets
            </button>
            <button
              onClick={handleExportCsv}
              disabled={loadState !== 'ready'}
              className="btn-primary py-[6px] px-[12px] text-[13px] flex items-center gap-2 disabled:opacity-40"
            >
              <Download size={14} strokeWidth={1.5} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-8">
          {loadState === 'loading' && (
            <p className="text-[var(--color-text-tertiary)] text-[14px]">Loading responses…</p>
          )}

          {loadState === 'error' && (
            <p className="text-[var(--color-error)] text-[14px]">Failed to load responses.</p>
          )}

          {loadState === 'ready' && fields.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-secondary)]">
              <LayoutTemplate size={44} className="mb-4 opacity-20" />
              <h3 className="text-[18px] font-medium text-[var(--color-text-primary)] mb-1">No fields in this form</h3>
              <p className="text-[14px]">Add fields in the builder before viewing responses.</p>
            </div>
          )}

          {loadState === 'ready' && fields.length > 0 && responses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-secondary)]">
              <h3 className="text-[18px] font-medium text-[var(--color-text-primary)] mb-1">No responses yet</h3>
              <p className="text-[14px]">Share the form link to start collecting responses.</p>
            </div>
          )}

          {loadState === 'ready' && fields.length > 0 && responses.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border-warm)]">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-[var(--color-border-warm)] bg-[var(--color-bg-hover)]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] whitespace-nowrap">
                      Submitted At
                    </th>
                    {fields.map((col) => (
                      <th
                        key={col.id}
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] whitespace-nowrap max-w-[200px] truncate"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((resp) => (
                    <tr
                      key={resp.id}
                      className="border-b border-[var(--color-border-warm)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] whitespace-nowrap">
                        {new Date(resp.submitted_at).toLocaleString()}
                      </td>
                      {fields.map((col) => {
                        const val = resp.data?.[col.id];
                        const display =
                          val === undefined || val === null || val === ''
                            ? null
                            : Array.isArray(val)
                            ? val.join(', ')
                            : String(val);
                        return (
                          <td key={col.id} className="px-4 py-3 text-[13px] text-[var(--color-text-primary)] max-w-[280px] truncate">
                            {display ?? <span className="text-[var(--color-text-tertiary)]">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Google Sheets instructions modal */}
      {sheetsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-[480px] w-full p-8">
            <h2 className="text-xl display-font mb-2">Open in Google Sheets</h2>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-5 leading-relaxed">
              Google Sheets can import any CSV from a URL. Follow these steps:
            </p>
            <ol className="text-[13px] text-[var(--color-text-primary)] space-y-2 mb-6 list-decimal list-inside">
              <li>Open <strong>Google Sheets</strong> → create a new spreadsheet</li>
              <li>Go to <strong>File → Import → URL</strong></li>
              <li>Paste the URL below and click <strong>Import data</strong></li>
            </ol>
            <div className="bg-[var(--color-bg-hover)] rounded-lg p-3 mb-4 break-all text-[12px] font-mono text-[var(--color-text-secondary)] select-all">
              {exportUrl}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(exportUrl); }}
                className="btn-primary flex-1 text-[13px] py-2"
              >
                Copy URL
              </button>
              <button
                onClick={() => setSheetsModal(false)}
                className="btn-secondary flex-1 text-[13px] py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
