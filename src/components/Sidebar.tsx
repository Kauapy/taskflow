import styled from 'styled-components';
import {
  LayoutDashboard, CheckSquare, Inbox, BarChart3,
  ChevronsLeft, ChevronsRight, CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ViewId = 'home' | 'tasks' | 'shared' | 'analytics' | 'missions';

interface NavItem {
  id: ViewId;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { id: 'home',      label: 'Painel',           Icon: LayoutDashboard },
  { id: 'tasks',     label: 'Tarefas',          Icon: CheckSquare },
  { id: 'shared',    label: 'Compartilhadas',   Icon: Inbox },
  { id: 'analytics', label: 'Análises',         Icon: BarChart3 },
];

interface SidebarProps {
  active: ViewId;
  onChange: (view: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({ active, onChange, collapsed, onToggleCollapse }: SidebarProps) => {
  return (
    <Aside collapsed={collapsed} aria-label="Navegação principal">
      <Brand collapsed={collapsed}>
        <BrandIcon>
          <CheckCircle size={20} aria-hidden="true" />
        </BrandIcon>
        {!collapsed && <BrandName>Taskflow</BrandName>}
      </Brand>

      <Nav>
        {ITEMS.map(({ id, label, Icon }) => (
          <NavItem
            key={id}
            type="button"
            active={active === id}
            collapsed={collapsed}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            aria-label={label}
            aria-current={active === id ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </NavItem>
        ))}
      </Nav>

      <CollapseBtn
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        title={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed
          ? <ChevronsRight size={16} aria-hidden="true" />
          : <><ChevronsLeft size={16} aria-hidden="true" /><span>Recolher</span></>}
      </CollapseBtn>
    </Aside>
  );
};

// ──────────────────────────────────────────────────────── styled

const Aside = styled.aside<{ collapsed: boolean }>`
  position: sticky;
  top: 0;
  height: 100vh;
  width: ${p => (p.collapsed ? '64px' : '220px')};
  background: ${p => p.theme.colors.surface};
  border-right: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  z-index: 50;
  flex-shrink: 0;

  @media (max-width: 720px) {
    width: 64px;
  }
`;

const Brand = styled.div<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${p => (p.collapsed ? '20px 12px' : '20px 18px')};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  justify-content: ${p => (p.collapsed ? 'center' : 'flex-start')};
`;

const BrandIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${p => p.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BrandName = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  letter-spacing: -0.2px;
  white-space: nowrap;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  flex: 1;
`;

const NavItem = styled.button<{ active: boolean; collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${p => (p.collapsed ? '10px' : '10px 12px')};
  border-radius: 8px;
  background: ${p => (p.active ? p.theme.colors.primary + '18' : 'transparent')};
  color: ${p => (p.active ? p.theme.colors.primary : p.theme.colors.textSecondary)};
  border: none;
  font-size: 14px;
  font-weight: ${p => (p.active ? 600 : 500)};
  cursor: pointer;
  justify-content: ${p => (p.collapsed ? 'center' : 'flex-start')};
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.surfaceHover};
    color: ${p => p.theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 1px;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const CollapseBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: none;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  justify-content: center;

  &:hover { color: ${p => p.theme.colors.text}; }

  @media (max-width: 720px) {
    span { display: none; }
  }
`;

export default Sidebar;
