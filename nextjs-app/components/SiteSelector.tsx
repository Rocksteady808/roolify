'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Site {
  siteId: string;
  site: {
    id: string;
    displayName: string;
    shortName: string;
    lastPublished?: string;
  };
  hasToken: boolean;
}

interface SiteSelectorProps {
  onSiteChange?: (siteId: string) => void;
  className?: string;
}

export default function SiteSelector({ onSiteChange, className = '' }: SiteSelectorProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    // Get siteId from URL params
    const siteIdFromUrl = searchParams.get('siteId');
    if (siteIdFromUrl && sites.length > 0) {
      const siteExists = sites.some(site => site.siteId === siteIdFromUrl);
      if (siteExists) {
        setSelectedSiteId(siteIdFromUrl);
        onSiteChange?.(siteIdFromUrl);
      }
    } else if (sites.length > 0 && !selectedSiteId) {
      // Check localStorage first for previously selected site
      const storedSiteId = typeof window !== 'undefined' ? localStorage.getItem('selectedSiteId') : null;
      if (storedSiteId) {
        const siteExists = sites.some(site => site.siteId === storedSiteId);
        if (siteExists) {
          setSelectedSiteId(storedSiteId);
          onSiteChange?.(storedSiteId);
          return;
        }
      }
      
      // Only default to first site if no stored preference
      const firstSite = sites[0];
      setSelectedSiteId(firstSite.siteId);
      updateUrlWithSite(firstSite.siteId);
      onSiteChange?.(firstSite.siteId);
    }
  }, [sites, searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle window resize to reposition dropdown
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        // Close dropdown on resize to prevent positioning issues
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const loadSites = async () => {
    try {
      // Get auth token from localStorage and send in Authorization header
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : null;
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/webflow/sites', { headers });
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      } else {
        console.error('Failed to load sites');
        setSites([]);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrlWithSite = (siteId: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('siteId', siteId);
    
    // Store in localStorage for persistence across page navigation
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedSiteId', siteId);
    }
    
    router.replace(currentUrl.pathname + currentUrl.search);
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    updateUrlWithSite(siteId);
    onSiteChange?.(siteId);
    setIsOpen(false);
  };

  const getDropdownPosition = () => {
    if (!dropdownRef.current) return {};

    const rect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate dropdown dimensions (approximate)
    const dropdownWidth = Math.max(200, Math.min(rect.width, 320)); // Cap at 320px for mobile
    const dropdownHeight = Math.min(384, sites.length * 60 + 100); // max-h-96 = 384px, ~60px per item + padding
    
    let left = rect.left;
    let top = rect.bottom + 8; // mt-2 = 8px
    
    // Check if dropdown would overflow right edge
    if (left + dropdownWidth > viewportWidth - 16) { // 16px margin
      left = viewportWidth - dropdownWidth - 16;
    }
    
    // Check if dropdown would overflow left edge
    if (left < 16) {
      left = 16;
    }
    
    // Check if dropdown would overflow bottom edge
    if (top + dropdownHeight > viewportHeight - 16) {
      // Position above the button instead
      top = rect.top - dropdownHeight - 8;
      
      // If still doesn't fit above, position it at the top of viewport
      if (top < 16) {
        top = 16;
        // Make it scrollable if needed
        return {
          left: `${left}px`,
          top: `${top}px`,
          maxHeight: `${viewportHeight - 32}px`,
          overflowY: 'auto'
        };
      }
    }
    
    return {
      left: `${left}px`,
      top: `${top}px`
    };
  };

  const selectedSite = sites.find(site => site.siteId === selectedSiteId);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading sites...</span>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-600">No sites connected</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <div className={`w-8 h-8 rounded-full ${selectedSite?.hasToken ? 'bg-indigo-600' : 'bg-indigo-600'} flex items-center justify-center text-white font-bold text-xs`}>
          {selectedSite 
            ? (selectedSite.site.displayName?.[0] || selectedSite.site.shortName?.[0] || 'S').toUpperCase()
            : 'S'
          }
        </div>
        <span className="max-w-[150px] truncate">
          {selectedSite 
            ? (selectedSite.site.displayName || selectedSite.site.shortName || selectedSite.siteId)
            : 'Select site'
          }
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          ></div>
          <div 
            className="fixed mt-2 min-w-[200px] w-max rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999] max-h-96 overflow-y-auto"
            style={getDropdownPosition()}
          >
            <div className="py-1">
              {sites.map((site) => {
                const isSelected = site.siteId === selectedSiteId;
                return (
                  <button
                    key={site.siteId}
                    onClick={() => handleSiteChange(site.siteId)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isSelected 
                        ? 'text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${site.hasToken ? 'bg-indigo-600' : 'bg-indigo-600'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">
                          {site.site.displayName || site.site.shortName || site.siteId}
                        </div>
                        {site.site.lastPublished && (
                          <div className="text-xs text-gray-500 truncate">
                            Last published: {new Date(site.site.lastPublished).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
              
              {/* Add New Site Option */}
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  // Use the install route which properly uses environment variables
                  window.open('/api/auth/install', '_blank');
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Add New Site</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
