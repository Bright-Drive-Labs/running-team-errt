const url = "https://yxxlplorjolymdjffrca.supabase.co/rest/v1/workout_assignments";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA";

const athleteId = "a001d942-3eae-4810-a200-94139bf9009a"; // ID de Daniel Perez

const workouts = [
  {
    athlete_id: athleteId,
    workout_name: "VELOCIDAD | 8x400m Explosivos",
    target_date: new Date().toISOString(),
    status: "PENDING",
    coach_notes: "Mantén el ritmo constante en cada serie. Recuperación activa de 1:30 min.",
    markdown_payload: "- 15m Z1 Warmup\n- 8x\n  - 400m Z5 95%\n  - 1m30s Z1 Recovery\n- 10m Z1 Cooldown"
  },
  {
    athlete_id: athleteId,
    workout_name: "BASE | Rodaje Regenerativo",
    target_date: new Date(Date.now() + 86400000).toISOString(), // Mañana
    status: "PENDING",
    coach_notes: "No te pases de pulsaciones. Solo queremos soltar piernas.",
    markdown_payload: "- 45m Z2 65-70%\n- 5m Z1 Cooldown"
  },
  {
    athlete_id: athleteId,
    workout_name: "POTENCIA | Cuestas Explosivas",
    target_date: new Date(Date.now() + 172800000).toISOString(), // Pasado mañana
    status: "PENDING",
    coach_notes: "Máxima potencia en la subida, vuelve trotando suave.",
    markdown_payload: "- 20m Z2 Warmup\n- 10x\n  - 15s MAX Power Hill\n  - 45s Z1 Walk Down\n- 10m Z1 Cooldown"
  }
];

async function seed() {
  for (const w of workouts) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(w)
    });
    console.log(`Workout ${w.workout_name} insertado.`);
  }
}

seed();
