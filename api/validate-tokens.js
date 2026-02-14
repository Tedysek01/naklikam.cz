// Simple validation endpoint that just checks if user has enough tokens
// The actual consumption happens on client-side (less secure but simpler)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokensUsed, tokensLimit, requestedTokens, plan } = req.body;
    
    if (typeof tokensUsed !== 'number' || typeof requestedTokens !== 'number') {
      return res.status(400).json({ error: 'Invalid token values' });
    }

    // Check if user has enough tokens
    if (plan !== 'unlimited' && (tokensUsed + requestedTokens) > tokensLimit) {
      return res.status(403).json({ 
        error: 'Insufficient tokens',
        tokensUsed,
        tokensLimit,
        requested: requestedTokens,
        wouldUse: tokensUsed + requestedTokens
      });
    }
    
    // Return approval
    res.status(200).json({
      success: true,
      approved: true,
      newTokensUsed: tokensUsed + requestedTokens
    });
    
  } catch (error) {
    console.error('Error validating tokens:', error);
    res.status(500).json({ 
      error: 'Failed to validate tokens',
      details: error.message 
    });
  }
}