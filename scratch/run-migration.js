const dns = require('dns').promises;
const { Client } = require('pg');

const projectRef = 'wilsaxbknhdsuwhyhzyh';
const dbPassword = 'chimsyboy2275';

// All possible AWS regions supported by Supabase
const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ca-central-1',
  'sa-east-1',
  'me-central-1',
  'af-south-1'
];

async function checkDns(host) {
  try {
    const address = await dns.lookup(host);
    return !!address;
  } catch (err) {
    return false;
  }
}

async function run() {
  console.log('Resolving pooler hosts using dns.lookup...');
  
  for (const region of regions) {
    // Try both aws-0-${region} and aws-${region}
    const hosts = [
      `aws-0-${region}.pooler.supabase.com`,
      `aws-${region}.pooler.supabase.com`
    ];

    for (const host of hosts) {
      const resolves = await checkDns(host);
      if (!resolves) continue;

      console.log(`Host ${host} resolved! Attempting connection for project ${projectRef}...`);
      
      const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@${host}:6543/postgres`;
      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });

      try {
        await client.connect();
        console.log(`Connected to host ${host} successfully!`);
        
        const query = `
          ALTER TABLE stories 
          ADD COLUMN IF NOT EXISTS is_audio_generating BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_image_generating BOOLEAN DEFAULT FALSE;
        `;

        await client.query(query);
        console.log('Successfully added columns is_audio_generating and is_image_generating to stories table!');
        await client.end();
        return; // Success!
      } catch (err) {
        console.log(`Connection to ${host} failed: ${err.message}`);
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }

  console.error('Migration failed: Could not connect to any resolving pooler.');
}

run();
