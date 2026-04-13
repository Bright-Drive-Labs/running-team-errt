const url = "https://yxxlplorjolymdjffrca.supabase.co/rest/v1/athletes";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eGxwbG9yam9seW1kamZmcmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDYyMzUsImV4cCI6MjA4OTYyMjIzNX0.un9MLzYfndCqvAvrmfkmFY6Q01xXW-NOlYSAO3PFsqA";

async function register() {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      email: 'dpinfosys@gmail.com',
      name: 'Daniel Perez',
      group_tag: 'COACH',
      tenant_id: '98b50e2d-dc99-43ef-b387-052637738f61'
    })
  });
  const data = await response.json();
  console.log(data);
}

register();
