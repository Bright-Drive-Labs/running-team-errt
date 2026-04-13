import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://yxxlplorjolymdjffrca.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA"
);

async function absoluteClean() {
  const idsToKill = [
    "c61fc42e-55d7-44ad-9834-2ed8844a5efa",
    "35666b11-1a45-48dc-a1c4-39bbb0a44938"
  ];

  const { error } = await supabase
    .from('workout_assignments')
    .delete()
    .in('id', idsToKill);
  
  if (error) {
    console.error("❌ Error al borrar:", error);
  } else {
    console.log("✅ ¡Entrenamientos de prueba fulminados!");
  }
}

absoluteClean();
