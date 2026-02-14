export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub app not configured' });
  }
  
  const state = req.query.state || 'default';
  const scope = 'user,repo';
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scope}&state=${state}`;
  
  console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
  res.redirect(githubAuthUrl);
}