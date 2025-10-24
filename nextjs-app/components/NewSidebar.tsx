"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Home,
  Settings,
  Bell,
  FileText,
  Wrench,
  HelpCircle,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
  icon: React.ComponentType<{ className?: string }>;
};

export default function NewSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect if running in iframe (Designer Extension)
    const checkIframe = () => {
      if (typeof window !== 'undefined') {
        setIsInIframe(window.self !== window.top);
      }
    };
    checkIframe();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const items: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      isActive: (p) => p === "/dashboard",
      icon: Home,
    },
    {
      href: "/rule-builder",
      label: "Rule Builder",
      isActive: (p) => p.startsWith("/rule-builder") || p.startsWith("/rules"),
      icon: Settings,
    },
    {
      href: "/notifications",
      label: "Notification",
      isActive: (p) => p.startsWith("/notifications"),
      icon: Bell,
    },
    {
      href: "/submissions",
      label: "Form Submissions",
      isActive: (p) => p.startsWith("/submissions"),
      icon: FileText,
    },
    {
      href: "/setup",
      label: "Setup",
      isActive: (p) => p.startsWith("/setup"),
      icon: Wrench,
    },
  ];

  return (
    <>
      {/* Mobile Header - Visible on mobile/tablet including in iframe */}
      <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-[1000] flex items-center px-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[998]"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-out */}
      <aside 
        className={`
          col-span-1 lg:col-span-3
          lg:relative fixed top-0 left-0 h-full
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:z-auto z-[999]
          bg-gray-50 lg:bg-transparent
          w-64 lg:w-auto
        `}
        style={{ overflowY: 'auto', overflowX: 'visible' }}
      >
        <div className="pt-4 xl:pt-0 p-4 xl:p-0" style={{ overflow: 'visible' }}>

          <div className="mb-6 mt-16 xl:mt-0" style={{ overflow: 'visible' }}>
            <UserMenu />
          </div>

          <nav className="bg-white border rounded p-3 space-y-1">
            {items.map((item) => {
              const active = item.isActive(pathname || "");
              const base = "flex items-center gap-3 px-3 py-2 rounded text-gray-800 hover:bg-gray-50 transition-colors";
              const activeCls = active ? " bg-gray-100 font-medium" : "";
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={base + activeCls}
                  onClick={closeMobileMenu}
                >
                  <IconComponent className="w-5 h-5 text-gray-700" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 bg-white border rounded p-3 text-sm text-gray-800">
            <div className="font-semibold mb-2">Support</div>
            <div className="text-xs">Need help? Visit docs or contact support.</div>
          </div>
        </div>
      </aside>
    </>
  );
}
