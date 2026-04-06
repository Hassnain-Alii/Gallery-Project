import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGallery } from '../context/GalleryContext';
import { Search, Heart, Upload, Compass, LogOut, Sun, Moon, User as UserIcon, Loader2 } from 'lucide-react';
import AccountModal from './AccountModal';

export default function Navbar() {
  const { user, logout, searchQuery, setSearchQuery, theme, toggleTheme, isGlobalLoading } = useGallery();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'text-primary-500 font-bold' : 'text-gray-600 dark:text-gray-300';

  return (
    <>
      <nav className="glass sticky top-0 z-50 px-8 py-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary-500/30 group">
             <img src="/logo.png" alt="GalleryPro Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            GALLERY<span className="text-primary-500">PRO.</span>
          </span>
        </Link>
        
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            {isGlobalLoading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            <input 
              type="text" 
              placeholder="Search by author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-all cursor-pointer border border-gray-200 dark:border-gray-700 shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link to="/" className={`flex items-center gap-2 hover:text-primary-500 transition-colors ${isActive('/')}`}>
            <Compass className="w-5 h-5" /> <span className="hidden sm:block">Explore</span>
          </Link>
          <Link to="/favorites" className={`flex items-center gap-2 hover:text-primary-500 transition-colors ${isActive('/favorites')}`}>
            <Heart className="w-5 h-5" /> <span className="hidden sm:block">Favorites</span>
          </Link>
          <Link to="/upload" className={`flex items-center gap-2 hover:text-primary-500 transition-colors ${isActive('/upload')}`}>
            <Upload className="w-5 h-5" /> <span className="hidden sm:block">Upload</span>
          </Link>
          <Link to="/my-uploads" className={`flex items-center gap-2 hover:text-primary-500 transition-colors ${isActive('/my-uploads')}`}>
            <Compass className="w-5 h-5" /> <span className="hidden sm:block">My Gallery</span>
          </Link>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2"></div>

          {user ? (
            <div className="flex items-center gap-4 relative group">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg cursor-pointer shadow-md overflow-hidden">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Dropdown Profile Menu */}
              <div className="absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all glass border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setIsAccountModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    <UserIcon size={16} /> Manage Account
                  </button>
                  <Link to="/favorites" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Heart size={16} /> Favorites
                  </Link>
                  <Link to="/my-uploads" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Compass size={16} /> My Uploads
                  </Link>
                  <div className="h-px bg-gray-100 dark:border-gray-700 my-1"></div>
                  <button 
                    onClick={logout} 
                    className="w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
               <Link to="/login" className="px-4 py-2 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Login</Link>
               <Link to="/signup" className="px-4 py-2 rounded-md font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">Signup</Link>
            </div>
          )}
        </div>
      </nav>

      {user && (
        <AccountModal 
          isOpen={isAccountModalOpen} 
          onClose={() => setIsAccountModalOpen(false)} 
        />
      )}
    </>
  );
}
