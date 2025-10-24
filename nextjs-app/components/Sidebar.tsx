"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import { useAuth } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
};

export default function Sidebar() {
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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
        </svg>
      ),
    },
    {
      href: "/rule-builder",
      label: "Rule Builder",
      isActive: (p) => p.startsWith("/rule-builder") || p.startsWith("/rules"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.4 15.6a8 8 0 10-16.8 0A8 8 0 0020.4 15.6z" />
        </svg>
      ),
    },
    {
      href: "/notifications",
      label: "Notification",
      isActive: (p) => p.startsWith("/notifications"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      href: "/submissions",
      label: "Form Submissions",
      isActive: (p) => p.startsWith("/submissions"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
        </svg>
      ),
    },
    {
      href: "/setup",
      label: "Setup",
      isActive: (p) => p.startsWith("/setup"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
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
          lg:relative fixed top-0 left-0 h-screen
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:z-auto z-[999]
          bg-gray-50 lg:bg-transparent
          w-80 lg:w-auto
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={base + activeCls}
                  onClick={closeMobileMenu}
                >
                  {item.icon}
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
