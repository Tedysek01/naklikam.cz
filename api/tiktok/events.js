import crypto from 'crypto';

// TikTok Events API configuration
const TIKTOK_PIXEL_ID = 'D27UL9RC77U916NJ0RE0';
const TIKTOK_ACCESS_TOKEN = '5398e871c0180640d5a86013b086f825ac30b081';
const TIKTOK_API_VERSION = 'v1.3';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TIKTOK_ACCESS_TOKEN) {
    console.warn('TikTok Access Token not configured - Events API disabled');
    return res.status(200).json({ success: false, message: 'Events API not configured' });
  }

  try {
    const { event, properties = {}, user = {} } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Hash user data for privacy
    const hashedUser = {};
    if (user.email) {
      hashedUser.email = hashSHA256(user.email);
    }
    if (user.phone) {
      hashedUser.phone = hashSHA256(user.phone);
    }
    if (user.external_id) {
      hashedUser.external_id = hashSHA256(user.external_id);
    }

    // Build TikTok Events API 2.0 payload according to official docs
    const eventData = {
      event: event,
      event_time: Math.floor(Date.now() / 1000),
      user: {
        ip: getClientIP(req),
        user_agent: req.headers['user-agent'] || '',
        ...hashedUser
      },
      properties: {
        // Include event parameters in properties object
        ...properties,
        // Ensure numeric values are properly typed
        value: properties.value !== undefined ? parseFloat(properties.value) || 0 : undefined,
        num_items: properties.quantity !== undefined ? parseInt(properties.quantity) || 1 : undefined
      },
      page: {
        url: properties.page_url || req.headers.referer || '',
        referrer: req.headers.referer || ''
      }
    };

    // Add contents array for commerce events if needed
    if (needsContents(event) && properties.content_id) {
      eventData.properties.contents = [{
        content_id: properties.content_id,
        content_name: properties.content_name || '',
        content_category: properties.content_category || '',
        brand: properties.brand || '',
        price: parseFloat(properties.value) || 0
      }];
    }

    // Top-level payload structure for Events API 2.0
    const payload = {
      event_source: 'web',
      event_source_id: 'D27UL9RC77U916NJ0RE0', 
      data: [eventData]
    };

    console.log('🎯 Sending TikTok Events API request:', {
      event,
      pixelId: TIKTOK_PIXEL_ID,
      hasUserData: Object.keys(hashedUser).length > 0,
      properties: Object.keys(properties)
    });

    // Send to TikTok Events API
    const tiktokResponse = await fetch(`https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/event/track/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const responseData = await tiktokResponse.json();

    if (tiktokResponse.ok && responseData.code === 0) {
      console.log('✅ TikTok Events API success:', responseData);
      res.json({ success: true, data: responseData });
    } else {
      console.error('❌ TikTok Events API error:', responseData);
      res.status(tiktokResponse.status || 500).json({
        success: false,
        error: responseData.message || 'TikTok API error',
        details: responseData
      });
    }

  } catch (error) {
    console.error('TikTok Events API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send event to TikTok',
      message: error.message
    });
  }
}

// Helper functions
function hashSHA256(input) {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '127.0.0.1';
}

function needsContents(event) {
  const commerceEvents = [
    'ViewContent', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo',
    'Purchase', 'PlaceAnOrder', 'Subscribe', 'CompleteRegistration'
  ];
  return commerceEvents.includes(event);
}