const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:chimsyboy2275@db.wilsaxbknhdsuwhyhzyh.supabase.co:5432/postgres';
  console.log('Attempting direct IPv6 connection to Supabase...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Successfully connected directly to Supabase via IPv6!');
    
    const query = `
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS is_audio_generating BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_image_generating BOOLEAN DEFAULT FALSE;
    `;

    await client.query(query);
    console.log('Successfully added columns is_audio_generating and is_image_generating to stories table!');
    await client.end();
  } catch (err) {
    console.error('Direct IPv6 connection failed:', err.message);
    try {
      await client.end();
    } catch (e) {}
  }
}

run();
