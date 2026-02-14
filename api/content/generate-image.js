import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase-admin.js';
import admin from '../lib/firebase-admin.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Ultra-professional image generation prompts with advanced visual composition psychology
const imagePrompts = {
  'hero': (description, style, additionalInfo) => `
    VISUAL BRIEF: Hero Image for Premium Web Header
    
    PRIMARY SUBJECT: ${description}
    VISUAL STYLE: ${style}
    SPECIAL REQUIREMENTS: ${additionalInfo || 'Standard professional hero image approach'}
    
    COMPOSITION MASTERCLASS:
    - **ASPECT RATIO**: 16:9 landscape optimized for web headers
    - **FOCAL POINT**: Apply rule of thirds for subject placement
    - **DEPTH OF FIELD**: Shallow focus on main subject, subtle background blur
    - **VISUAL HIERARCHY**: Clear primary → secondary → tertiary elements
    
    PROFESSIONAL SPECIFICATIONS:
    ✓ High-resolution 1920x1080px minimum
    ✓ Web-optimized color palette (avoid pure blacks/whites)
    ✓ Sufficient contrast for text overlay capability
    ✓ Professional lighting (golden hour or studio setup)
    ✓ Brand-safe imagery suitable for business use
    
    STYLE-SPECIFIC GUIDELINES:
    ${style === 'realistic' ? `
    PHOTOREALISTIC EXECUTION:
    - Cinema-quality lighting with natural shadows
    - Authentic materials and textures
    - Professional photography composition
    - Real-world environmental context
    - High dynamic range (HDR) aesthetic
    ` : style === 'illustration' ? `
    DIGITAL ILLUSTRATION MASTERY:
    - Vector-style clean lines and shapes  
    - Harmonious color palette (max 5 colors)
    - Scalable graphic elements
    - Modern flat design with subtle gradients
    - Icon-friendly visual language
    ` : style === 'minimal' ? `
    MINIMALIST DESIGN PRINCIPLES:
    - Abundant white/negative space (60%+ composition)
    - Single focal point with clear hierarchy
    - Limited color palette (2-3 colors maximum)
    - Clean typography integration space
    - Geometric precision and alignment
    ` : style === 'vintage' ? `
    VINTAGE AESTHETIC TREATMENT:
    - Warm, muted color grading
    - Film grain and subtle texture overlays
    - Classic typography era elements
    - Nostalgic mood and atmosphere
    - Retro color palette (sepia, burgundy, cream)
    ` : `
    MODERN CONTEMPORARY STYLE:
    - Bold, saturated colors with contrast
    - Clean geometric shapes and lines
    - Tech-forward aesthetic elements
    - Premium material suggestions (glass, metal)
    - Current design trend integration
    `}
    
    BUSINESS PSYCHOLOGY INTEGRATION:
    - Evoke trust and professionalism
    - Create aspirational but achievable context
    - Include subtle success/achievement visual cues
    - Maintain cultural appropriateness for Czech market
    - Balance modernity with reliability signals
    
    TECHNICAL REQUIREMENTS:
    - Optimized for fast web loading
    - Mobile-responsive visual clarity
    - Print-quality resolution capability
    - Color profile: sRGB for web consistency
    - Format compatibility: JPEG for photos, PNG for graphics
    
    OUTPUT: Professional hero image that immediately communicates quality, trustworthiness, and business value while supporting optimal user experience and conversion goals.
  `,

  'icon': (description, style, additionalInfo) => `
    ICON DESIGN BRIEF: Professional Service/Product Symbol
    
    CONCEPT: ${description}
    VISUAL APPROACH: ${style}
    BRAND CONTEXT: ${additionalInfo || 'Clean, professional business icon'}
    
    ICON DESIGN MASTERY:
    
    FUNDAMENTAL PRINCIPLES:
    ✓ **SCALABILITY**: Perfect clarity from 16px to 512px
    ✓ **RECOGNITION**: Instantly identifiable at thumbnail size  
    ✓ **UNIVERSALITY**: Culturally neutral and inclusive
    ✓ **MEMORABILITY**: Distinctive shape and character
    ✓ **CONSISTENCY**: Cohesive with business brand identity
    
    COMPOSITION STRUCTURE:
    - **GRID SYSTEM**: Align to 24px grid for pixel perfection
    - **OPTICAL BALANCE**: Visual weight distribution, not mathematical center
    - **BREATHING ROOM**: 15-20% margin for comfortable spacing
    - **FOCAL HIERARCHY**: Single primary element with supportive details
    
    STYLE-SPECIFIC EXECUTION:
    ${style === 'realistic' ? `
    REALISTIC ICON TREATMENT:
    - Photographic detail with icon simplification
    - Natural lighting and shadow effects
    - Realistic materials and textures
    - 3D depth with isometric perspective options
    - Professional photography aesthetic in icon form
    ` : style === 'illustration' ? `
    ILLUSTRATED ICON APPROACH:
    - Hand-drawn aesthetic with digital precision
    - Consistent line weight and style
    - Friendly, approachable character
    - Artistic flair while maintaining clarity
    - Custom illustration elements
    ` : style === 'minimal' ? `
    MINIMAL ICON DESIGN:
    - Single-color or two-tone maximum
    - Essential elements only, remove all decoration
    - Geometric precision and mathematical harmony
    - Negative space utilization
    - Universal symbol recognition
    ` : style === 'vintage' ? `
    VINTAGE ICON STYLING:
    - Classic era design references (1920s-1970s)
    - Weathered/aged texture effects
    - Traditional craftsmanship aesthetic
    - Heritage brand feeling
    - Ornate details appropriate to scale
    ` : `
    MODERN ICON EXECUTION:
    - Current design trend integration
    - Bold, confident visual presence
    - Tech-forward aesthetic language
    - Premium finish and materials
    - Contemporary color schemes
    `}
    
    COLOR PSYCHOLOGY:
    - Primary color should reinforce brand message
    - Consider color accessibility (contrast ratios)
    - Cultural color meanings in Czech context
    - Industry standard color associations
    - Multi-format color adaptability
    
    BUSINESS APPLICATION CONSIDERATIONS:
    - Website favicon compatibility
    - Social media profile picture clarity
    - Business card and print material usage
    - Mobile app icon standards
    - Professional presentation contexts
    
    TECHNICAL SPECIFICATIONS:
    - Square format 1:1 aspect ratio
    - Vector-based for infinite scalability
    - Multiple size exports: 16, 32, 64, 128, 256, 512px
    - Background transparency capability
    - High contrast for accessibility compliance
    
    OUTPUT: Professional service icon that functions perfectly across all business applications while maintaining visual impact and brand consistency at every scale.
  `,

  'banner': (description, style, additionalInfo) => `
    SOCIAL MEDIA BANNER BRIEF: High-Engagement Visual Content
    
    MESSAGE/CAMPAIGN: ${description}
    AESTHETIC DIRECTION: ${style}
    CAMPAIGN SPECIFICS: ${additionalInfo || 'General business promotion and brand awareness'}
    
    SOCIAL MEDIA PSYCHOLOGY MASTERY:
    
    ATTENTION-GRABBING FUNDAMENTALS:
    ✓ **3-SECOND RULE**: Immediate message clarity and visual impact
    ✓ **SCROLL-STOPPING POWER**: Contrasts with typical social media feed
    ✓ **MOBILE-FIRST**: Optimized for smartphone viewing (80% of usage)
    ✓ **PLATFORM OPTIMIZATION**: Native aspect ratios for each channel
    ✓ **ACCESSIBILITY**: High contrast and readable at small sizes
    
    VISUAL HIERARCHY STRATEGY:
    1. **PRIMARY FOCUS** (40% visual weight): Main message/offer
    2. **SECONDARY ELEMENTS** (30% visual weight): Supporting information
    3. **BRANDING** (20% visual weight): Logo and brand colors
    4. **CALL-TO-ACTION** (10% visual weight): Next step instruction
    
    PLATFORM-SPECIFIC OPTIMIZATION:
    - **FACEBOOK**: 1200x630px, text overlay max 20% of image
    - **INSTAGRAM**: 1080x1080px square, story-friendly 9:16 vertical
    - **LINKEDIN**: 1200x627px, professional aesthetic required
    - **GENERAL WEB**: 16:9 landscape for universal compatibility
    
    STYLE-SPECIFIC TREATMENT:
    ${style === 'realistic' ? `
    REALISTIC BANNER EXECUTION:
    - Authentic photography with professional models/settings
    - Real-world business environments and contexts
    - Lifestyle integration showing product/service in use
    - Emotional storytelling through genuine moments
    - High production value with studio lighting
    ` : style === 'illustration' ? `
    ILLUSTRATED BANNER DESIGN:
    - Custom artwork that stands out in feeds
    - Consistent character and brand illustration style
    - Scalable vector graphics for crisp display
    - Playful yet professional visual tone
    - Unique artistic perspective on business messaging
    ` : style === 'minimal' ? `
    MINIMAL BANNER APPROACH:
    - Clean typography as primary design element
    - Strategic use of white space for impact
    - Single powerful image or graphic element
    - Limited color palette for sophistication
    - Focus on message clarity over visual complexity
    ` : style === 'vintage' ? `
    VINTAGE BANNER STYLING:
    - Nostalgic color palettes and design elements
    - Classic typography and layout principles
    - Aged texture and patina effects
    - Heritage brand positioning
    - Timeless aesthetic with modern functionality
    ` : `
    MODERN BANNER DESIGN:
    - Current visual trends and contemporary aesthetics
    - Bold, confident color schemes
    - Geometric shapes and dynamic compositions
    - Tech-forward design language
    - Premium materials and finishes representation
    `}
    
    ENGAGEMENT PSYCHOLOGY TRIGGERS:
    - **CURIOSITY GAP**: Incomplete information that compels clicking
    - **SOCIAL PROOF**: Visual references to community/customers
    - **URGENCY INDICATORS**: Time-sensitive visual elements
    - **BENEFIT VISUALIZATION**: Clear outcome representation
    - **EMOTIONAL CONNECTION**: Relatable scenarios and feelings
    
    CZECH SOCIAL MEDIA BEHAVIOR:
    - Prefer authentic over overly polished content
    - Value family and community connections
    - Respond to local cultural references
    - Appreciate quality and craftsmanship
    - Cautious of "too good to be true" messaging
    
    CONVERSION OPTIMIZATION:
    - Clear visual path to call-to-action
    - Benefit-focused messaging over feature lists
    - Trust signals (testimonials, certifications)
    - Risk reduction elements (guarantees, try-before-buy)
    - Multiple engagement options (like, comment, share, click)
    
    TECHNICAL REQUIREMENTS:
    - High resolution for quality display
    - Fast loading optimized file sizes
    - Brand color consistency across platforms
    - Text legibility on mobile devices
    - Alt text optimization for accessibility
    
    OUTPUT: High-converting social media banner that stops scrolling, communicates value clearly, and drives meaningful engagement within 3-second attention window.
  `,

  'product': (description, style, additionalInfo) => `
    PRODUCT PHOTOGRAPHY BRIEF: Commercial-Grade Visual Marketing
    
    PRODUCT/SERVICE: ${description}
    PHOTOGRAPHIC STYLE: ${style}
    MARKETING CONTEXT: ${additionalInfo || 'E-commerce and general business marketing usage'}
    
    COMMERCIAL PHOTOGRAPHY EXCELLENCE:
    
    CORE OBJECTIVES:
    ✓ **DESIRE CREATION**: Make viewers want to own/use the product
    ✓ **QUALITY COMMUNICATION**: Convey premium value and craftsmanship
    ✓ **FEATURE CLARITY**: Highlight key benefits and unique selling points
    ✓ **LIFESTYLE INTEGRATION**: Show product in realistic usage scenarios
    ✓ **TRUST BUILDING**: Professional presentation that eliminates purchase doubts
    
    COMPOSITION MASTERY:
    - **HERO ANGLE**: Primary viewing angle that showcases best features
    - **LIGHTING SETUP**: Professional three-point lighting or natural window light
    - **BACKGROUND CHOICE**: Complementary but non-competing backdrop
    - **PROP INTEGRATION**: Lifestyle elements that enhance without distraction
    - **SCALE REFERENCE**: Context clues for size and proportion understanding
    
    STYLE-SPECIFIC EXECUTION:
    ${style === 'realistic' ? `
    REALISTIC PRODUCT PHOTOGRAPHY:
    - Studio-quality lighting with natural shadow work
    - Authentic materials, textures, and surface details
    - Environmental context showing real-world usage
    - Professional model integration when applicable
    - Color accuracy for true product representation
    - Multiple angles: front, side, detail, lifestyle shots
    ` : style === 'illustration' ? `
    ILLUSTRATED PRODUCT PRESENTATION:
    - Technical drawing aesthetic with artistic flair
    - Exploded views showing internal components
    - Infographic-style feature callouts
    - Consistent illustration style across product line
    - Vector-based graphics for scalability
    - Educational visual approach
    ` : style === 'minimal' ? `
    MINIMAL PRODUCT PHOTOGRAPHY:
    - Clean, distraction-free backgrounds (white/neutral)
    - Single directional lighting for subtle shadows
    - Focus on product form and essential features
    - Generous white space for premium positioning
    - Simple, elegant composition principles
    - Emphasis on craftsmanship and quality details
    ` : style === 'vintage' ? `
    VINTAGE PRODUCT STYLING:
    - Warm, nostalgic lighting and color grading
    - Traditional craftsmanship emphasis
    - Heritage brand positioning elements
    - Classic packaging or presentation methods
    - Aged textures and patina where appropriate
    - Timeless aesthetic with quality focus
    ` : `
    MODERN PRODUCT PRESENTATION:
    - Contemporary aesthetic with bold visuals
    - Tech-forward lighting and composition
    - Premium materials and finish emphasis
    - Geometric composition and clean lines
    - Current design trend integration
    - Innovation and quality communication
    `}
    
    VISUAL SELLING PSYCHOLOGY:
    - **ASPIRATION TRIGGER**: Position product in desirable context
    - **QUALITY INDICATORS**: Professional photography = quality product
    - **FEATURE BENEFITS**: Visual representation of key advantages
    - **EMOTIONAL CONNECTION**: Lifestyle context that resonates
    - **TRUST SIGNALS**: Professional presentation removes purchase risk
    
    E-COMMERCE OPTIMIZATION:
    - **MAIN IMAGE**: Clear product on white background (Amazon style)
    - **LIFESTYLE SHOTS**: Product in real-world usage scenarios
    - **DETAIL IMAGES**: Close-ups of key features and quality indicators
    - **SIZE REFERENCE**: Comparison objects for scale understanding
    - **COLOR VARIANTS**: Accurate representation of available options
    
    CZECH MARKET CONSIDERATIONS:
    - Quality and durability emphasis over flashy features
    - Practical benefit demonstration
    - Value for money positioning
    - Local usage context when applicable
    - Conservative aesthetic preferences in B2B contexts
    
    TECHNICAL PHOTOGRAPHY SPECS:
    - **RESOLUTION**: Minimum 2000x2000px for e-commerce zoom
    - **COLOR SPACE**: sRGB for web, Adobe RGB for print
    - **LIGHTING**: Eliminate harsh shadows and reflections
    - **FOCUS**: Tack-sharp primary subject with appropriate depth
    - **FORMAT**: RAW processing for maximum quality control
    
    MULTI-USE CONSIDERATIONS:
    - Web gallery display optimization
    - Social media cropping flexibility  
    - Print marketing material usage
    - Packaging and label integration
    - Trade show and presentation contexts
    
    OUTPUT: Professional product photography that transforms features into desires, builds trust through quality presentation, and drives purchase decisions across all marketing channels.
  `,

  'infographic': (description, style, additionalInfo) => `
    INFOGRAPHIC DESIGN BRIEF: Data-Driven Visual Communication
    
    INFORMATION TOPIC: ${description}
    DESIGN APPROACH: ${style}
    AUDIENCE & PURPOSE: ${additionalInfo || 'Professional business communication and education'}
    
    INFORMATION DESIGN MASTERY:
    
    CORE PRINCIPLES:
    ✓ **COMPREHENSION SPEED**: Complex information absorbed in 30 seconds
    ✓ **VISUAL HIERARCHY**: Clear information flow and prioritization
    ✓ **DATA ACCURACY**: Precise representation without distortion
    ✓ **ENGAGING NARRATIVE**: Story flow that maintains attention
    ✓ **ACTIONABLE INSIGHTS**: Practical takeaways for audience
    
    STRUCTURAL FRAMEWORK:
    1. **HEADER SECTION** (15% space): Title, subtitle, source credibility
    2. **MAIN CONTENT** (70% space): Core data visualization and insights
    3. **CONCLUSION** (10% space): Key takeaways and next steps
    4. **BRANDING** (5% space): Logo and contact information
    
    VISUAL HIERARCHY SYSTEM:
    - **LEVEL 1**: Main headline and key statistics (largest, boldest)
    - **LEVEL 2**: Section headers and major data points
    - **LEVEL 3**: Supporting text and detailed information
    - **LEVEL 4**: Sources, disclaimers, and fine print
    
    STYLE-SPECIFIC TREATMENT:
    ${style === 'realistic' ? `
    REALISTIC INFOGRAPHIC EXECUTION:
    - Photography integration with data visualization
    - Real-world context and authentic imagery
    - Natural color palettes from source imagery
    - Dimensional charts and graphs with depth
    - Professional photography as section dividers
    - Lifestyle contexts showing data implications
    ` : style === 'illustration' ? `
    ILLUSTRATED INFOGRAPHIC DESIGN:
    - Custom iconography and visual metaphors
    - Hand-drawn aesthetic with digital precision
    - Consistent illustration style throughout
    - Creative data representation through artwork
    - Narrative-driven visual storytelling
    - Friendly, approachable design language
    ` : style === 'minimal' ? `
    MINIMAL INFOGRAPHIC APPROACH:
    - Clean, uncluttered data presentation
    - Limited color palette (2-3 colors maximum)
    - Abundant white space for clarity
    - Simple, geometric chart designs
    - Typography as primary design element
    - Focus on information over decoration
    ` : style === 'vintage' ? `
    VINTAGE INFOGRAPHIC STYLING:
    - Classic design era references and aesthetics
    - Traditional chart and graph styles
    - Vintage color palettes and typography
    - Ornate borders and decorative elements
    - Nostalgic design treatments
    - Heritage brand positioning
    ` : `
    MODERN INFOGRAPHIC EXECUTION:
    - Contemporary design trends and aesthetics
    - Bold, dynamic visual elements
    - Interactive design suggestions
    - Tech-forward data visualization
    - Gradient overlays and modern effects
    - Current visual design language
    `}
    
    DATA VISUALIZATION BEST PRACTICES:
    - **CHART SELECTION**: Appropriate graph type for data type
    - **COLOR CODING**: Consistent color meaning throughout
    - **SCALE ACCURACY**: Proportional representation of data
    - **COMPARISON CLARITY**: Easy relative value assessment
    - **TREND INDICATION**: Clear direction and pattern communication
    
    COGNITIVE PSYCHOLOGY INTEGRATION:
    - **F-PATTERN READING**: Information placed in natural eye flow
    - **CHUNKING**: Information grouped in digestible 5±2 item sets
    - **PROGRESSIVE DISCLOSURE**: Complex info revealed in logical order
    - **VISUAL ANCHORS**: Key statistics positioned as reference points
    - **MEMORY AIDS**: Visual metaphors that improve retention
    
    BUSINESS COMMUNICATION GOALS:
    - **AUTHORITY BUILDING**: Professional data presentation
    - **CREDIBILITY ENHANCEMENT**: Source transparency and accuracy
    - **DECISION SUPPORT**: Clear insights for business choices
    - **SHARING OPTIMIZATION**: Social media friendly format
    - **EDUCATION FOCUS**: Teaching rather than selling approach
    
    CZECH BUSINESS CULTURE:
    - Detailed, thorough data presentation preference
    - Conservative color schemes for professional contexts
    - Local market data and comparisons when available
    - Quality over flashy design aesthetics
    - Practical application emphasis
    
    TECHNICAL SPECIFICATIONS:
    - **DIMENSIONS**: 1080x1920px (mobile-friendly vertical)
    - **RESOLUTION**: 300 DPI for print compatibility
    - **FONTS**: Web-safe fonts for consistency across platforms
    - **COLORS**: CMYK values provided for print versions
    - **ACCESSIBILITY**: High contrast ratios and readable fonts
    
    DISTRIBUTION OPTIMIZATION:
    - Social media sharing format
    - Email newsletter integration
    - Website embedding capability
    - Print marketing material usage
    - Presentation slide adaptation
    
    OUTPUT: Compelling infographic that transforms complex business data into clear, engaging visual narrative that educates audience while building brand authority and expertise credibility.
  `
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, style, description, additionalInfo, dimensions, userId } = req.body;

  if (!type || !description || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check user credits with Firebase error handling
    const creditsNeeded = 3; // Uniform pricing for all image types
    let userData = null;
    
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      userData = userDoc.data();
      
      if (!userData?.subscription || userData.subscription.credits < creditsNeeded) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          message: `Pro tuto akci potřebujete ${creditsNeeded} kreditů. Máte pouze ${userData?.subscription?.credits || 0}.`
        });
      }
    } catch (firebaseError) {
      console.error('[IMAGE] Firebase check failed:', firebaseError.message);
      // Cannot verify credits - deny access for safety
      return res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Nelze ověřit kredity. Zkuste to prosím znovu za chvíli.'
      });
    }

    // Generate professional prompt
    const professionalPrompt = imagePrompts[type](description, style, additionalInfo);
    
    try {
      // Use Google Gemini Nano Banana (gemini-2.5-flash-image-preview) for actual image generation
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

      const nanoPrompt = `${professionalPrompt}

NANO BANANA SPECIFIC INSTRUCTIONS:
- Create a high-quality ${dimensions} image
- Professional business quality suitable for commercial use
- ${style} aesthetic style with premium finish
- Optimize for Czech business market preferences
- Include SynthID watermarking for authenticity`;

      const result = await model.generateContent([nanoPrompt]);
      const generatedImages = [];

      // Extract images from the response according to Gemini API docs
      if (result.response && result.response.candidates) {
        for (const candidate of result.response.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                // Convert base64 to data URL for frontend display
                const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                generatedImages.push(imageData);
              }
            }
          }
        }
      }

      // Generate a second image with slight variation for more options
      try {
        const result2 = await model.generateContent([`${nanoPrompt}\n\nVariation: Create a slightly different composition or perspective while maintaining the same concept, quality, and professional standards.`]);
        
        if (result2.response && result2.response.candidates) {
          for (const candidate of result2.response.candidates) {
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                  const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                  generatedImages.push(imageData);
                }
              }
            }
          }
        }
      } catch (secondImageError) {
        console.log('Second image generation failed, continuing with one image:', secondImageError.message);
      }

      // Always attempt to deduct credits using FieldValue.increment
      try {
        await db.collection('users').doc(userId).update({
          'subscription.credits': admin.firestore.FieldValue.increment(-creditsNeeded)
        });
        console.log('[IMAGE] Credits deducted successfully');
      } catch (firebaseError) {
        console.error('[IMAGE] Credit deduction failed:', firebaseError.message);
        // Continue - service works even if deduction fails
      }
      
      // Firebase logging with error handling
      try {
        await db.collection('content_generations').add({
          userId,
          type: 'image',
          subType: type,
          style,
          description,
          additionalInfo,
          dimensions,
          prompt: professionalPrompt,
          creditsUsed: creditsNeeded,
          model: 'gemini-2.5-flash-image-preview',
          promptVersion: 'professional-v1',
          success: true,
          createdAt: new Date()
        });
        console.log('[IMAGE] Generation logged successfully');
      } catch (firebaseError) {
        console.log('[IMAGE] Firebase logging failed:', firebaseError.message);
      }

      res.status(200).json({ 
        images: generatedImages,
        creditsUsed: creditsNeeded,
        message: 'Obrázky vygenerovány pomocí Google Gemini Nano Banana AI',
        note: 'Profesionální kvalita s SynthID watermarking pro autenticitu'
      });

    } catch (generationError) {
      console.error('Image generation failed:', generationError);
      
      // Create fallback high-quality placeholders with proper dimensions
      const fallbackImages = [
        `https://via.placeholder.com/${dimensions}/${getPlaceholderColors(type, style)[0]}/${getPlaceholderColors(type, style)[1]}?text=${encodeURIComponent(getPlaceholderText(type, description))}`,
        `https://via.placeholder.com/${dimensions}/${getPlaceholderColors(type, style)[2]}/${getPlaceholderColors(type, style)[3]}?text=${encodeURIComponent(getPlaceholderText(type, description) + ' v2')}`
      ];

      // Don't deduct credits for fallback
      // Firebase logging with error handling
      try {
        await db.collection('content_generations').add({
          userId,
          type: 'image',
          subType: type,
          style,
          description,
          additionalInfo,
          dimensions,
          creditsUsed: 0, // No credits charged for fallback
          success: false,
          error: generationError.message,
          fallbackUsed: true,
          createdAt: new Date()
        });
        console.log('[IMAGE] Error logged successfully');
      } catch (firebaseError) {
        console.log('[IMAGE] Firebase error logging failed:', firebaseError.message);
      }

      res.status(200).json({ 
        images: fallbackImages,
        creditsUsed: 0,
        message: 'Použity placeholder obrázky - kredity nebyly strženy',
        note: 'Nano Banana API dočasně nedostupné, zkuste to prosím později'
      });
    }

  } catch (error) {
    console.error('Error in image generation handler:', error);
    
    // Firebase logging with error handling
    try {
      await db.collection('content_generations').add({
        userId,
        type: 'image',
        subType: type,
        style,
        description,
        additionalInfo,
        dimensions,
        creditsUsed: 0,
        success: false,
        error: error.message,
        createdAt: new Date()
      });
      console.log('[IMAGE] Error logged successfully');
    } catch (firebaseError) {
      console.log('[IMAGE] Firebase error logging failed:', firebaseError.message);
    }

    res.status(500).json({ 
      error: 'Failed to generate images',
      message: 'Nepodařilo se vygenerovat obrázky. Zkuste to prosím znovu. Kredity nebyly strženy.'
    });
  }
}

