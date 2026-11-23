import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Scan, 
  BarChart3, 
  History, 
  BookOpen, 
  FileText, 
  Settings
} from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.checkHealth();
        setIsBackendHealthy(true);
      } catch {
        setIsBackendHealthy(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Scanner', path: '/scanner', icon: Scan },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Scan History', path: '/history', icon: History },
    { name: 'Recommendations', path: '/recommendations', icon: BookOpen },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f10]/95 backdrop-blur border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Shield className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-tight text-[#ededed]">
                Privacy Risk Checker
              </span>
              <span className="text-[10px] text-[#71717a] font-mono tracking-wide">
                Audit Workstation
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#222225] text-[#ededed] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'text-[#a1a1a6] hover:text-[#ededed] hover:bg-[#18181b]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[1.5] ${isActive ? 'text-[#ededed]' : 'text-[#71717a]'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Telemetry Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18181b] border border-white/[0.08] text-[11px] font-mono text-[#a1a1a6]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendHealthy === true
                    ? 'bg-emerald-400'
                    : isBackendHealthy === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span>{isBackendHealthy ? 'Engine ready' : isBackendHealthy === false ? 'Engine offline' : 'Connecting'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
