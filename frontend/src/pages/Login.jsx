import { useState } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Compass } from 'lucide-react';

export default function Login() {
  const { login, apiBaseURL } = useGallery();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      
      login(data.user, data.token, data.refreshToken);
      toast.success('Welcome Back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${apiBaseURL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      login(data.user, data.token, data.refreshToken);
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {/* Background blobs for "Stunning" effect */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative w-full max-w-lg">
        <div className="glass-effect rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-700">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-linear-to-br from-primary-500 to-purple-600 rounded-2xl rotate-12 flex items-center justify-center shadow-2xl shadow-primary-500/40 mb-6 group hover:rotate-0 transition-transform duration-500">
               <Compass className="w-8 h-8 text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Welcome Back
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Log in to manage your premium gallery collection.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  required type="email" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-semibold"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  required type={showPassword ? "text" : "password"} 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-12 py-4 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-semibold"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-linear-to-r from-primary-600 to-purple-600 active:scale-95 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-primary-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Sign In <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} /></>}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Secured Access</span>
            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
          </div>

          <div className="w-full min-h-[44px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign-In failed')}
              useOneTap
              use_fedcm_for_prompt={false}
              width="100%"
              theme="filled_blue"
              shape="pill"
              text="continue_with"
              containerProps={{
                style: { width: '100%', display: 'block' }
              }}
            />
          </div>
          
          <p className="mt-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            New to GalleryPro? <Link to="/signup" className="text-primary-500 font-black hover:underline underline-offset-4 decoration-2">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