// Helper functions for better placeholder generation
function getPlaceholderColors(type, style) {
  const colorSchemes = {
    hero: {
      realistic: ['1a365d', 'ffffff', '2d3748', 'e2e8f0'],
      illustration: ['667eea', 'ffffff', '764ba2', 'f093fb'],
      minimal: ['f7fafc', '2d3748', 'edf2f7', '4a5568'],
      vintage: ['8b4513', 'f5deb3', '654321', 'daa520'],
      modern: ['00d2ff', '1a202c', 'ff0080', '2d3748']
    },
    icon: {
      realistic: ['4299e1', 'ffffff', '3182ce', 'bee3f8'],
      illustration: ['9f7aea', 'ffffff', '805ad5', 'e9d8fd'],
      minimal: ['718096', 'ffffff', '4a5568', 'f7fafc'],
      vintage: ['d69e2e', 'fffbeb', 'b7791f', 'faf089'],
      modern: ['38b2ac', 'ffffff', '319795', '81e6d9']
    },
    banner: {
      realistic: ['e53e3e', 'ffffff', 'd53f8c', 'fed7e2'],
      illustration: ['f56565', 'ffffff', 'fc8181', 'fed7d7'],
      minimal: ['2d3748', 'ffffff', '4a5568', 'edf2f7'],
      vintage: ['975a16', 'fefcbf', 'b7791f', 'f6e05e'],
      modern: ['00b4d8', 'ffffff', '0077b6', 'a8dadc']
    },
    product: {
      realistic: ['2b6cb0', 'ffffff', '2c5aa0', 'bee3f8'],
      illustration: ['8b5cf6', 'ffffff', '7c3aed', 'ddd6fe'],
      minimal: ['4a5568', 'ffffff', '718096', 'f7fafc'],
      vintage: ['92400e', 'fef3c7', '78350f', 'fbbf24'],
      modern: ['06b6d4', 'ffffff', '0891b2', '67e8f9']
    },
    infographic: {
      realistic: ['1e40af', 'ffffff', '1d4ed8', '93c5fd'],
      illustration: ['7c2d12', 'ffffff', '9a3412', 'fed7aa'],
      minimal: ['374151', 'ffffff', '6b7280', 'f9fafb'],
      vintage: ['451a03', 'fef7ed', '78350f', 'fdba74'],
      modern: ['0f766e', 'ffffff', '0d9488', '5eead4']
    }
  };
  
  return colorSchemes[type]?.[style] || colorSchemes.hero.modern;
}

function getPlaceholderText(type, description) {
  const maxLength = 20;
  const cleanDesc = description.substring(0, maxLength) + (description.length > maxLength ? '...' : '');
  
  const prefixes = {
    hero: 'Hero: ',
    icon: 'Icon: ',  
    banner: 'Banner: ',
    product: 'Product: ',
    infographic: 'Info: '
  };
  
  return (prefixes[type] || '') + cleanDesc;
}

