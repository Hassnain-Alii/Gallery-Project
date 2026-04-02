import { X, Heart, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageModal({ image, onClose, isFavorite, onToggleFavorite }) {
  if (!image) return null;

  const handleDownload = async () => {
    toast.info('Downloading...');
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gallery_${image._id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Download complete');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] bg-transparent rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        {/* Close Button Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <img 
          src={image.url} 
          alt={`by ${image.author}`} 
          className="w-full h-auto max-h-[75vh] object-contain rounded-t-2xl" 
        />
        
        <div className="bg-white dark:bg-gray-800 p-6 flex items-center justify-between rounded-b-2xl shadow-xl">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 uppercase tracking-wider">Uploaded By</p>
            <h3 className="text-2xl font-bold dark:text-white">{image.author}</h3>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => onToggleFavorite(image)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isFavorite 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} /> 
              {isFavorite ? 'Favorited' : 'Favorite'}
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all"
            >
              <Download className="w-5 h-5" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
