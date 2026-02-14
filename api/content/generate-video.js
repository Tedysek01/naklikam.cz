import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase-admin.js';
import admin from '../lib/firebase-admin.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Ultra-professional video generation prompts with advanced cinematography and storytelling psychology
const videoPrompts = {
  'promo': (description, quality, script) => `
    COMMERCIAL VIDEO BRIEF: Professional Promotional Content
    
    PROJECT OVERVIEW: ${description}
    PRODUCTION QUALITY: ${quality} (${quality === 'fast' ? '8-second optimized generation' : '8-second premium cinematic quality'})
    SCRIPT/SCENARIO: ${script || 'Standard promotional narrative structure'}
    
    CINEMATOGRAPHIC MASTERCLASS:
    
    FUNDAMENTAL REQUIREMENTS:
    ✓ **DURATION**: Exactly 8 seconds of engaging content
    ✓ **ASPECT RATIO**: 16:9 landscape for maximum platform compatibility
    ✓ **RESOLUTION**: 1080p minimum, 4K preferred for premium quality
    ✓ **FRAME RATE**: 30fps for smooth professional playback
    ✓ **AUDIO-VISUAL SYNC**: Visual beats aligned with implied audio rhythm
    
    STORYTELLING STRUCTURE (8-second narrative arc):
    **SECONDS 1-2**: HOOK - Immediate attention grabber
    - Quick establishing shot or intriguing visual
    - Problem identification or curiosity trigger
    - Dynamic opening that stops scrolling
    
    **SECONDS 3-5**: REVEAL - Solution presentation  
    - Product/service showcase in action
    - Transformation or benefit demonstration
    - Professional execution and quality display
    
    **SECONDS 6-8**: PAYOFF - Call to action and branding
    - Clear outcome or result achieved
    - Brand logo integration (final 1-2 seconds)
    - Compelling next step indication
    
    ${quality === 'quality' ? `
    PREMIUM CINEMATOGRAPHY SPECIFICATIONS:
    - **CAMERA WORK**: Professional movement (dollys, tracking, smooth transitions)
    - **LIGHTING DESIGN**: Cinematic three-point lighting with color grading
    - **COMPOSITION**: Advanced framing techniques (rule of thirds, leading lines)
    - **COLOR PALETTE**: Professionally color-graded with brand consistency
    - **VISUAL EFFECTS**: Subtle motion graphics, smooth transitions, premium aesthetics
    - **DEPTH OF FIELD**: Strategic focus pulling and bokeh effects
    - **SHOT VARIETY**: Multiple angles and compositions within 8 seconds
    ` : `
    FAST PRODUCTION SPECIFICATIONS:
    - **CAMERA WORK**: Clean, stable shots with efficient transitions
    - **LIGHTING**: Natural, well-exposed lighting with good contrast
    - **COMPOSITION**: Solid framing with clear subject focus
    - **COLOR**: Consistent, professional color balance
    - **TRANSITIONS**: Simple but effective cuts and fades
    - **FOCUS**: Sharp main subjects with appropriate background treatment
    `}
    
    BUSINESS PSYCHOLOGY INTEGRATION:
    - **TRUST SIGNALS**: Professional environments, quality materials, satisfied customers
    - **ASPIRATION**: Desired lifestyle or business outcome visualization  
    - **SOCIAL PROOF**: Groups of people, testimonial moments, community aspects
    - **URGENCY**: Time-sensitive elements without being pushy
    - **AUTHORITY**: Expert positioning through professional presentation
    
    MARKETING CONVERSION ELEMENTS:
    1. **CREDIBILITY MARKERS**: Professional settings, quality equipment, satisfied customers
    2. **BENEFIT VISUALIZATION**: Clear before/after or transformation moments
    3. **EMOTIONAL CONNECTION**: Relatable scenarios and human moments
    4. **CALL-TO-ACTION**: Visual cues directing to next steps
    5. **BRAND INTEGRATION**: Logo, colors, and brand elements naturally woven in
    
    CZECH MARKET CONSIDERATIONS:
    - Prefer authentic, non-flashy presentations over American-style hype
    - Value craftsmanship and quality demonstration
    - Conservative professional aesthetic in B2B contexts
    - Family and community values in consumer content
    - Emphasis on reliability and long-term thinking
    
    TECHNICAL VIDEO SPECIFICATIONS:
    - **CODEC**: H.264 for universal compatibility
    - **COLOR SPACE**: Rec. 709 for standard display
    - **AUDIO CONSIDERATION**: Visual rhythm suitable for background music/voiceover
    - **COMPRESSION**: Optimized for web delivery while maintaining quality
    - **PLATFORM OPTIMIZATION**: Suitable for social media, websites, presentations
    
    VISUAL STORYTELLING TECHNIQUES:
    - **SHOW DON'T TELL**: Visual demonstration over text-heavy explanations
    - **EMOTIONAL ARC**: Problem → Solution → Relief/Joy progression
    - **VISUAL METAPHORS**: Symbolic representations of business benefits
    - **PACING CONTROL**: Strategic fast/slow moments for maximum impact
    - **VIEWER JOURNEY**: Guide eyes through composition toward key messages
    
    OUTPUT: Professional 8-second promotional video that immediately communicates value, builds trust, and motivates action while maintaining sophisticated visual appeal and brand consistency.
  `,

  'social-reel': (description, quality, script) => `
    SOCIAL MEDIA REEL BRIEF: High-Engagement Vertical Content
    
    REEL CONCEPT: ${description}
    PRODUCTION LEVEL: ${quality} (${quality === 'fast' ? 'Optimized for quick engagement' : 'Premium social media quality'})
    CONTENT STRATEGY: ${script || 'Standard engaging social reel structure'}
    
    SOCIAL MEDIA PSYCHOLOGY MASTERY:
    
    PLATFORM OPTIMIZATION:
    ✓ **ASPECT RATIO**: 9:16 vertical (Instagram/TikTok/Facebook Reels)
    ✓ **MOBILE-FIRST**: Optimized for smartphone viewing
    ✓ **THUMB-STOPPING POWER**: First frame must interrupt scroll
    ✓ **ALGORITHM FRIENDLY**: High engagement potential elements
    ✓ **ACCESSIBILITY**: Clear visuals without required audio
    
    8-SECOND VIRAL STRUCTURE:
    **SECONDS 1-2**: HOOK - Pattern interrupt
    - Surprising visual or unexpected moment
    - Question setup or curiosity gap creation
    - Movement or action that demands attention
    - Text overlay with compelling statement
    
    **SECONDS 3-5**: ENGAGEMENT - Value delivery
    - Educational tip or behind-the-scenes insight
    - Transformation demonstration
    - Problem-solving in action
    - Relatable business scenario
    
    **SECONDS 6-8**: RETENTION - Payoff and share-ability  
    - Satisfying conclusion or reveal
    - Actionable takeaway or next step
    - Share-worthy moment that begs comments
    - Brand integration that feels natural
    
    ${quality === 'quality' ? `
    PREMIUM SOCIAL CONTENT SPECIFICATIONS:
    - **VISUAL DYNAMICS**: Quick cuts, dynamic transitions, engaging motion
    - **COLOR GRADING**: Vibrant, Instagram-friendly color palette
    - **TYPOGRAPHY**: Bold, readable text overlays with brand consistency
    - **EFFECTS**: Trendy visual effects and smooth animations
    - **COMPOSITION**: Creative framing that stands out in feeds
    - **AUDIO SYNC**: Visual beats timed for popular music integration
    - **TREND INTEGRATION**: Current social media aesthetic preferences
    ` : `
    FAST SOCIAL PRODUCTION:
    - **CLEAN VISUALS**: Sharp, well-lit content with good contrast
    - **SIMPLE EFFECTS**: Effective but not overly complex transitions
    - **READABLE TEXT**: Clear overlays with good font choices
    - **CONSISTENT STYLE**: Cohesive look throughout the 8 seconds
    - **ENGAGING PACE**: Appropriate timing for social media attention spans
    `}
    
    ENGAGEMENT PSYCHOLOGY TRIGGERS:
    - **CURIOSITY GAPS**: Incomplete information that compels watching to end
    - **PATTERN INTERRUPTS**: Unexpected visuals that stop scrolling
    - **SOCIAL PROOF**: Other people using/enjoying the product/service
    - **TRANSFORMATION**: Clear before/after or improvement moments
    - **RELATABILITY**: Common experiences or problems addressed
    
    VIRAL CONTENT ELEMENTS:
    1. **HOOK STRENGTH**: First 0.5 seconds determine watch completion
    2. **VALUE DENSITY**: Maximum useful information in minimal time
    3. **EMOTIONAL PAYOFF**: Satisfaction, surprise, or inspiration delivered
    4. **SHARE MOTIVATION**: Reason to show this to someone else
    5. **COMMENT BAIT**: Elements that naturally generate responses
    
    CZECH SOCIAL MEDIA BEHAVIOR:
    - Prefer authentic over overly produced content
    - Value practical tips and real-world applications
    - Respond well to family/community themes
    - Appreciate quality craftsmanship demonstrations
    - Engage with educational rather than purely promotional content
    
    MOBILE VIEWING OPTIMIZATION:
    - **TEXT SIZE**: Large enough for small screens
    - **CONTRAST**: High contrast for various viewing conditions
    - **FOCAL POINTS**: Clear visual hierarchy for quick comprehension
    - **MOTION**: Appropriate speed for mobile viewing
    - **THUMB ZONE**: Key elements in easy-to-tap areas
    
    ALGORITHM OPTIMIZATION:
    - **COMPLETION RATE**: Structure to encourage full 8-second viewing
    - **ENGAGEMENT TRIGGERS**: Elements that prompt likes, comments, shares
    - **REWATCHABILITY**: Details that benefit from multiple views
    - **PLATFORM NATIVE**: Feels natural to each social platform
    - **TRENDING ELEMENTS**: Subtle integration of current trends
    
    OUTPUT: Highly engaging 8-second social media reel optimized for maximum reach, engagement, and business results across all major social platforms.
  `,

  'intro': (description, quality, script) => `
    BRAND INTRO/LOGO ANIMATION BRIEF: Professional Brand Identity Motion
    
    ANIMATION CONCEPT: ${description}
    EXECUTION LEVEL: ${quality} (${quality === 'fast' ? 'Clean professional animation' : 'Premium brand motion design'})
    BRAND ELEMENTS: ${script || 'Standard professional intro sequence'}
    
    BRAND IDENTITY ANIMATION MASTERY:
    
    CORE OBJECTIVES:
    ✓ **BRAND MEMORABILITY**: Distinctive visual identity that sticks
    ✓ **PROFESSIONAL CREDIBILITY**: Sophisticated execution that builds trust
    ✓ **VERSATILE USAGE**: Works across presentations, videos, social media
    ✓ **LOADING OPTIMIZATION**: Engages viewers during wait times
    ✓ **BRAND CONSISTENCY**: Reinforces visual identity and values
    
    8-SECOND INTRO STRUCTURE:
    **SECONDS 1-3**: BUILD-UP - Anticipation creation
    - Logo elements entering frame
    - Brand colors establishing palette
    - Professional typography emergence
    - Smooth, confident motion graphics
    
    **SECONDS 4-6**: REVEAL - Brand presentation
    - Complete logo assembly
    - Company name prominence
    - Brand message or tagline
    - Professional aesthetic completion
    
    **SECONDS 7-8**: RESOLUTION - Final impression
    - Clean final composition
    - Memorable brand positioning
    - Transition-ready ending
    - Professional completion
    
    ${quality === 'quality' ? `
    PREMIUM BRAND ANIMATION SPECIFICATIONS:
    - **MOTION GRAPHICS**: Sophisticated easing, professional timing curves
    - **3D ELEMENTS**: Dimensional logo treatment with realistic lighting
    - **COLOR DYNAMICS**: Advanced color grading and brand palette mastery
    - **TYPOGRAPHY**: Premium font choices with perfect kerning and spacing
    - **EFFECTS**: Subtle particle systems, light effects, premium touches
    - **COMPOSITION**: Cinematic framing with professional depth
    - **BRAND INTEGRATION**: Seamless incorporation of all brand elements
    ` : `
    CLEAN PROFESSIONAL ANIMATION:
    - **SMOOTH MOTION**: Well-timed animations with natural easing
    - **BRAND COLORS**: Consistent application of brand palette
    - **CLEAR TYPOGRAPHY**: Professional font treatment and readability
    - **SIMPLE EFFECTS**: Effective but not overly complex animations
    - **SOLID COMPOSITION**: Professional framing and element placement
    `}
    
    BRAND PSYCHOLOGY PRINCIPLES:
    - **AUTHORITY**: Professional execution demonstrates competence
    - **CONSISTENCY**: Reinforces brand recognition and reliability
    - **MEMORABILITY**: Distinctive visual elements aid brand recall
    - **TRUST**: Quality animation suggests quality service/products
    - **DIFFERENTIATION**: Unique approach sets brand apart from competitors
    
    PROFESSIONAL APPLICATION CONTEXTS:
    1. **PRESENTATION OPENINGS**: Conference and client meeting intros
    2. **VIDEO CONTENT**: YouTube, social media, marketing videos
    3. **WEBSITE HEADERS**: Loading animations and hero sections
    4. **EMAIL SIGNATURES**: Animated logos for digital communication
    5. **TRADE SHOWS**: Display screens and promotional materials
    
    CZECH BUSINESS CULTURE ADAPTATION:
    - Conservative, professional aesthetic preferences
    - Quality craftsmanship emphasis over flashy effects
    - Reliability and stability visual communication
    - Regional pride integration where appropriate
    - Long-term relationship building through consistent branding
    
    TECHNICAL ANIMATION SPECIFICATIONS:
    - **VECTOR GRAPHICS**: Scalable elements for multiple size usage
    - **ALPHA CHANNELS**: Transparent backgrounds for versatile placement
    - **LOOP CAPABILITY**: Seamless repetition option for extended display
    - **COMPRESSION**: Optimized file sizes without quality loss
    - **FORMAT EXPORT**: Multiple formats (MP4, GIF, MOV) for various uses
    
    BRAND EQUITY BUILDING ELEMENTS:
    - **VISUAL CONSISTENCY**: Reinforces brand recognition across touchpoints
    - **QUALITY ASSOCIATION**: Professional animation = professional business
    - **EMOTIONAL CONNECTION**: Brand personality expression through motion
    - **COMPETITIVE ADVANTAGE**: Distinctive visual identity differentiation
    - **CUSTOMER CONFIDENCE**: Polished presentation builds trust
    
    OUTPUT: Professional 8-second brand intro/logo animation that elevates brand perception, builds credibility, and creates memorable brand experiences across all business applications.
  `,

  'product': (description, quality, script) => `
    PRODUCT SHOWCASE VIDEO BRIEF: Commercial Product Demonstration
    
    PRODUCT FOCUS: ${description}
    PRODUCTION QUALITY: ${quality} (${quality === 'fast' ? 'Efficient product showcase' : 'Premium commercial product video'})
    DEMONSTRATION PLAN: ${script || 'Standard product presentation and benefits showcase'}
    
    COMMERCIAL PRODUCT VIDEO MASTERY:
    
    SALES OBJECTIVES:
    ✓ **DESIRE CREATION**: Make viewers want to own/use the product
    ✓ **FEATURE COMMUNICATION**: Clear demonstration of key capabilities
    ✓ **QUALITY DEMONSTRATION**: Visual proof of craftsmanship and value
    ✓ **USAGE CLARIFICATION**: How product fits into customer's life
    ✓ **PURCHASE MOTIVATION**: Compelling reasons to buy now
    
    8-SECOND PRODUCT STORY:
    **SECONDS 1-2**: PRODUCT INTRODUCTION - First impression
    - Hero shot of product in ideal setting
    - Immediate quality and value communication
    - Professional lighting showcasing materials
    - Brand and product name clear visibility
    
    **SECONDS 3-5**: FEATURE DEMONSTRATION - Key benefits in action
    - Product functionality clearly displayed
    - User interaction showing ease of use
    - Problem-solving capabilities highlighted
    - Transformation or improvement shown
    
    **SECONDS 6-8**: LIFESTYLE INTEGRATION - Outcome visualization
    - Product in real-world usage context
    - Customer satisfaction or success implied
    - Brand positioning and next steps
    - Call-to-action or availability information
    
    ${quality === 'quality' ? `
    PREMIUM PRODUCT CINEMATOGRAPHY:
    - **PROFESSIONAL LIGHTING**: Three-point setup with product-specific adjustments
    - **MACRO DETAILS**: Close-up shots revealing quality and craftsmanship
    - **MULTIPLE ANGLES**: Dynamic camera movement showing all key features
    - **COLOR GRADING**: Product colors accurate while enhancing appeal
    - **ENVIRONMENT**: Carefully crafted settings that enhance product desirability
    - **USER INTERACTION**: Professional talent demonstrating product benefits
    - **MOTION GRAPHICS**: Product specs, benefits, and pricing overlays
    ` : `
    EFFICIENT PRODUCT SHOWCASE:
    - **CLEAR VISIBILITY**: Well-lit product with good contrast and detail
    - **KEY FEATURES**: Focus on most important product capabilities
    - **SIMPLE STAGING**: Clean, professional presentation environment
    - **NATURAL USAGE**: Realistic demonstration of product function
    - **BRAND CONSISTENCY**: Proper logo and brand element integration
    `}
    
    VISUAL SELLING PSYCHOLOGY:
    - **ASPIRATION TRIGGER**: Product shown in desirable lifestyle context
    - **QUALITY CUES**: Professional presentation implies product quality
    - **SOCIAL PROOF**: Multiple users or testimonial moments
    - **Scarcity HINTS**: Limited availability or special offer indications
    - **AUTHORITY**: Expert usage or professional endorsement
    
    E-COMMERCE OPTIMIZATION:
    1. **MAIN BENEFIT**: Primary value proposition clearly demonstrated
    2. **USE CASE**: Realistic scenario showing product solving problems
    3. **QUALITY INDICATORS**: Materials, construction, professional finish
    4. **SIZE/SCALE**: Context for understanding product dimensions
    5. **BRAND TRUST**: Professional presentation building purchase confidence
    
    CZECH CONSUMER PSYCHOLOGY:
    - Value for money demonstration over luxury positioning
    - Quality and durability emphasis
    - Practical application in everyday contexts
    - Conservative aesthetic preferences
    - Family and household benefit focus where applicable
    
    TECHNICAL PRODUCT VIDEO SPECS:
    - **COLOR ACCURACY**: True product colors for accurate representation
    - **FOCUS CONTROL**: Sharp product details with appropriate depth of field
    - **MOTION SMOOTHNESS**: Steady camera work for professional appearance
    - **AUDIO VISUAL**: Product sounds (if applicable) sync with visual
    - **COMPRESSION**: Optimized for web/social without quality loss
    
    CONVERSION OPTIMIZATION ELEMENTS:
    - **IMMEDIATE BENEFIT**: Value visible within first 2 seconds
    - **Feature HIGHLIGHT**: Most important capabilities showcased
    - **USAGE CONTEXT**: How product improves customer's situation
    - **TRUST BUILDING**: Professional presentation reducing purchase risk
    - **ACTION ORIENTED**: Clear next steps for interested prospects
    
    MULTI-PLATFORM USAGE:
    - **E-commerce**: Product pages and shopping platform integration
    - **Social Media**: Shareable content driving traffic to sales pages
    - **Email Marketing**: Embedded video for product announcements
    - **Website**: Homepage, landing pages, product galleries
    - **Trade Shows**: Display screens and presentation materials
    
    OUTPUT: Professional 8-second product showcase video that transforms features into desires, demonstrates quality and value, and drives purchase decisions across all marketing channels.
  `,

  'testimonial': (description, quality, script) => `
    CUSTOMER TESTIMONIAL VIDEO BRIEF: Authentic Social Proof Content
    
    TESTIMONIAL FOCUS: ${description}
    PRODUCTION VALUE: ${quality} (${quality === 'fast' ? 'Authentic customer stories' : 'Premium testimonial cinematography'})
    CUSTOMER NARRATIVE: ${script || 'Standard customer success story structure'}
    
    TESTIMONIAL VIDEO PSYCHOLOGY MASTERY:
    
    CREDIBILITY OBJECTIVES:
    ✓ **AUTHENTICITY**: Real customer experiences that feel genuine
    ✓ **RELATABILITY**: Stories prospects can see themselves in
    ✓ **SPECIFICITY**: Concrete results and measurable outcomes
    ✓ **EMOTIONAL CONNECTION**: Human stories that resonate deeply
    ✓ **TRUST BUILDING**: Third-party validation of business claims
    
    8-SECOND TESTIMONIAL STRUCTURE:
    **SECONDS 1-2**: CUSTOMER INTRODUCTION - Credibility establishment
    - Real customer in natural environment
    - Professional but approachable presentation
    - Industry context or role identification
    - Immediate authenticity and relatability
    
    **SECONDS 3-5**: PROBLEM & SOLUTION - Story development
    - Challenge or need customer faced
    - How business provided solution
    - Specific results or improvements gained
    - Emotional or practical transformation
    
    **SECONDS 6-8**: RECOMMENDATION - Social proof delivery
    - Clear endorsement of business/product
    - Specific benefits other customers would receive
    - Confidence and satisfaction expression
    - Brand association and next steps
    
    ${quality === 'quality' ? `
    PREMIUM TESTIMONIAL CINEMATOGRAPHY:
    - **NATURAL LIGHTING**: Soft, flattering light that maintains authenticity
    - **ENVIRONMENTAL CONTEXT**: Customer's real workplace or relevant setting
    - **MULTIPLE CAMERA ANGLES**: Professional coverage without feeling staged
    - **AUDIO QUALITY**: Crystal clear customer voice with ambient sound
    - **B-ROLL INTEGRATION**: Supporting visuals showing results or process
    - **COLOR GRADING**: Professional look while maintaining natural feel
    - **GRAPHICS INTEGRATION**: Customer name, title, company, results display
    ` : `
    AUTHENTIC TESTIMONIAL PRODUCTION:
    - **CLEAR AUDIO**: Customer voice clearly audible and understandable
    - **GOOD LIGHTING**: Natural or simple lighting setup for clear visibility
    - **STABLE CAMERA**: Professional framing without distracting movement
    - **NATURAL SETTING**: Customer's actual environment or appropriate location
    - **GENUINE EXPRESSION**: Unscripted, authentic customer communication
    `}
    
    PSYCHOLOGICAL TRUST FACTORS:
    - **AUTHENTICITY**: Real people in real situations, not actors
    - **SPECIFICITY**: Concrete details and measurable results
    - **RELATABILITY**: Customers prospects can identify with
    - **EMOTIONAL TRUTH**: Genuine satisfaction and enthusiasm
    - **PEER VALIDATION**: Same industry or demographic endorsement
    
    TESTIMONIAL CONVERSION ELEMENTS:
    1. **PROBLEM IDENTIFICATION**: Issues prospects also face
    2. **SOLUTION CLARITY**: How business addressed specific needs
    3. **RESULT MEASUREMENT**: Quantifiable improvements achieved
    4. **PROCESS SATISFACTION**: Positive experience working together
    5. **RECOMMENDATION STRENGTH**: Clear endorsement for similar prospects
    
    CZECH CULTURAL CONSIDERATIONS:
    - Preference for modest, sincere testimonials over exaggerated claims
    - Focus on practical benefits and long-term relationships
    - Appreciation for craftsmanship and attention to detail
    - Conservative professional presentation
    - Community and relationship value emphasis
    
    AUTHENTICITY SAFEGUARDS:
    - **REAL CUSTOMERS**: No actors or paid testimonials
    - **UNSCRIPTED**: Natural language and personal expression
    - **SPECIFIC DETAILS**: Concrete examples and measurable results
    - **CONTEXT**: Relevant industry, business size, or demographic match
    - **DISCLOSURE**: Transparent about customer relationship where required
    
    SOCIAL PROOF OPTIMIZATION:
    - **CREDIBILITY MARKERS**: Customer title, company, industry context
    - **RESULT SPECIFICITY**: Numbers, timeframes, measurable improvements
    - **EMOTIONAL RESONANCE**: Genuine satisfaction and enthusiasm
    - **PEER RELEVANCE**: Customers similar to target prospects
    - **PROBLEM ALIGNMENT**: Challenges that match prospect pain points
    
    MULTI-USE CONSIDERATIONS:
    - **Website Integration**: About page, testimonial sections, case studies
    - **Sales Process**: Proposal support and objection handling
    - **Social Media**: Authentic content for business social profiles
    - **Email Marketing**: Newsletter features and prospect nurturing
    - **Presentations**: Conference talks and client presentations
    
    OUTPUT: Compelling 8-second customer testimonial that builds immediate trust, demonstrates real value, and provides authentic social proof that converts prospects into customers through genuine peer validation.
  `
};

