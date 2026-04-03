import { motion, AnimatePresence } from 'framer-motion';

export function CollaboratorCursors({ collaborators, currentUserId }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {Object.values(collaborators).map((collab) => {
          if (collab.user_id === currentUserId || !collab.cursor) return null;

          return (
            <motion.div
              key={collab.user_id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                x: collab.cursor.x, 
                y: collab.cursor.y 
              }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
              className="absolute top-0 left-0"
              style={{ pointerEvents: 'none' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill={collab.color || '#000'}
                  stroke="white"
                />
              </svg>
              <div 
                className="ml-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: collab.color || '#000' }}
              >
                {collab.username || 'Collaborator'}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
