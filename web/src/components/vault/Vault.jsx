import { useFormStore } from '../../store/formStore';
import { Download, Search, LayoutTemplate } from 'lucide-react';

export default function Vault() {
  const schema = useFormStore(state => state.schema);
  
  // Mock data for responses
  const mockResponses = [
    { id: 1, submittedAt: '2026-04-03 14:00', data: { 'field_1': 'Alice', 'field_2': 'alice@example.com' } },
    { id: 2, submittedAt: '2026-04-03 14:30', data: { 'field_1': 'Bob', 'field_2': 'bob@example.com' } },
    { id: 3, submittedAt: '2026-04-03 15:15', data: { 'field_1': 'Charlie', 'field_2': 'charlie@example.com' } },
  ];

  const columns = schema.fields.filter(f => !f.meta?.hidden);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center text-brand-primary font-bold text-lg border-2 border-indigo-100 rounded bg-indigo-50">V</div>
          <h1 className="text-xl font-semibold text-gray-900 truncate max-w-xs">{schema.title} — Vault</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search responses..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded hover:border-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-brand-primary outline-none transition-all text-sm w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             {schema.fields.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                     <LayoutTemplate size={48} className="mb-4 text-gray-300" />
                     <h3 className="text-lg font-medium text-gray-900 mb-1">No fields in form</h3>
                     <p>Go back to the builder to add fields before viewing responses.</p>
                 </div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Submitted At</th>
                                {columns.map(col => (
                                    <th key={col.id} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap max-w-[200px] truncate">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mockResponses.map(response => (
                                <tr key={response.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{response.submittedAt}</td>
                                    {columns.map(col => (
                                        <td key={col.id} className="p-4 text-sm text-gray-900 max-w-[250px] truncate">
                                            {response.data[col.id] || <span className="text-gray-300">—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
          </div>
      </main>
    </div>
  );
}
