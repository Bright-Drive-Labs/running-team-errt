import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://yxxlplorjolymdjffrca.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA"
);

async function hideAll() {
  const { error, count } = await supabase
    .from('workout_assignments')
    .update({ status: 'ARCHIVED' })
    .eq('status', 'PENDING');
  
  if (error) {
    console.error("❌ Error al archivar:", error);
  } else {
    console.log(`✅ ¡Éxito! ${count} entrenamientos han sido archivados y ahora son invisibles.`);
  }
}

hideAll();
