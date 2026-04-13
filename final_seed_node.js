const fs = require('fs');
const url = "https://yxxlplorjolymdjffrca.supabase.co/rest/v1/workout_assignments";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA";

async function seed() {
  const data = JSON.parse(fs.readFileSync('final_seed.json', 'utf8'));
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  console.log("Status:", response.status);
  const result = await response.json().catch(() => ({}));
  console.log("Result:", result);
}

seed();
