import { useEffect, useState } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Users } from 'lucide-react';

export default function Sidebar() {
  const { activeAuthor, setActiveAuthor, apiBaseURL } = useGallery();
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    fetch(`${apiBaseURL}/images/authors`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setAuthors(['All', ...data]);
        else setAuthors(['All']);
      })
      .catch(err => {
        console.error('Failed to load authors', err);
        setAuthors(['All']);
      });
  }, [apiBaseURL]);

  return (
    <aside className="w-68 flex-shrink-0 h-[calc(100vh-80px)] overflow-y-auto sticky top-[80px] p-6 hidden lg:block border-r border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl">
      <div className="flex items-center gap-3 text-gray-500 mb-8 font-black uppercase tracking-[0.1em] text-xs">
        <Users className="w-4 h-4 text-primary-500" /> Discover Authors
      </div>
      <ul className="space-y-1.5">
        {authors.map((author, i) => (
          <li key={i}>
            <button
              onClick={() => setActiveAuthor(author)}
              className={`w-full text-left px-5 py-3 rounded-xl transition-all duration-300 group flex items-center justify-between ${
                activeAuthor === author 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 font-bold translate-x-1' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:pl-6'
              }`}
            >
              <span className="truncate">{author}</span>
              {activeAuthor === author && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          </li>
        ))}
        {authors.length === 1 && authors[0] === 'All' && (
           <div className="text-center py-10">
             <p className="text-gray-400 text-sm animate-pulse">Loading contributors...</p>
           </div>
        )}
      </ul>
    </aside>
  );
}
