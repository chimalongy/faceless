const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { Client } = require('pg');

async function run() {
  const host = 'db.wilsaxbknhdsuwhyhzyh.supabase.co';
  console.log(`Resolving AAAA record for ${host} using public DNS...`);
  
  try {
    const ips = await dns.resolve(host, 'AAAA');
    if (!ips || ips.length === 0) {
      throw new Error('No IPv6 addresses found');
    }
    const ip = ips[0];
    console.log(`Resolved to IPv6 IP: ${ip}`);
    
    // In pg and node, wrap IPv6 in brackets
    const client = new Client({
      host: ip,
      port: 5432,
      user: 'postgres',
      password: 'chimsyboy2275',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    console.log(`Connecting directly to ${ip}...`);
    await client.connect();
    console.log('Successfully connected directly to Supabase via IPv6 IP!');
    
    const query = `
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS is_audio_generating BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_image_generating BOOLEAN DEFAULT FALSE;
    `;

    await client.query(query);
    console.log('Successfully added columns is_audio_generating and is_image_generating to stories table!');
    await client.end();
  } catch (err) {
    console.error('Direct connection failed:', err.message);
  }
}

run();
