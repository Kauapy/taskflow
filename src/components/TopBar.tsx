import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Sun, Moon, Type, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface TopBarProps {
  title: string;
  subtitle?: string;
  userEmail: string;
  onQuickAdd: () => void;
  onSignOut: () => void;
}

const TopBar = ({ title, subtitle, userEmail, onQuickAdd, onSignOut }: TopBarProps) => {
  const { toggleTheme, isDark, a11yZoom, toggleA11yZoom } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initial = (userEmail[0] ?? 'U').toUpperCase();

  return (
    <Bar>
      <Titles>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </Titles>

      <Actions>
        <PrimaryBtn type="button" onClick={onQuickAdd} aria-label="Criar nova tarefa">
          <Plus size={16} aria-hidden="true" />
          <span>Nova tarefa</span>
        </PrimaryBtn>

        <IconBtn
          type="button"
          onClick={toggleA11yZoom}
          aria-label={`Tamanho da fonte (atual: ${a11yZoom === 1 ? 'normal' : a11yZoom === 1.1 ? 'médio' : 'grande'})`}
          title="Tamanho da fonte"
        >
          <Type size={18} aria-hidden="true" />
          {a11yZoom > 1 && <ZoomBadge>{a11yZoom === 1.1 ? '+' : '++'}</ZoomBadge>}
        </IconBtn>

        <IconBtn
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title="Alternar tema"
        >
          {isDark
            ? <Sun size={18} aria-hidden="true" />
            : <Moon size={18} aria-hidden="true" />}
        </IconBtn>

        <UserMenu ref={menuRef}>
          <Avatar
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Conta do usuário"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {initial}
          </Avatar>
          {menuOpen && (
            <Menu role="menu">
              <MenuEmail title={userEmail}>{userEmail}</MenuEmail>
              <MenuItem
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onSignOut(); }}
              >
                <LogOut size={14} aria-hidden="true" />
                Sair
              </MenuItem>
            </Menu>
          )}
        </UserMenu>
      </Actions>
    </Bar>
  );
};

// ──────────────────────────────────────────────────────── styled

const Bar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.background};
  flex-wrap: wrap;

  @media (max-width: 720px) {
    padding: 14px 16px;
  }
`;

const Titles = styled.div`
  min-width: 0;
  flex: 1;

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  p {
    font-size: 13px;
    color: ${p => p.theme.colors.textSecondary};
    margin-top: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: none;
  border-radius: 8px;
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: ${p => p.theme.colors.primaryDark};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    span { display: none; }
    padding: 9px 11px;
  }
`;

const IconBtn = styled.button`
  position: relative;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: ${p => p.theme.colors.primary};
    border-color: ${p => p.theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 1px;
  }
`;

const ZoomBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${p => p.theme.colors.success};
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 8px;
  line-height: 1.2;
`;

const UserMenu = styled.div`
  position: relative;
`;

const Avatar = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(
    135deg,
    ${p => p.theme.colors.primary} 0%,
    ${p => p.theme.colors.primaryDark} 100%
  );
  color: white;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;

  &:hover { transform: scale(1.05); }
  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 2px;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 10px;
  box-shadow: 0 8px 20px ${p => p.theme.colors.shadowMedium};
  z-index: 100;
  overflow: hidden;
`;

const MenuEmail = styled.div`
  padding: 10px 14px;
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: ${p => p.theme.colors.text};
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.surfaceHover};
  }
`;

export default TopBar;
