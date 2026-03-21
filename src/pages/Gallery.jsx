import { useState, useEffect } from 'react';

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ID Raíz de la Empresa (El que pondrán en el Dashboard. Aquí está quemado temporalmente para el Escuadrón)
  const rootFolderId = "16Gm8YLOqlVWmdMvFn2eb3msT4aFkom6W";

  // Efecto 1: Cargar la lista de Carpetas (Álbumes) al inicio
  useEffect(() => {
    if (selectedAlbum) return; // Si hay un álbum seleccionado, no recargues la raíz
    setLoading(true);
    fetch(`http://localhost:3000/api/gallery/albums/${rootFolderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAlbums(data.albums);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando álbumes desde Drive:", err);
        setLoading(false);
      });
  }, [selectedAlbum]);

  // Efecto 2: Cargar las Fotos específicas cuando se hace clic en un Álbum
  useEffect(() => {
    if (!selectedAlbum) return;
    setLoading(true);
    setImages([]); // Limpiamos fotos viejas
    fetch(`http://localhost:3000/api/gallery/${selectedAlbum.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImages(data.images);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error cargando fotos del álbum ${selectedAlbum.name}:`, err);
        setLoading(false);
      });
  }, [selectedAlbum]);

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
          
          {/* Botón dinámico superior que solo aparece cuando estamos viendo un álbum */}
          {selectedAlbum ? (
            <button 
              onClick={() => setSelectedAlbum(null)}
              className="bg-rumbero-black hover:bg-rumbero-red text-white px-6 py-4 rounded-full font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2"
            >
              <span>←</span> Volver a Colecciones
            </button>
          ) : (
            <div className="hidden md:block text-rumbero-red font-black text-2xl uppercase tracking-[0.3em]">
              EST. 2022
            </div>
          )}
        </div>

        {/* --- ESTADO DE CARGA --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <span className="text-4xl drop-shadow-md pb-2">🔄</span>
            <p className="text-slate-600 font-black mt-4 uppercase tracking-[0.2em]">Sincronizando Nube...</p>
          </div>
        )}

        {/* --- VISTA 1: MENÚ DE ÁLBUMES (Subcarpetas en modo Masonry) --- */}
        {!loading && !selectedAlbum && albums.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {albums.map((album) => (
              <div 
                key={album.id} 
                onClick={() => setSelectedAlbum(album)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl hover:text-white transition-all duration-300 shadow-md hover:shadow-2xl border-4 border-transparent hover:border-rumbero-red flex flex-col justify-end text-center break-inside-avoid"
              >
                {/* Capa 0: Foto de Portada Natural (h-auto) */}
                {album.coverId ? (
                   <>
                     <img 
                       src={`http://localhost:3000/api/image/${album.coverId}`} 
                       alt={`Portada de ${album.name}`}
                       className="w-full h-auto block transform group-hover:scale-110 transition-transform duration-700 z-0" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-rumbero-black/90 via-rumbero-black/30 to-transparent z-10 pointer-events-none"></div>
                   </>
                ) : (
                   <div className="w-full aspect-[4/3] bg-slate-100 z-0 flex items-center justify-center">
                     <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm opacity-50">📁</span>
                   </div>
                )}
                
                {/* Capa 1: Títulos en la base de la foto */}
                <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center p-6 w-full">
                  <h3 className={`font-black uppercase tracking-widest text-2xl mb-1 px-2 leading-tight drop-shadow-xl ${album.coverId ? 'text-white' : 'text-rumbero-black group-hover:text-white'}`}>
                    {album.name}
                  </h3>
                  <p className="text-rumbero-red font-black tracking-widest text-xs uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    Abrir Colección →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !selectedAlbum && albums.length === 0 && (
          <div className="text-center bg-slate-100 rounded-3xl border-4 border-dashed border-slate-300 py-32 px-4 shadow-inner">
            <span className="text-6xl block mb-6 opacity-80">📦</span>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">No hay Álbumes aún</h2>
            <p className="text-slate-500 font-medium">Ve a tu Google Drive principal y crea sub-carpetas para cada carrera.</p>
          </div>
        )}

        {/* --- VISTA 2: GRILLA MASONRY FOTOGRÁFICA (Pintando las fotos de un álbum) --- */}
        {!loading && selectedAlbum && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-rumbero-red text-4xl">📸</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase text-rumbero-black tracking-widest leading-none border-l-8 border-rumbero-black pl-5">
                {selectedAlbum.name}
              </h2>
            </div>
            
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {images.map((img) => (
                <div key={img.id} className="relative group overflow-hidden bg-slate-200 rounded-xl break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-300">
                  <img 
                    src={`http://localhost:3000/api/image/${img.id}`} 
                    alt={img.name} 
                    className="w-full h-auto block transform group-hover:scale-105 transition-transform duration-[2s]"
                    loading="lazy"
                  />
                  <div className="absolute border-4 border-transparent group-hover:border-rumbero-red inset-0 transition-colors duration-500 rounded-xl z-20 pointer-events-none"></div>
                </div>
              ))}
            </div>

            {images.length === 0 && (
              <div className="text-center text-slate-500 font-bold uppercase tracking-widest py-24 bg-slate-50 rounded-2xl shadow-inner mt-8">
                Este álbum de Google Drive está vacío.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
