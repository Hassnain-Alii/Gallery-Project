import { useState, useEffect, useCallback } from 'react';
import { useGallery } from '../context/GalleryContext';
import useDebounce from '../hooks/useDebounce';
import ImageCard from '../components/ImageCard';
import ImageModal from '../components/ImageModal';
import Sidebar from '../components/Sidebar';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Explore() {
  const { apiBaseURL, user, searchQuery, activeAuthor, setIsGlobalLoading } = useGallery();
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [images, setImages] = useState([]);
  const [favIds, setFavIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseURL}/favorites/ids`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const ids = await res.json();
      setFavIds(new Set(ids));
    } catch (err) {
      console.error(err);
    }
  }, [user, apiBaseURL]);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    if (typeof setIsGlobalLoading === 'function') setIsGlobalLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (activeAuthor && activeAuthor !== 'All') params.append('author', activeAuthor);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const res = await fetch(`${apiBaseURL}/images?${params}`);
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      setImages(data.images);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(true);
    } finally {
      if (typeof setIsGlobalLoading === 'function') setIsGlobalLoading(false);
      setLoading(false);
    }
  }, [apiBaseURL, page, activeAuthor, debouncedSearch]);

  // Reset page to 1 when search or author filter changes
  useEffect(() => {
    setPage(1);
  }, [activeAuthor, debouncedSearch]);

  useEffect(() => {
    fetchImages();
    fetchFavorites();
  }, [fetchImages, fetchFavorites]);

  const handleToggleFavorite = async (img) => {
    if (!user) {
      toast.error('Please login to favorite images');
      return;
    }

    const isFav = favIds.has(img._id);
    const token = localStorage.getItem('token');
    
    try {
      if (isFav) {
        await fetch(`${apiBaseURL}/favorites/${img._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const newSet = new Set(favIds);
        newSet.delete(img._id);
        setFavIds(newSet);
      } else {
        await fetch(`${apiBaseURL}/favorites`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ imageId: img._id })
        });
        setFavIds(new Set(favIds).add(img._id));
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      <Sidebar />
      
      <div className="flex-1 w-full min-w-0">
        {/* Premium Hero Section */}
        <div id="hero" className="mb-12 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-600 to-purple-700 p-8 md:p-12 text-white shadow-2xl">
           <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">
                Discover the <span className="text-primary-200">World's</span> Best Photography
              </h1>
              <p className="text-lg md:text-xl text-primary-50/80 mb-8 font-medium">
                Explore curate collections from professional photographers around the globe.
              </p>
              <div className="flex flex-wrap gap-4">
              <button onClick={() => { document.getElementById('hero').remove() }} className="px-8 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-lg hover:-translate-y-1 active:translate-y-0">
                    Get Started
                 </button>
                 <div className="flex -space-x-3 items-center">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-600 bg-gray-200 overflow-hidden shadow-sm">
                         <img src={`https://i.pravatar.cc/40?img=${i+10}`} alt="user" />
                      </div>
                    ))}
                    <span className="ml-4 text-sm font-semibold text-primary-100">+2.5k authors</span>
                 </div>
              </div>
           </div>
           
           {/* Abstract Background Shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 anim-pulse-slow"></div>
           <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -ml-48 -mb-48"></div>
        </div>
        
        {error ? (
          <div className="flex flex-col items-center justify-center p-20 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-xl text-red-600 dark:text-red-400 mb-6 font-medium">Failed to load images</p>
            <button onClick={fetchImages} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
              Retry Connection
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[...Array(10)].map((_, i) => (
               <div key={i} className="skeleton aspect-4/5 w-full shadow-2xl" />
            ))}
          </div>
        ) : (
          <>
            {images.length === 0 ? (
               <div className="text-center p-20 text-gray-400 glass-effect rounded-3xl">
                 <p className="text-xl font-medium">No masterpieces found matching your criteria</p>
                 <p className="text-sm mt-2">Try adjusting your search or author filter</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                 {images.map((img, index) => (
                   <div key={img._id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ImageCard 
                      image={img} 
                      onImageClick={setSelectedImage} 
                      isFavorite={favIds.has(img._id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                   </div>
                 ))}
               </div>
            )}

            {/* Pagination Controls */}
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
      </div>

      {selectedImage && (
        <ImageModal 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          isFavorite={favIds.has(selectedImage._id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
