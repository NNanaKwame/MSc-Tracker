import { Redis } from '@upstash/redis';
const redis = new Redis({url:process.env.Redis_KV_REST_API_URL,token:process.env.Redis_KV_REST_API_TOKEN});
const statuses = new Set(['Not Started','Researching','Preparing','Ready to Submit','Submitted','Interview','Accepted','Rejected','Withdrawn']);
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  try {
    if(req.method==='GET') {
      const [statusData,notes]=await Promise.all([redis.hgetall('tracker_statuses'),redis.hgetall('tracker_notes')]);
      return res.status(200).json({statuses:statusData||{},notes:notes||{}});
    }
    if(req.method!=='POST') {res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'});}
    const {type,key,value,token}=req.body||{};
    if(!process.env.ADMIN_SECRET || token!==process.env.ADMIN_SECRET) return res.status(401).json({error:'Unauthorized'});
    if(!['status','notes'].includes(type) || typeof key!=='string' || !/^(uni|schol):.{1,200}$/.test(key) || typeof value!=='string' || value.length>10000 || (type==='status'&&!statuses.has(value))) return res.status(400).json({error:'Invalid update'});
    await redis.hset(type==='status'?'tracker_statuses':'tracker_notes',{[key]:value});
    return res.status(200).json({success:true});
  } catch(error) {console.error('Tracker sync failed');return res.status(500).json({error:'Unable to sync tracker. Please retry.'});}
}
