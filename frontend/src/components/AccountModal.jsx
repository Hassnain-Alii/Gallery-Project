import { useState, useEffect } from 'react';
import { useGallery } from '../context/GalleryContext';
import { toast } from 'sonner';
import { X, User, Shield, Camera, Calendar, Mail, Lock, CheckCircle, Globe, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function AccountModal({ isOpen, onClose }) {
  const { user, apiBaseURL, updateUser } = useGallery();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    picture: user?.picture || ''
  });

  // Security state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Keep state in sync with user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        picture: user.picture || ''
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('File too large (max 2MB)');
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${apiBaseURL}/auth/avatar`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      updateUser({ picture: data.picture });
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseURL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      updateUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseURL}/auth/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isGoogleUser = !!user?.googleId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Blurry Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-500"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[96vh] bg-white dark:bg-gray-950 rounded-4xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header - Premium Gradient */}
        <div className="relative bg-linear-to-r from-primary-600 via-primary-500 to-purple-600 p-4 md:p-4 text-white">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-sm cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-20 md:h-20 rounded-4xl overflow-hidden border-4 border-white/20 shadow-2xl relative">
                <img 
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                />
                
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <Camera size={20} />}
                </label>
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{user?.name}</h2>
              <p className="text-white/70 font-medium flex items-center gap-2 text-xs md:text-sm">
                <Mail size={14} className="opacity-50" /> {user?.email}
              </p>
              <div className="pt-1">
                {isGoogleUser ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/10">
                    <Globe size={10} /> Google Auth
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/10">
                    <Shield size={10} /> Local Security
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 p-6 border-r border-gray-100 dark:border-gray-800 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all group cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-xl shadow-black/5 scale-[1.02]' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={20} className={activeTab === 'profile' ? 'text-primary-500' : 'text-gray-400'} />
                <span>Profile Info</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === 'profile' ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all group cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-xl shadow-black/5 scale-[1.02]' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield size={20} className={activeTab === 'security' ? 'text-primary-500' : 'text-gray-400'} />
                <span>Security</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === 'security' ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-gray-950">
            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Display Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-6 py-3.5 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-semibold"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Birthday</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input 
                        type="date" 
                        value={profileData.dob}
                        onChange={e => setProfileData({...profileData, dob: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-6 py-3.5 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Custom Photo URL</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                      <input 
                        type="url" 
                        value={profileData.picture}
                        onChange={e => setProfileData({...profileData, picture: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-6 py-3.5 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-semibold"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-900">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-primary-600 to-purple-600 hover:scale-[1.01] active:scale-[0.99] text-white font-black py-4 rounded-3xl shadow-2xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Update Profile <CheckCircle size={18} /></>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-primary-500/5 p-5 rounded-4xl border border-primary-500/10">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-2xl ${isGoogleUser ? 'bg-blue-100 text-blue-600' : 'bg-primary-100 text-primary-600'}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-base">{isGoogleUser ? 'Google Managed Account' : 'Password Protection'}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {isGoogleUser 
                          ? "Your authentication is handled by Google's secure SSO. Local password changes are disabled." 
                          : "Maintain a strong, unique password to ensure your gallery data remains private."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {!isGoogleUser ? (
                  <form onSubmit={handleSecuritySubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Current Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={18} />
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          required 
                          value={passwords.currentPassword} 
                          onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} 
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-12 py-3.5 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-semibold" 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            required 
                            value={passwords.newPassword} 
                            onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-12 py-3.5 outline-none transition-all font-semibold" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Confirm</label>
                        <div className="relative group">
                          <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            required 
                            value={passwords.confirmPassword} 
                            onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl pl-11 pr-12 py-3.5 outline-none transition-all font-semibold" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button type="submit" disabled={loading} className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black py-4 rounded-3xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer">
                        {loading ? <div className="w-5 h-5 border-3 border-gray-400 border-t-black rounded-full animate-spin"></div> : <>Update Password <Shield size={18} /></>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-5">
                    <div className="w-20 h-20 bg-linear-to-tr from-blue-500/10 to-indigo-500/10 rounded-4xl flex items-center justify-center text-blue-600 shadow-inner">
                      <Shield size={40} />
                    </div>
                    <div className="max-w-xs space-y-1">
                      <h4 className="text-lg font-black">SSO Protection Active</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Your account is secured via Google's Enterprise SSO. Password management is handled by Google for enhanced reliability.
                      </p>
                    </div>
                    <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-full font-bold hover:bg-blue-100 transition-all text-sm">
                      Google Settings <Globe size={16} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
