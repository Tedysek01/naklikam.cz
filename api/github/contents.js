export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  if (req.method === 'PUT') {
    try {
      // Parse the full path from the request body
      const { owner, repo, path, content, message, sha } = req.body;
      
      if (!owner || !repo || !path) {
        return res.status(400).json({ error: 'Missing required parameters: owner, repo, path' });
      }

      // First, try to get the file to see if it exists (for SHA)
      let fileSha = sha;
      if (!fileSha) {
        try {
          const getResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );
          if (getResponse.ok) {
            const existingFile = await getResponse.json();
            fileSha = existingFile.sha;
          }
        } catch (e) {
          // File doesn't exist, that's okay
        }
      }

      // Create or update the file
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message || `Update ${path}`,
            content: content,
            sha: fileSha,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('GitHub API error:', error);
        return res.status(response.status).json({ 
          error: error.message || 'Failed to update file',
          details: error
        });
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('File update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}