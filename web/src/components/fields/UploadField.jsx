import { Upload, X, File } from 'lucide-react';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export function UploadStage({ field, value, onChange }) {
  const { id: formId } = useParams();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const acceptedTypes = field.meta?.acceptedTypes || 'PDF, JPG, PNG';

  const parseAcceptAttr = (typesLabel) => {
    if (!typesLabel) return '';
    return typesLabel
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (s.startsWith('.')) return s;
        if (s.includes('/')) return s;
        return `.${s.toLowerCase()}`;
      })
      .join(',');
  };

  const uploadFile = async (file) => {
    if (!formId || !file) return;
    setUploadError('');
    setUploading(true);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const data = new FormData();
      data.append('file', file);
      data.append('field_id', field.id);

      const res = await fetch(`${base}/api/forms/${formId}/files/upload`, {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        let detail = 'File upload failed';
        try {
          const body = await res.json();
          detail = body.detail || detail;
        } catch {
          // no-op
        }
        throw new Error(detail);
      }

      const fileInfo = await res.json();
      onChange(field.id, fileInfo);
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onChange(field.id, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedFileName = typeof value === 'string' ? value : value?.file_name;

  if (selectedFileName) {
    return (
      <div className="space-y-2">
      <div className="flex items-center gap-3 p-4 border border-[var(--color-border-warm)] rounded-[8px] bg-[var(--color-bg-base)]">
        <div className="w-10 h-10 bg-[var(--color-bg-surface)] rounded border border-[var(--color-border-warm)] flex items-center justify-center text-[var(--color-text-secondary)]">
          <File size={20} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{selectedFileName}</p>
          <p className="text-[12px] text-[var(--color-text-tertiary)]">Attached successfully{value?.size_bytes ? ` · ${Math.ceil(value.size_bytes / 1024)} KB` : ''}</p>
        </div>
        <button 
          type="button" 
          onClick={removeFile}
          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] rounded"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>
      {uploadError && <p className="text-[12px] text-[var(--color-error)]">{uploadError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
    <div 
      className={`relative w-full border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-colors duration-150 ease-out ${
        isDragging 
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' 
          : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept={parseAcceptAttr(acceptedTypes)}
        ref={fileInputRef} 
        onChange={handleChange} 
        disabled={uploading}
        className="hidden" 
      />
      
      <div className="flex flex-col items-center justify-center">
        <Upload size={24} className="text-[var(--color-text-tertiary)] mb-4" strokeWidth={1.5} />
        <p className="text-[15px] text-[var(--color-text-secondary)] mb-1">
          {uploading ? 'Uploading file…' : 'Drop file here or click to browse'}
        </p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          {acceptedTypes}
        </p>
      </div>
    </div>
    {uploadError && <p className="text-[12px] text-[var(--color-error)]">{uploadError}</p>}
    </div>
  );
}

export function UploadConfig({ field, updateField }) {
  const types = field.meta?.acceptedTypes || 'PDF, JPG, PNG';

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6">
      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Accepted File Types</label>
      <input 
        type="text" 
        value={types}
        onChange={(e) => updateField(field.id, { meta: { ...field.meta, acceptedTypes: e.target.value } })}
        className="input-base w-full"
      />
    </div>
  );
}
