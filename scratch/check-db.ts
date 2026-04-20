import { supabase } from '../src/lib/supabase';

async function check() {
  const { data, error } = await supabase
    .from('workout_assignments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('--- RECENT WORKOUT ---');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No workouts found.');
  }
}

check();
