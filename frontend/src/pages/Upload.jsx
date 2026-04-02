import { useState, useRef } from 'react';
import { useGallery } from '../context/GalleryContext';
import { UploadCloud, FileImage, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

export default function Upload() {
  const { user, apiBaseURL } = useGallery();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <UploadCloud className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Please Login</h2>
        <p className="text-gray-500 max-w-md mb-8">You need an account to upload images to GalleryPro.</p>
        <Link to="/login" className="px-6 py-3 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition">Go to Login</Link>
      </div>
    );
  }

  const handleFile = (selected) => {
    if(!selected.type.startsWith('image/')) return toast.error('Only images are allowed');
    if(selected.size > 5 * 1024 * 1024) return toast.error('Image exceeds 5MB limit');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${apiBaseURL}/images/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message || 'Upload failed');
      toast.success('Image uploaded successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.message === 'Upload failed' ? 'Server connection error. Check if MinIO is running.' : err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-10">
      <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-linear-to-r from-primary-500 to-purple-600">
        Share Your Art
      </h2>
      
      {!preview ? (
        <div 
          onDragOver={onDragOver} 
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-3xl p-20 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-gray-800/50 backdrop-blur-md transition-all group shadow-sm hover:shadow-xl hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFile(e.target.files[0])} 
            accept="image/*" 
            hidden 
          />
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-xl font-medium mb-2">Click to upload or drag & drop</p>
          <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 5MB</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
           <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
             <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
             <button 
               onClick={() => { setFile(null); setPreview(null); }}
               className="absolute top-4 right-4 w-10 h-10 shadow-lg bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <FileImage className="w-6 h-6" />
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button 
                disabled={uploading}
                onClick={handleUpload} 
                className="px-8 py-3 bg-linear-to-r from-primary-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Uploading...</> : 'Upload Now'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