export default async function handler(req, res) {
  // Set timeout close to Vercel limit (5 minutes)
  req.setTimeout(290000);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, quality, description, script, userId } = req.body;

  if (!type || !description || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check user credits - Keep existing pricing (29 fast / 144 quality)
    let userData = {};
    const creditsNeeded = quality === 'fast' ? 29 : 144;
    
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      userData = userDoc.data() || {};
    } catch (firebaseError) {
      console.error('Firebase user check error:', firebaseError);
      // Allow operation to continue - will attempt credit deduction anyway
      userData = {};
    }

    if (!userData.subscription || userData.subscription.credits < creditsNeeded) {
      return res.status(403).json({ 
        error: 'Insufficient credits',
        message: `Pro tuto akci potřebujete ${creditsNeeded} kreditů. Máte pouze ${userData.subscription?.credits || 0}.`
      });
    }

    // Generate professional video prompt
    const professionalPrompt = videoPrompts[type](description, quality, script);
    
    // Don't deduct credits yet - wait for successful generation
    let creditsDeducted = false;

    try {
      // Timeout protection - Vercel has 5-minute function limit
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GENERATION_TIMEOUT')), 280000) // 4 minutes 40 seconds
      );
      
      // Actual Veo 3 generation call would go here
      // For now, we'll simulate with enhanced processing
      const processingPromise = new Promise(async (resolve, reject) => {
        try {
          // Use Google Veo 3 API for video generation
          const modelName = quality === 'fast' ? 'veo-3.0-fast' : 'veo-3.0-generate-preview';
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const veoPrompt = `${professionalPrompt}

VEO 3 SPECIFIC INSTRUCTIONS:
- Generate exactly 8 seconds of video content
- Professional business quality suitable for commercial use
- ${quality === 'fast' ? 'Optimized for speed while maintaining quality' : 'Premium cinematic quality with advanced visual effects'}
- Include synchronized audio for complete multimedia experience
- Optimize for Czech business market preferences`;

          const result = await model.generateVideos({
            prompt: veoPrompt,
            config: {
              aspectRatio: type === 'social-reel' || type === 'story' ? '9:16' : '16:9',
              duration: 8, // seconds
              generateAudio: true,
              quality: quality === 'fast' ? 'STANDARD' : 'HIGH'
            }
          });

          // Wait for video generation to complete
          let operation = result;
          while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            // In production, you would poll the operation status
            operation = await genAI.operations.get(operation.name);
          }

          const videoUrl = operation.result.generatedVideos[0].video;
          resolve(videoUrl);
          
        } catch (apiError) {
          reject(apiError);
        }
      });

      const videoUrl = await Promise.race([processingPromise, timeoutPromise]);

      // Always attempt to deduct credits using FieldValue.increment
      try {
        await db.collection('users').doc(userId).update({
          'subscription.credits': admin.firestore.FieldValue.increment(-creditsNeeded)
        });
        creditsDeducted = true;
      } catch (creditError) {
        console.error('Firebase credit deduction error:', creditError);
        // Continue - service works even if deduction fails
      }

      // Log successful generation
      try {
        await db.collection('content_generations').add({
          userId,
          type: 'video',
          subType: type,
          quality,
          description,
          script,
          prompt: professionalPrompt,
          creditsUsed: creditsNeeded,
          model: `veo-3-${quality}`,
          promptVersion: 'professional-v1',
          success: true,
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Firebase generation log error:', logError);
        // Continue - logging failure shouldn't affect response
      }

      res.status(200).json({ 
        videoUrl,
        creditsUsed: creditsNeeded,
        message: 'Video vygenerováno pomocí Google Veo 3 AI',
        note: 'Profesionální kvalita s nativně generovaným zvukem'
      });

    } catch (error) {
      if (error.message === 'GENERATION_TIMEOUT') {
        // Log timeout attempt (no credits deducted)
        try {
          await db.collection('content_generations').add({
            userId,
            type: 'video',
            subType: type,
            quality,
            description,
            script,
            creditsUsed: 0, // No credits charged for timeout
            success: false,
            errorReason: 'timeout',
            createdAt: new Date()
          });
        } catch (logError) {
          console.error('Firebase timeout log error:', logError);
        }

        return res.status(408).json({ 
          error: 'Video generation timed out',
          message: 'Video generování trvalo příliš dlouho. Kredity nebyly strženy. Zkuste to prosím znovu nebo kontaktujte podporu.',
          creditsRefunded: true,
          creditsUsed: 0
        });
      }
      
      // Other errors - refund credits if they were deducted
      if (creditsDeducted) {
        try {
          await db.collection('users').doc(userId).update({
            'subscription.credits': admin.firestore.FieldValue.increment(creditsNeeded)
          });
        } catch (refundError) {
          console.error('Firebase credit refund error:', refundError);
        }
      }

      // Log failed generation
      try {
        await db.collection('content_generations').add({
          userId,
          type: 'video',
          subType: type,
          quality,
          description,
          script,
          creditsUsed: 0, // No credits charged for failures
          success: false,
          error: error.message,
          creditsRefunded: creditsDeducted,
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Firebase error log error:', logError);
      }

      console.error('Error generating video:', error);
      res.status(500).json({ 
        error: 'Failed to generate video',
        creditsRefunded: creditsDeducted,
        message: creditsDeducted ? 'Kredity byly vráceny.' : 'Kredity nebyly strženy.'
      });
    }
  } catch (error) {
    console.error('Error in video generation handler:', error);
    
    // Log handler error
    try {
      await db.collection('content_generations').add({
        userId: userId || 'unknown',
        type: 'video',
        subType: type || 'unknown',
        quality: quality || 'unknown',
        description: description || 'unknown',
        script: script || '',
        creditsUsed: 0,
        success: false,
        error: error.message,
        createdAt: new Date()
      });
    } catch (logError) {
      console.error('Firebase handler error log error:', logError);
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Nepodařilo se zpracovat požadavek na generování videa. Zkuste to prosím znovu. Kredity nebyly strženy.'
    });
  }
}