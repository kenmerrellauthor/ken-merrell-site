const url = 'https://slezcgbeqifsdbwflovb.supabase.co';
const key = 'sb_secret_z5ssfwTz8P5TwYF0KUiImQ_xmScPxpq';

async function checkSchema() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Connected to OpenAPI. Tables found in schema cache:');
      const tables = Object.keys(data.definitions || {});
      console.log(tables);
    } else {
      console.log('❌ FAILED!', res.status);
    }
  } catch (err) {
    console.error('Network Error:', err);
  }
}

checkSchema();
