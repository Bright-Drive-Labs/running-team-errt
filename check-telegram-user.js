const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('athletes')
    .select('id, name, email, telegram_user_id, is_admin')
    .eq('telegram_user_id', 7481658837)
    .single();

  if (error) {
    console.error('❌ Usuario no encontrado:', error.message);
  } else {
    console.log('✅ Usuario encontrado:');
    console.log(JSON.stringify(data, null, 2));
  }
  
  process.exit(0);
}

check();
