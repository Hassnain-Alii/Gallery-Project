import { Heart, Search, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImageCard({
  image,
  onImageClick,
  isFavorite,
  onToggleFavorite,
}) {
  const handleDownload = async (e) => {
    e.stopPropagation();
    toast.info("Starting download...");
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gallery_${image._id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Download complete");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 aspect-4/5 bg-gray-200 dark:bg-gray-800 cursor-pointer"
      onClick={() => onImageClick(image)}
    >
      <img
        src={image.url}
        alt={`by ${image.author}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-black/65 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out flex flex-col justify-between p-6">
        <div className="flex  items-center justify-between gap-3 mb-4 scale-90 group-hover:scale-100 transition-transform duration-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(image);
            }}
            className={`w-12 h-12 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-300 ${isFavorite ? "bg-red-500 text-white shadow-2xl shadow-red-500/50 scale-110" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={handleDownload}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        <p className="text-white font-bold text-lg mb-4 tracking-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          By <span className="text-primary-400">{image.author}</span>
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(image);
          }}
          className="w-full bg-white text-gray-900 py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold shadow-xl hover:bg-primary-50 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
        >
          <Search className="w-4 h-4" /> View Work
        </button>
      </div>
    </div>
  );
}
