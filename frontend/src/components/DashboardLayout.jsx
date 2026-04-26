import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Briefcase, FileText, User, CreditCard,
  PlusCircle, Users, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { PivotHireLogoInline } from './Logo';

export default function DashboardLayout() {
  const { user, isFounder, isCompany, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const founderLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',       end: true },
    { to: '/jobs',         icon: Briefcase,       label: 'Browse Jobs' },
    { to: '/applications', icon: FileText,        label: 'My Applications' },
    { to: '/profile',      icon: User,            label: 'My Profile' },
    { to: '/subscription', icon: CreditCard,      label: 'Subscription' },
  ];

  const companyLinks = [
    { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',      end: true },
    { to: '/my-jobs',         icon: Briefcase,       label: 'Job Postings' },
    { to: '/post-job',        icon: PlusCircle,      label: 'Post a Job' },
    { to: '/candidates',      icon: Users,           label: 'Candidates' },
    { to: '/company-profile', icon: User,            label: 'Company Profile' },
  ];

  const links = isCompany ? companyLinks : founderLinks;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <PivotHireLogoInline size={14} />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-widest mt-2 ml-0.5"
          style={{ color: 'rgba(248,245,240,0.4)' }}>
          {isCompany ? 'Employer' : 'Founder'}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/8 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-500/15 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/6'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx(
                    'shrink-0 transition-colors',
                    isActive ? 'text-brand-400' : 'text-slate-500'
                  )}
                />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="mx-5 h-px bg-white/8 mb-3" />
      <div className="px-3 pb-5 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #1C3C0A, #FF6600)', color: '#fff' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-none">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2 py-2 w-full text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 fixed inset-y-0 left-0 z-30"
        style={{ background: '#0A0F08' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-float animate-slide-up"
            style={{ background: '#0A0F08' }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-60 min-w-0">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <PivotHireLogoInline size={12} dark />
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
