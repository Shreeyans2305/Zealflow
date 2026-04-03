import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';

export function ConfirmModal({ isOpen, onClose, title, message, onConfirm, onCancel, danger = false }) {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <ModalHeader title={title} onClose={handleCancel} />
      <ModalBody>
        <p className="text-[var(--color-text-primary)]">{message}</p>
      </ModalBody>
      <ModalFooter>
        <button onClick={handleCancel} className="btn-secondary text-[14px] px-4 py-2">
          Cancel
        </button>
        <button 
          onClick={handleConfirm} 
          className={`btn-primary text-[14px] px-4 py-2 ${danger ? '!bg-[#B84040]' : ''}`}
        >
          Confirm
        </button>
      </ModalFooter>
    </Modal>
  );
}

export function InfoModal({ isOpen, onClose, title, content }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        {typeof content === 'string' ? (
          <p className="text-[var(--color-text-primary)]">{content}</p>
        ) : (
          content
        )}
      </ModalBody>
      <ModalFooter>
        <div className="w-full flex justify-center">
            <button onClick={onClose} className="btn-secondary text-[14px] px-6 py-2">
            Got it
            </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

export function FormModal({ isOpen, onClose, title, children, onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onCancel?.(); onClose(); }}>
      <ModalHeader title={title} onClose={() => { onCancel?.(); onClose(); }} />
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {children}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => { onCancel?.(); onClose(); }} className="btn-secondary text-[14px] px-4 py-2">
            Cancel
          </button>
          <button type="submit" className="btn-primary text-[14px] px-4 py-2">
            Save
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function QuickViewModal({ isOpen, onClose, title, data }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-[12px] uppercase text-[#A8A49E] tracking-wider font-medium">{key}</span>
              <span className="text-[15px] text-[#1C1B19]">{value}</span>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <button onClick={onClose} className="btn-secondary text-[14px] px-4 py-2">
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
