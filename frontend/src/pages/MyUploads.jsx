import { useState, useEffect, useCallback } from 'react';
import { useGallery } from '../context/GalleryContext';
import ImageCard from '../components/ImageCard';
import ImageModal from '../components/ImageModal';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyUploads() {
  const { apiBaseURL, user } = useGallery();
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchMyImages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${apiBaseURL}/images/user?page=${page}&limit=15`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      const fixedImages = data.images.map(img => {
        let fixedUrl = img.url;
        // Fix for internal Docker hostnames or wrong ports
        if (fixedUrl.includes(':9000/')) fixedUrl = fixedUrl.replace(':9000/', ':9200/');
        if (fixedUrl.includes('//minio:')) fixedUrl = fixedUrl.replace('//minio:', '//localhost:');
        
        return { ...img, url: fixedUrl };
      });
      
      setImages(fixedImages);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(true);
      toast.error('Failed to load your uploads');
    } finally {
      setLoading(false);
    }
  }, [apiBaseURL, page, user]);

  useEffect(() => {
    fetchMyImages();
  }, [fetchMyImages]);

  // For MyUploads, we might not need to toggle favorites, 
  // but if we do, we'd need favIds logic. 
  // Let's keep it simple for now or copy-paste the fav logic if desired.
  // I'll skip favorites here for simplicity, or just show them as not-favorited.

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <UploadCloud className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Login to see your uploads</h2>
        <p className="text-gray-500 mb-6">You need to be signed in to view and manage your personal gallery.</p>
        <Link to="/login" className="px-8 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-semibold">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">My Uploads</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and view all the beautiful images you've shared.</p>
        </div>
        <Link to="/upload" className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-semibold">
           <UploadCloud className="w-5 h-5" /> Upload New
        </Link>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center p-20 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-xl text-red-600 dark:text-red-400 mb-6 font-medium">Failed to load images</p>
          <button onClick={fetchMyImages} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="skeleton aspect-4/5 w-full rounded-2xl shadow-sm" />
          ))}
        </div>
      ) : (
        <>
          {images.length === 0 ? (
             <div className="text-center py-32 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <UploadCloud className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-8">You haven't uploaded any images yet</p>
                <Link to="/upload" className="px-8 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-semibold">
                  Start Uploading
                </Link>
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
               {images.map(img => (
                 <ImageCard 
                  key={img._id} 
                  image={img} 
                  onImageClick={setSelectedImage} 
                  isFavorite={false} // Simplify for user uploads
                  onToggleFavorite={() => {}}
                 />
               ))}
             </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-12 bg-white/70 dark:bg-gray-800/70 p-4 rounded-2xl glass-effect mx-auto max-w-md shadow-lg border border-white/10">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <div className="flex items-center gap-2 min-w-24 justify-center">
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Page {page}</span>
                <span className="text-gray-400 text-sm">of {totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedImage && (
        <ImageModal 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          isFavorite={false}
          onToggleFavorite={() => {}}
        />
      )}
    </div>
  );
}
