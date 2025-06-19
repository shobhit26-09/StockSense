import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const [rotating, setRotating] = useState(false);

  const handleThemeToggle = () => {
    setRotating(true);
    toggleTheme();
    setTimeout(() => setRotating(false), 500); // Remove rotation class after animation
  };

  const handleSignIn = () => {
    alert('Sign in functionality coming soon!');
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full backdrop-blur-xl transition-all duration-300 ${
        isDark ? 'bg-black/30 border-b border-white/10' : 'bg-white/30 border-b border-gray-200'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span
              className={`text-2xl font-medium tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              style={{ fontFamily: 'SF Pro Display, sans-serif' }}
            >
              StockSense
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className={`rounded-full p-2 transition-transform ${
                isDark
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-black hover:bg-black/10'
              } ${rotating ? 'animate-spin-slow' : ''}`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className={`rounded-full px-4 py-2 text-sm font-normal transition ${
                isDark
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-black hover:bg-black/10'
              }`}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
