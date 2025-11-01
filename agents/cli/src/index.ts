import axios from 'axios'

const AUTH = { headers: { Authorization: 'Bearer dev-token' } }

async function main() {
  // 1) Discover NGSI tools
  const disc = await axios.get('http://localhost:8001/discover', AUTH)
  console.log('NGSI tools:', disc.data.tools.map((t:any)=>t.name))

  // 2) Call ngsi_query with wildcard read scope
  const q = await axios.post('http://localhost:8001/call', {
    tool: 'ngsi_query',
    args: { type: 'Building', q: 'name==Aulario I', limit: 1 },
    scope: { read: ['*'] }
  }, AUTH)
  console.log('ngsi_query(ok):', q.data.ok === true)

  // 3) Get observations from STA for datastream 1001
  const obs = await axios.post('http://localhost:8002/call', {
    tool: 'sta_get_observations',
    args: { datastream_id: 1001, interval: 'PT1H' },
    scope: { read: ['Observations'] }
  }, AUTH)
  console.log('sta_get_observations(ok):', obs.data.ok === true)

  console.log('Happy path completed.')
}

main().catch(e => {
  console.error('CLI error:', e?.response?.data || e.message)
  process.exit(1)
})
