import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SimpleHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-teal-900/80 backdrop-blur-lg border-b border-teal-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {/* New Logo Container using the logo.png image */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-medium border-2 border-teal-400 bg-white">
              <img src="/logo.png" alt="CuraNet Logo" className="w-full h-full object-cover" />
            </div>
            
            {/* Updated Branding with Lobster Font */}
            <div className="flex flex-col sm:flex-row sm:items-baseline">
              <span 
                className="font-bold text-xl italic" 
                style={{ fontFamily: "'Lobster', cursive" }}
              >
                <span style={{ color: '#40E0D0' }}>Cura</span>
                <span className="text-white">Net</span>
              </span>
              <span className="hidden sm:inline-block text-xs text-teal-300 ml-2 font-medium">
                Healthcare Network
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-teal-200">
                  Welcome, {user?.name}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-600" 
                  onClick={() => {
                    logout();
                    toast.success('Logged out successfully', {
                      description: 'You have been safely logged out of your CuraNet account'
                    });
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-teal-200 hover:text-white hover:bg-teal-800"
                    onClick={() => toast.info('Accessing CuraNet Portal...', {
                      description: 'Please sign in to access your healthcare dashboard'
                    })}
                  >
                    Medical Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white border-teal-500"
                    onClick={() => toast.success('Starting CuraNet Journey...', {
                      description: 'Create your CuraNet healthcare account'
                    })}
                  >
                    Get Medical Access
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};