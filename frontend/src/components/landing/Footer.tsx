import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-12 bg-teal-950 text-teal-100 border-t border-teal-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border-2 border-teal-400 bg-white">
                <img src="/logo.png" alt="CuraNet Logo" className="w-full h-full object-cover" />
              </div>
              <span 
                className="font-bold text-xl italic" 
                style={{ fontFamily: "'Lobster', cursive" }}
              >
                <span style={{ color: '#40E0D0' }}>Cura</span>
                <span className="text-white">Net</span>
              </span>
            </Link>
            <p className="text-teal-300/60 max-w-sm">
              Advanced healthcare network platform for intelligent hospital operations and data-driven management.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-teal-300/60 hover:text-teal-100 transition-colors">Dashboard</Link></li>
              <li><Link to="/login" className="text-teal-300/60 hover:text-teal-100 transition-colors">OPD Queue</Link></li>
              <li><Link to="/login" className="text-teal-300/60 hover:text-teal-100 transition-colors">Bed Status</Link></li>
              <li><Link to="/login" className="text-teal-300/60 hover:text-teal-100 transition-colors">Blood Bank</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/hospital-registration" className="text-teal-300/60 hover:text-teal-100 transition-colors">Hospital Registration</Link></li>
              <li><a href="#" className="text-teal-300/60 hover:text-teal-100 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-teal-300/60 hover:text-teal-100 transition-colors">API Reference</a></li>
              <li><a href="#" className="text-teal-300/60 hover:text-teal-100 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-teal-800 text-center text-sm text-teal-500">
          <p>© 2026 CuraNet. Built for a Healthier Future.</p>
        </div>
      </div>
    </footer>
  );
};