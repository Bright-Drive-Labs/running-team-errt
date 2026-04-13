import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://yxxlplorjolymdjffrca.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA"
);

async function nuke() {
  // Primero: Ver quién es Daniel realmente
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name')
    .eq('email', 'dpinfosys@gmail.com')
    .single();

  console.log(`👤 Daniel tiene el ID: ${athlete?.id}`);

  // Segundo: Borrar TODOS los entrenamientos de PENDING
  const { error, count } = await supabase
    .from('workout_assignments')
    .delete({ count: 'exact' })
    .neq('status', 'FINISHED_TRAINING_STATUS_THAT_DOES_NOT_EXIST');
  
  if (error) {
    console.error("❌ Error nuclear:", error);
  } else {
    console.log(`✅ ¡Fuiiiish! Borrados ${count} registros de la faz de la tierra.`);
  }
}

nuke();
