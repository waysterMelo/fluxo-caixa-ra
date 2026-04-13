import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  CheckCircle2,
  ArrowDownUp,
  Upload,
  Settings2,
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Bell,
  ChevronRight,
} from 'lucide-react';
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

const menuItems: MenuItem[] = [
  { label: 'Painel Financeiro', path: '/', icon: <LayoutDashboard size={18} strokeWidth={1.75} />, section: 'PRINCIPAL' },
  { label: 'Fluxo Diário', path: '/fluxo-diario', icon: <CalendarDays size={18} strokeWidth={1.75} />, section: 'PRINCIPAL' },
  { label: 'Fechamento', path: '/fechamento', icon: <CheckCircle2 size={18} strokeWidth={1.75} />, section: 'PRINCIPAL' },
  { label: 'Conciliação', path: '/conciliacao', icon: <ArrowDownUp size={18} strokeWidth={1.75} />, section: 'OPERAÇÕES' },
  { label: 'Importações', path: '/importacoes', icon: <Upload size={18} strokeWidth={1.75} />, section: 'OPERAÇÕES' },
  { label: 'Ajustes Manuais', path: '/ajustes', icon: <Settings2 size={18} strokeWidth={1.75} />, section: 'OPERAÇÕES' },
  { label: 'Relatórios', path: '/relatorios', icon: <BarChart3 size={18} strokeWidth={1.75} />, section: 'CONSULTAS' },
  { label: 'Empresas', path: '/empresas', icon: <Building2 size={18} strokeWidth={1.75} />, section: 'ADMIN' },
];

// Breadcrumbs mapeados por rota
const routeBreadcrumbs: Record<string, string[]> = {
  '/': ['Principal', 'Painel Financeiro'],
  '/fluxo-diario': ['Principal', 'Fluxo Diário'],
  '/fechamento': ['Principal', 'Fechamento'],
  '/conciliacao': ['Operações', 'Conciliação'],
  '/importacoes': ['Operações', 'Importações'],
  '/ajustes': ['Operações', 'Ajustes Manuais'],
  '/relatorios': ['Consultas', 'Relatórios'],
  '/empresas': ['Admin', 'Empresas'],
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Iniciais do nome do usuário
  const initials = user?.nome
    ? user.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Data formatada elegante
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Breadcrumbs
  const breadcrumbs = routeBreadcrumbs[currentPath] || ['Página'];

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
            {sidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
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
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      <div className={`${styles.main} ${!sidebarOpen ? styles.mainExpanded : ''}`}>
        {/* Topbar — Glass effect com breadcrumbs */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumbs}>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className={styles.breadcrumbItem}>
                  {index > 0 && <ChevronRight size={12} className={styles.breadcrumbSeparator} />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className={styles.breadcrumbCurrent}>{crumb}</span>
                  ) : (
                    <span className={styles.breadcrumbLink}>{crumb}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          
          <div className={styles.headerRight}>
            <span className={styles.headerDate}>{formattedDate}</span>
            <button className={styles.iconButton} aria-label="Notificações">
              <Bell size={18} strokeWidth={1.75} />
            </button>
            <div className={styles.avatarMenu}>
              <div className={styles.avatarSmall}>{initials}</div>
            </div>
            <button className={styles.headerLogout} onClick={logout}>
              <LogOut size={14} strokeWidth={1.75} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
