import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((component) => {
    const id = Date.now().toString();
    setModals((prev) => [...prev, { id, component }]);
    return id;
  }, []);

  const closeModal = useCallback((id) => {
    setModals((prev) => prev.filter((modal) => modal.id !== id));
  }, []);

  const closeTopModal = useCallback(() => {
    setModals((prev) => prev.slice(0, -1));
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeTopModal }}>
      {children}
      {modals.map((modal) => (
        <div key={modal.id}>{modal.component}</div>
      ))}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
