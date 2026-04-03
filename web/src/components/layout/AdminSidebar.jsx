import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Settings, LayoutGrid, User } from 'lucide-react';

export default function AdminSidebar() {
  const logout = useAuthStore(state => state.logout);
  const admin = useAuthStore(state => state.admin);
  const location = useLocation();

  const initials = (admin?.username || admin?.email || 'A')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navItems = [
    { label: 'Workspace', path: '/admin', icon: <LayoutGrid size={16} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={16} /> },
  ];

  return (
    <aside className="w-64 border-r border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] flex flex-col flex-shrink-0 transition-all duration-150 ease-out z-20 min-h-screen relative">
      <div className="h-16 flex items-center px-8 border-b border-[var(--color-border-warm)]">
        <span className="display-font text-lg font-medium text-[var(--color-text-primary)]">Zealflow</span>
      </div>
      
      <nav className="flex-1 py-8 flex flex-col gap-2">
         {navItems.map(item => {
           const isActive = location.pathname === item.path;
           return (
             <Link 
               key={item.path} 
               to={item.path}
               className={`flex items-center gap-3 text-[13px] font-medium py-2 px-6 transition-colors ${
                 isActive 
                   ? 'text-[var(--color-text-primary)] bg-[var(--color-bg-hover)] border-l-2 border-[var(--color-accent)]'
                   : 'text-[var(--color-text-secondary)] border-l-2 border-transparent hover:text-[var(--color-text-primary)]'
               }`}
             >
               {item.icon}
               <span>{item.label}</span>
             </Link>
           );
         })}
      </nav>

      <div className="p-4 border-t border-[var(--color-border-warm)] flex flex-col gap-2">
        <Link 
          to="/profile" 
          className="flex items-center gap-3 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-3 rounded-[8px] transition-colors hover:bg-[var(--color-bg-hover)] group"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center font-serif text-[14px] group-hover:bg-[#FFFFFF]">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-[var(--color-text-primary)] font-medium">{admin?.username || 'Admin'}</span>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">Admin</span>
          </div>
        </Link>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-3 rounded-[8px] transition-colors w-full text-left"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
