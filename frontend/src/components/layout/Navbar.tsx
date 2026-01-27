import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/types/auth";
import { toast } from "sonner";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/opd-queue", label: "OPD Queue" },
  { href: "/beds", label: "Bed Status" },
  { href: "/blood-bank", label: "Blood Bank" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-medium">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">MedSync</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({user?.role ? ROLE_LABELS[user.role] : ''})
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  logout();
                  toast.success('Logged out successfully', {
                    description: 'You have been safely logged out of your account'
                  });
                }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toast.info('Navigating to login...', {
                      description: 'Please sign in to access your account'
                    })}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    variant="hero" 
                    size="sm"
                    onClick={() => toast.success('Getting started...', {
                      description: 'Create your City Health Sync account'
                    })}
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="border-t border-border mt-4 pt-4">
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{user?.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      {user?.role ? ROLE_LABELS[user.role] : ''}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mx-4" onClick={() => {
                  logout();
                  toast.success('Logged out successfully', {
                    description: 'You have been safely logged out of your account'
                  });
                }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 px-4">
                  <Link to="/login" className="flex-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => toast.info('Navigating to login...', {
                        description: 'Please sign in to access your account'
                      })}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full"
                      onClick={() => toast.success('Getting started...', {
                        description: 'Create your City Health Sync account'
                      })}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
