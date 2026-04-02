import { Link } from 'react-router-dom';
import { Home, Compass, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        {/* Decorative background elements */}
        <div className="absolute -inset-10 bg-primary-500/20 blur-3xl rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full opacity-30"></div>
        
        {/* Main 404 Text */}
        <h1 className="text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-primary-400 via-purple-500 to-pink-500 drop-shadow-2xl select-none">
          404
        </h1>
        
        {/* Floating Icon */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex items-center justify-center rotate-12 animate-bounce transition-transform hover:rotate-0">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>

      <div className="max-w-md space-y-6 relative z-10">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Oops! Page Lost in Space
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
          The page you're looking for doesn't exist or has been moved to another dimension. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            to="/" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary-500/30 hover:scale-105 active:scale-95 group"
          >
            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            Back to Home
          </Link>
          <Link 
            to="/" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Compass className="w-5 h-5" />
            Explore Gallery
          </Link>
        </div>
      </div>

      {/* Decorative dots grid */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
