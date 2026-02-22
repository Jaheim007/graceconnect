import { Outlet, NavLink } from 'react-router-dom';
import { Shield, Users, FileCheck, BarChart3, Megaphone, Sparkles, LayoutDashboard, Activity, Settings, Download, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/superadmin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/superadmin/orgs', label: 'Organizations', icon: Users },
  { to: '/superadmin/users', label: 'Users', icon: UserCircle },
  { to: '/superadmin/activity', label: 'Activity', icon: Activity },
  { to: '/superadmin/kyc', label: 'KYC Review', icon: FileCheck },
  { to: '/superadmin/transactions', label: 'Transactions', icon: BarChart3 },
  { to: '/superadmin/reports', label: 'Reports', icon: Megaphone },
  { to: '/superadmin/metrics', label: 'Metrics', icon: BarChart3 },
  { to: '/superadmin/exports', label: 'Exports', icon: Download },
  { to: '/superadmin/settings', label: 'Settings', icon: Settings },
  { to: '/superadmin/ai', label: 'AI Insights', icon: Sparkles },
];

export default function SuperadminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Shield className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-primary shrink-0 mr-2">Superadmin</span>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn('shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            <Icon className="h-3.5 w-3.5" />{label}
          </NavLink>
        ))}
      </div>
      <main className="container max-w-6xl py-6"><Outlet /></main>
    </div>
  );
}
