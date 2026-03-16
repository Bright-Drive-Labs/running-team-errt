export default function Gallery() {
  const images = [
    { id: 1, title: 'Sprint Training', h: 'h-96' },
    { id: 2, title: 'Team Stretching', h: 'h-64' },
    { id: 3, title: 'Sunrise Run', h: 'h-80' },
    { id: 4, title: 'Marathon Finish', h: 'h-[28rem]' },
    { id: 5, title: 'Post-run Coffee', h: 'h-72' },
    { id: 6, title: 'Night Track Interval', h: 'h-80' },
    { id: 7, title: 'Trail Session', h: 'h-[30rem]' },
    { id: 8, title: 'Warmup Squad', h: 'h-64' },
    { id: 9, title: 'Medal Ceremony', h: 'h-96' },
  ];

  return (
    <div className="min-h-screen bg-rumbero-white py-24 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16 flex items-end justify-between border-b-4 border-rumbero-black pb-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic text-rumbero-black leading-none">
              Nuestra <span className="text-rumbero-red">Visual</span>
            </h1>
            <p className="text-slate-500 mt-4 text-xl max-w-xl font-medium">Momentos inolvidables, gotas de sudor y muchas sonrisas.</p>
          </div>
          <div className="hidden md:block text-rumbero-red font-black text-2xl uppercase tracking-[0.3em]">
            EST. 2024
          </div>
        </div>

        {/* Masonry-like CSS Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((img) => (
            <div key={img.id} className="relative group overflow-hidden bg-slate-200 rounded-xl break-inside-avoid">
              <div className={`w-full ${img.h} bg-slate-300 flex items-center justify-center`}>
                <span className="text-slate-400 font-display uppercase tracking-widest text-sm font-bold opacity-50">IMAGE {img.id}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-rumbero-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-6">
                <h3 className="text-white font-black uppercase tracking-widest text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {img.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
