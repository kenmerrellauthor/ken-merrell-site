const url = 'https://slezcgbeqifsdbwflovb.supabase.co';
const key = 'sb_secret_z5ssfwTz8P5TwYF0KUiImQ_xmScPxpq';

async function testSupabase() {
  try {
    const res = await fetch(`${url}/rest/v1/books?select=*`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (res.ok) {
      console.log('✅ SUCCESS! The table public.books exists.');
      const data = await res.json();
      console.log(`Found ${data.length} books in the database.`);
    } else {
      const error = await res.json();
      console.log('❌ FAILED!');
      console.log('Status:', res.status);
      console.log('Error from Supabase:', error);
    }
  } catch (err) {
    console.error('Network Error:', err);
  }
}

testSupabase();
