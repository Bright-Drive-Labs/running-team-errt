const url = "https://yxxlplorjolymdjffrca.supabase.co/rest/v1/workout_assignments";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA";

const athleteId = "a001d942-3eae-4810-a200-94139bf9009a";

const workouts = [
  {
    athlete_id: athleteId,
    workout_name: "VELOCIDAD: 8x400m Explosivos",
    target_date: new Date().toISOString(),
    status: "PENDING",
    coach_notes: "Fuerza y ritmo.",
    markdown_payload: "- 15m Warmup\n- 8x 400m Z5\n- 10m Cooldown"
  },
  {
    athlete_id: athleteId,
    workout_name: "BASE: Rodaje de 10km",
    target_date: new Date(Date.now() + 86400000).toISOString(),
    status: "PENDING",
    coach_notes: "Disfruta el paisaje.",
    markdown_payload: "- 10km Z2"
  }
];

async function seed() {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workouts)
  });
  console.log("Status:", response.status);
}

seed();
