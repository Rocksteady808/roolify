"use client";
import ShadcnSidebar from "@/components/ShadcnSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TestSidebarPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <ShadcnSidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Test Sidebar Page</h1>
          <p className="text-gray-600">
            This page demonstrates the new shadcn sidebar component.
            The sidebar should be collapsible on desktop and slide out on mobile.
          </p>
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-gray-100 rounded">
              <h2 className="font-semibold">Features to test:</h2>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Desktop: Collapsible sidebar with icon mode</li>
                <li>Mobile: Slide-out sidebar with backdrop</li>
                <li>Navigation: All existing links should work</li>
                <li>User menu: Should be preserved</li>
                <li>Support section: Should be visible</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
