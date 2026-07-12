import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";

import { buildNotifications } from "../../lib/selectors";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../store/use-app-store";
import type { Role } from "../../types/domain";
import { Brand } from "../brand";
import { Badge, Button, IconButton } from "../ui";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { to: "/portal", label: "Overview", icon: LayoutDashboard, roles: ["school_head", "admin_officer", "teacher"] },
    ],
  },
  {
    label: "School Records",
    items: [
      { to: "/portal/learners", label: "Learners", icon: UsersRound, roles: ["school_head", "admin_officer", "teacher"] },
      { to: "/portal/attendance", label: "Attendance", icon: CalendarCheck2, roles: ["school_head", "admin_officer", "teacher"] },
      { to: "/portal/grades", label: "Class Records", icon: BookOpenCheck, roles: ["school_head", "teacher"] },
      { to: "/portal/promotion", label: "Promotion", icon: GraduationCap, roles: ["school_head", "admin_officer"] },
    ],
  },
  {
    label: "Outputs",
    items: [
      { to: "/portal/forms", label: "School Forms", icon: FileText, roles: ["school_head", "admin_officer", "teacher"] },
      { to: "/portal/analytics", label: "Analytics", icon: BarChart3, roles: ["school_head", "admin_officer", "teacher"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/portal/setup", label: "School Setup", icon: Settings, roles: ["school_head"] },
      { to: "/portal/activity", label: "Activity Log", icon: Activity, roles: ["school_head", "admin_officer"] },
    ],
  },
];

const routeTitles: Record<string, string> = {
  "/portal": "Overview",
  "/portal/learners": "Learner records",
  "/portal/attendance": "Attendance",
  "/portal/grades": "Class records",
  "/portal/promotion": "Promotion",
  "/portal/forms": "School forms",
  "/portal/analytics": "Analytics",
  "/portal/setup": "School setup",
  "/portal/activity": "Activity log",
};

const roleLabels: Record<Role, string> = {
  school_head: "School Head",
  admin_officer: "Administrative Officer",
  teacher: "Class Adviser",
};

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const school = useAppStore((state) => state.school);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const learners = useAppStore((state) => state.learners);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const logout = useAppStore((state) => state.logout);
  const switchUser = useAppStore((state) => state.switchUser);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const notifications = useMemo(
    () => buildNotifications(user, learners, subjects, gradeSheets, attendanceDays),
    [user, learners, subjects, gradeSheets, attendanceDays],
  );
  const title = location.pathname.startsWith("/portal/learners/")
    ? "Learner profile"
    : routeTitles[location.pathname] ?? "EduNexus";

  const sidebar = (
    <>
      <div className="sidebar__brand-row">
        <Brand compact={collapsed} inverse />
        <IconButton
          className="sidebar__mobile-close"
          label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={19} />
        </IconButton>
      </div>

      <div className={cn("sidebar__school", collapsed && "sidebar__school--compact")}>
        <span className="sidebar__school-icon"><ShieldCheck size={18} /></span>
        {!collapsed ? (
          <span>
            <strong>{school.name}</strong>
            <small>School ID {school.schoolId}</small>
          </span>
        ) : null}
      </div>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(user.role));
          if (!visibleItems.length) return null;
          return (
            <div className="nav-group" key={group.label}>
              {!collapsed ? <div className="nav-group__label">{group.label}</div> : null}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    className={({ isActive }) => cn("nav-link", isActive && "is-active")}
                    end={item.to === "/portal"}
                    key={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    to={item.to}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__collapse" type="button" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          {!collapsed ? <span>Collapse sidebar</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <div className={cn("app-shell", collapsed && "app-shell--collapsed")}>
      <aside className="sidebar">{sidebar}</aside>
      <div className={cn("mobile-sidebar", mobileOpen && "is-open")}>
        <button className="mobile-sidebar__backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
        <aside className="mobile-sidebar__panel">{sidebar}</aside>
      </div>

      <div className="app-shell__content">
        <header className="topbar">
          <div className="topbar__title-row">
            <IconButton className="topbar__menu" label="Open navigation" onClick={() => { setCollapsed(false); setMobileOpen(true); }}>
              <Menu size={20} />
            </IconButton>
            <div>
              <span>{school.activeSchoolYear}</span>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <div className="topbar-menu-wrap">
              <IconButton
                className="notification-button"
                label="Notifications"
                onClick={() => {
                  setNotificationOpen((value) => !value);
                  setUserMenuOpen(false);
                }}
              >
                <Bell size={19} />
                {notifications.length ? <span>{notifications.length}</span> : null}
              </IconButton>
              {notificationOpen ? (
                <div className="topbar-popover notification-popover">
                  <div className="popover-heading">
                    <strong>Notifications</strong>
                    <Badge tone={notifications.length ? "warning" : "success"}>{notifications.length}</Badge>
                  </div>
                  <div className="notification-list">
                    {notifications.length ? notifications.map((item) => (
                      <button
                        type="button"
                        className={`notification-item notification-item--${item.tone}`}
                        key={item.id}
                        onClick={() => {
                          navigate(item.href);
                          setNotificationOpen(false);
                        }}
                      >
                        <span />
                        <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                      </button>
                    )) : <div className="popover-empty"><ClipboardCheck size={22} /><span>No pending notices</span></div>}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="topbar-menu-wrap">
              <button
                type="button"
                className="user-trigger"
                onClick={() => {
                  setUserMenuOpen((value) => !value);
                  setNotificationOpen(false);
                }}
              >
                <span className="user-trigger__avatar">{user.initials}</span>
                <span className="user-trigger__copy">
                  <strong>{user.fullName}</strong>
                  <small>{roleLabels[user.role]}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {userMenuOpen ? (
                <div className="topbar-popover user-popover">
                  <div className="user-popover__identity">
                    <span>{user.initials}</span>
                    <div><strong>{user.fullName}</strong><small>{user.email}</small></div>
                  </div>
                  <div className="popover-section-label">Presentation role</div>
                  {users.map((candidate) => (
                    <button
                      className={cn("account-option", candidate.id === user.id && "is-active")}
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        switchUser(candidate.id);
                        setUserMenuOpen(false);
                        navigate("/portal");
                      }}
                    >
                      <UserRoundCog size={17} />
                      <span><strong>{roleLabels[candidate.role]}</strong><small>{candidate.fullName}</small></span>
                    </button>
                  ))}
                  <div className="popover-divider" />
                  <Button
                    className="user-popover__logout"
                    variant="quiet"
                    onClick={() => navigate("/")}
                  >
                    <Globe2 size={17} /> School website
                  </Button>
                  <Button
                    className="user-popover__logout"
                    variant="quiet"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogOut size={17} /> Logout
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
