import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Fluxo Diário', path: '/fluxo-diario', icon: '💰' },
  { label: 'Fechamento', path: '/fechamento', icon: '🔒' },
  { label: 'Importações', path: '/importacoes', icon: '📥' },
  { label: 'Conciliação', path: '/conciliacao', icon: '🔄' },
  { label: 'Ajustes Manuais', path: '/ajustes', icon: '✏️' },
  { label: 'Relatórios', path: '/relatorios', icon: '📈' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>
            {sidebarOpen ? '💵 Fluxo Caixa' : '💵'}
          </h2>
          <button
            className={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {sidebarOpen && user && (
          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.nome}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className={styles.headerActions}>
            <button className={styles.logoutButton} onClick={logout}>
              Sair
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
