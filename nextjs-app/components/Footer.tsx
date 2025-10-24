'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto lg:ml-80">
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Roolify</h3>
            <p className="text-sm text-gray-600 break-words">
              Advanced form logic and notifications for Webflow
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/rule-builder" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Rule Builder
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Notifications
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/setup" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Setup Guide
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:info@roolify.com" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-sm text-gray-600 text-center sm:text-left">
              © {currentYear} Roolify. All rights reserved.
            </p>
            <div className="flex items-center gap-3 sm:gap-6">
              <a 
                href="mailto:info@roolify.com" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors break-all sm:break-normal"
              >
                info@roolify.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}




