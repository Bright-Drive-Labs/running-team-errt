import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://yxxlplorjolymdjffrca.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA"
);

async function check() {
  const { data, error } = await supabase
    .from('athletes')
    .select('name, email, intervals_athlete_id, intervals_api_key')
    .eq('email', 'dpinfosys@gmail.com');
  
  if (error) {
    console.error("❌ Error:", error);
  } else {
    console.log("✅ Datos encontrados:", JSON.stringify(data, null, 2));
  }
}

check();
