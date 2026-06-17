const dns = require('dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  const host = 'db.wilsaxbknhdsuwhyhzyh.supabase.co';
  console.log(`Resolving ${host} using public DNS...`);
  try {
    const records = await dns.resolve(host, 'AAAA');
    console.log('AAAA Records:', records);
  } catch (err) {
    console.log('AAAA Resolution failed:', err.message);
  }

  try {
    const records = await dns.resolve(host, 'A');
    console.log('A Records:', records);
  } catch (err) {
    console.log('A Resolution failed:', err.message);
  }
}

run();
