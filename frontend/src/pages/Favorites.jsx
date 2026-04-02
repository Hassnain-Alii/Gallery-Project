import { useState, useEffect } from 'react';
import { useGallery } from '../context/GalleryContext';
import ImageCard from '../components/ImageCard';
import ImageModal from '../components/ImageModal';
import { HeartCrack, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Favorites() {
  const { user, apiBaseURL } = useGallery();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if(!user) return;
    setLoading(true);
    fetch(`${apiBaseURL}/favorites`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setImages(data))
    .catch(() => toast.error('Failed to load favorites'))
    .finally(() => setLoading(false));
  }, [user, apiBaseURL]);

  const handleToggleFavorite = async (img) => {
    // On favorites page we only allow removing
    try {
      await fetch(`${apiBaseURL}/favorites/${img._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setImages(prev => prev.filter(p => p._id !== img._id));
      if(selectedImage?._id === img._id) setSelectedImage(null);
    } catch (err) {
      toast.error('Failed to remove favorite');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <HeartCrack className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Please Login</h2>
        <p className="text-gray-500 max-w-md">You need an account to save and view your favorite images.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8">My Favorites</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton aspect-4/5" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
           <HeartCrack className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
           <p className="text-xl text-gray-500 font-medium tracking-wide">You haven't added any favorites yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map(img => (
            <ImageCard 
             key={img._id} 
             image={img} 
             onImageClick={setSelectedImage} 
             isFavorite={true}
             onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageModal 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          isFavorite={true}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
