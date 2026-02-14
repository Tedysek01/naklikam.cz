export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description });
    }
    
    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('GitHub user API error:', userData);
      return res.status(400).json({ error: 'Failed to get user data' });
    }
    
    console.log('GitHub OAuth successful for user:', userData.login);
    
    // Determine the correct frontend URL based on the request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || 'www.naklikam.cz';
    const baseUrl = `${protocol}://${host}`;
    
    const redirectUrl = `${baseUrl}/dashboard?github_connected=true&github_user=${userData.login}&github_token=${tokenData.access_token}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || 'www.naklikam.cz';
    const baseUrl = `${protocol}://${host}`;
    
    res.redirect(`${baseUrl}/dashboard?error=Authentication failed`);
  }
}