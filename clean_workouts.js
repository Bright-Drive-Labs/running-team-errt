import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://yxxlplorjolymdjffrca.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA"
);

async function clean() {
  const { error } = await supabase
    .from('workout_assignments')
    .delete()
    .neq('athlete_id', '00000000-0000-0000-0000-000000000000'); // Borra todo
  
  if (error) {
    console.error("❌ Error al borrar:", error);
  } else {
    console.log("✅ Tabla de entrenamientos vaciada con éxito.");
  }
}

clean();
