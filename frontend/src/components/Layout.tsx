import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  section?: string;
}

// Ícones SVG — 18px, stroke-width 1.75, clean
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Fluxo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Fechamento: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  Conciliacao: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  Importacoes: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Ajustes: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Relatorios: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Empresas: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const menuItems: MenuItem[] = [
  { label: 'Painel Financeiro', path: '/', icon: <Icons.Dashboard />, section: 'PRINCIPAL' },
  { label: 'Fluxo Diário', path: '/fluxo-diario', icon: <Icons.Fluxo />, section: 'PRINCIPAL' },
  { label: 'Fechamento', path: '/fechamento', icon: <Icons.Fechamento />, section: 'PRINCIPAL' },
  { label: 'Conciliação', path: '/conciliacao', icon: <Icons.Conciliacao />, section: 'OPERAÇÕES' },
  { label: 'Importações', path: '/importacoes', icon: <Icons.Importacoes />, section: 'OPERAÇÕES' },
  { label: 'Ajustes Manuais', path: '/ajustes', icon: <Icons.Ajustes />, section: 'OPERAÇÕES' },
  { label: 'Relatórios', path: '/relatorios', icon: <Icons.Relatorios />, section: 'CONSULTAS' },
  { label: 'Empresas', path: '/empresas', icon: <Icons.Empresas />, section: 'ADMIN' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Iniciais do nome do usuário
  const initials = user?.nome
    ? user.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <div className={styles.logoMark}>RA</div>
            {sidebarOpen && (
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>Fluxo de Caixa</span>
                <span className={styles.logoSubtitle}>Bela-Tec</span>
              </div>
            )}
          </div>
          <button
            className={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuItems.map((item, index) => {
            const showSection = item.section && (
              index === 0 || menuItems[index - 1].section !== item.section
            );

            return (
              <div key={item.path}>
                {showSection && sidebarOpen && (
                  <div className={styles.navSectionLabel}>{item.section}</div>
                )}
                <Link
                  to={item.path}
                  className={`${styles.navItem} ${currentPath === item.path ? styles.navItemActive : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initials}</div>
            {sidebarOpen && (
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user?.nome}</div>
                <div className={styles.userRole}>{user?.is_admin ? 'Administrador' : 'Operador'}</div>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Sair do sistema">
            <Icons.Logout />
          </button>
        </div>
      </aside>

      <div className={`${styles.main} ${!sidebarOpen ? styles.mainExpanded : ''}`}>
        {/* Topbar */}
        <header className={styles.header}>
          <span className={styles.headerDate}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button className={styles.headerLogout} onClick={logout}>
            <Icons.Logout />
            <span>Sair</span>
          </button>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
