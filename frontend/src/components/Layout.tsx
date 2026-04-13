import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBrowserTimezone } from '../utils/date';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Painel Financeiro', path: '/', icon: 'P0', section: 'PRINCIPAL' },
  { label: 'Fluxo Diário', path: '/fluxo-diario', icon: 'FD', section: 'PRINCIPAL' },
  { label: 'Fechamento', path: '/fechamento', icon: 'FC', section: 'PRINCIPAL' },
  { label: 'Conciliação', path: '/conciliacao', icon: 'CC', section: 'OPERAÇÕES' },
  { label: 'Importações', path: '/importacoes', icon: 'IM', section: 'OPERAÇÕES' },
  { label: 'Ajustes Manuais', path: '/ajustes', icon: 'AM', section: 'OPERAÇÕES' },
  { label: 'Relatórios', path: '/relatorios', icon: 'RL', section: 'CONSULTAS' },
  { label: 'Empresas', path: '/empresas', icon: 'PJ', section: 'ADMIN' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const currentPath = location.pathname;
  const currentItem = menuItems.find(item => item.path === currentPath);

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <h2 className={styles.logo}>MISSION FINANCE</h2>
            <span className={styles.logoSubtitle}>Console de Controle v1.0</span>
          </div>
          <button
            className={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className={styles.statusBar}>
          <span className={styles.statusDot}></span>
          <span>SISTEMA OPERACIONAL</span>
        </div>

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
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {sidebarOpen && user && (
          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.nome}</div>
              <div className={styles.userEmail}>{user.email}</div>
              <div className={styles.userRole}>{user.is_admin ? 'ADMINISTRADOR' : 'OPERADOR'}</div>
            </div>
          </div>
        )}
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.headerTitle}>
              {currentItem?.label || 'Painel Financeiro'}
            </h1>
            <span className={styles.headerContext}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.headerInfo}>
              <span>TZ: {getBrowserTimezone()}</span>
            </div>
            <button className={styles.logoutButton} onClick={logout}>
              Sair
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
