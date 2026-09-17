import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-full bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer gap-2" 
            onClick={() => navigate('/')}
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-foreground">
              StockFlow
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm">
            <button 
              onClick={() => navigate('/')}
              className={`transition-colors ${
                location.pathname === '/' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground">Screener</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground">Watchlist</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
