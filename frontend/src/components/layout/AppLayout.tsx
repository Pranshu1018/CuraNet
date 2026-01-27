import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { ReactNode } from "react";
import { UserDropdown } from "./UserDropdown";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps = {}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top Header Bar */}
          <header className="h-16 border-b border-border bg-background/80 backdrop-blur-lg flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-muted p-2 rounded-lg" />
              <div className="hidden md:block">
                <span className="text-sm text-muted-foreground">
                  Hospital Operations Platform
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <UserDropdown />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
