import OpenAI from 'openai';
import { db } from '../lib/firebase-admin.js';
import admin from '../lib/firebase-admin.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ultra-professional, chunky prompts with advanced copywriting psychology
const textPrompts = {
  'web-homepage': (info, additional) => `
    ROLE: Expert Czech copywriter specializing in homepage conversion optimization with 15+ years of experience

    TASK: Create a high-converting homepage copy for "${info}" that follows proven conversion psychology principles

    BUSINESS CONTEXT: ${info}
    ADDITIONAL REQUIREMENTS: ${additional || 'Standard professional approach'}

    MANDATORY STRUCTURE:
    1. **HLAVNÍ NADPIS (H1)** - Must use the "Value Proposition + Outcome" formula
       - Lead with the primary benefit/transformation
       - Include emotional trigger words
       - 6-10 words maximum for impact
       - Use power words like: "Nejlepší", "Garantovaně", "Bez starostí", "Profesionálně"

    2. **PODNÁDPIS** - Expand on H1 with specificity
       - Address the main pain point this business solves
       - Include social proof element or unique differentiator
       - 15-25 words optimal length

    3. **ÚVODNÍ ODSTAVEC** - The "Know, Like, Trust" builder
       - Start with empathy statement acknowledging customer pain
       - Introduce the solution with credibility markers
       - Include subtle urgency or scarcity element
       - End with forward momentum phrase

    4. **SEKCE O SLUŽBÁCH** - Benefits-focused, not features
       For each service:
       - Transform feature into customer benefit
       - Use "So you can..." statements
       - Include micro-testimonial phrases like "Naši klienti říkají..."
       - Apply the "Before vs After" mental model

    5. **DŮVĚRYHODNOST** - Trust-building section
       - Years of experience/number of satisfied customers
       - Certifications, awards, or recognitions
       - Risk-reversal statements ("Záruka spokojenosti")

    6. **CALL-TO-ACTION** - Conversion-optimized
       - Use action-oriented verbs: "Získejte", "Objevte", "Začněte"
       - Create urgency without being pushy
       - Address final objection in CTA vicinity
       - Provide multiple engagement options (primary + secondary CTA)

    PSYCHOLOGICAL PRINCIPLES TO APPLY:
    - Reciprocity: Offer valuable insight or free consultation
    - Social proof: Reference other satisfied customers
    - Authority: Establish expertise subtly
    - Scarcity: Limited time/spots (if applicable)
    - Consistency: Align with customer's self-image

    CZECH MARKET SPECIFICS:
    - Prefer modest confidence over American-style boasting
    - Value reliability and long-term relationships over flashy promises
    - Include regional/local connection if applicable
    - Use formal "Vy" initially, can shift to informal in some contexts

    SEO REQUIREMENTS:
    - Naturally integrate 3-5 relevant keywords
    - Include location-based terms if local business
    - Optimize for featured snippet potential with clear question-answer patterns

    TONE: Professional yet approachable, confident but not arrogant, results-focused with human warmth

    OUTPUT: Provide complete homepage copy ready for web implementation
  `,

  'web-services': (info, additional) => `
    ROLE: Senior conversion copywriter with expertise in service page optimization and customer journey mapping

    TASK: Create compelling service descriptions for "${info}" that convert prospects into paying customers

    BUSINESS CONTEXT: ${info}
    SPECIAL REQUIREMENTS: ${additional || 'Standard comprehensive service presentation'}

    MANDATORY FRAMEWORK - "PASTOR" METHOD:
    P - Problem: Identify customer's core frustration
    A - Agitation: Amplify the pain of not solving it
    S - Solution: Present your service as the remedy  
    T - Testimony: Include credibility elements
    O - Offer: Clear value proposition
    R - Response: Strong call-to-action

    STRUCTURE FOR EACH SERVICE:
    1. **SERVICE HEADLINE** - Outcome-focused
       - Format: "Achieve [DESIRED OUTCOME] with our [SERVICE TYPE]"
       - Examples: "Získejte více zákazníků s naším SEO", "Ušetřete čas s naší účetní službou"

    2. **PROBLEM IDENTIFICATION** - Pain point recognition
       - "Možná také zažíváte..." followed by 2-3 specific pain points
       - Make prospect nod in agreement
       - Use customer language, not industry jargon

    3. **SOLUTION PRESENTATION** - Your unique approach
       - "Náš postup je jiný..."
       - Explain your methodology in 3-4 clear steps
       - Focus on "how" not just "what"
       - Include timeline expectations

    4. **BENEFIT TRANSFORMATION** - Feature to benefit conversion
       Create benefit statements using this formula:
       - Feature + So that + Customer benefit + Which means + Emotional payoff
       - Example: "Používáme pokročilé nástroje + takže + získáte přesná data + což znamená + můžete se rozhodovat s jistotou"

    5. **SOCIAL PROOF INTEGRATION**
       - Mini case study (2-3 sentences)
       - Specific results with numbers when possible
       - Customer quote or testimonial snippet
       - "Podobné výsledky dosáhli i..." statements

    6. **RISK REVERSAL**
       - Address common objections
       - Provide guarantees or assurances
       - "Co když..." scenarios with solutions
       - Money-back or satisfaction guarantees

    7. **INVESTMENT SECTION** - Price positioning
       - Frame price as investment, not cost
       - Compare to consequences of not acting
       - Provide value context ("Za cenu jedné večeře...")
       - Multiple options if applicable (Good/Better/Best)

    PSYCHOLOGICAL TRIGGERS:
    - Specificity over generalities (exact numbers, timeframes)
    - Authority through process explanation
    - Exclusivity through unique methodology
    - Urgency through limited availability or time-sensitive benefits

    CZECH CUSTOMER PSYCHOLOGY:
    - Value thoroughness and attention to detail
    - Appreciate transparency in processes
    - Prefer step-by-step explanations
    - Trust builds through competence demonstration

    SEO OPTIMIZATION:
    - Service-specific keywords naturally integrated
    - FAQ-style content for voice search
    - Local SEO elements if applicable
    - Related service cross-references

    TONE: Expert confidence with genuine care for customer success

    OUTPUT: Comprehensive service descriptions ready for immediate web publication
  `,

  'web-about': (info, additional) => `
    ROLE: Brand storytelling expert specializing in trust-building and emotional connection through "About" pages

    TASK: Craft a compelling "About Us" story for "${info}" that builds deep trust and emotional connection

    BUSINESS CONTEXT: ${info}
    BRAND ELEMENTS: ${additional || 'Professional, trustworthy, customer-focused approach'}

    STORYTELLING FRAMEWORK - "HERO'S JOURNEY" ADAPTED FOR BUSINESS:
    1. **ORIGIN STORY** - The humble beginning
    2. **CHALLENGE** - The problem that sparked action  
    3. **TRANSFORMATION** - How you evolved
    4. **MISSION** - Why you exist beyond profit
    5. **VALUES** - What drives your decisions
    6. **VISION** - Where you're heading

    MANDATORY SECTIONS:

    1. **OPENING HOOK** - Emotional connection starter
       - Begin with customer perspective: "Víte ten pocit, když..."
       - Or origin story: "Začalo to jednoduše..."
       - Or mission statement: "Věříme, že každý zaslouží..."
       - Must create immediate emotional resonance

    2. **FOUNDER'S STORY** - Personal journey (human element)
       - The moment of realization that led to starting the business
       - Personal stakes and emotional investment
       - Early challenges and how they were overcome
       - Key learning moments that shaped the approach
       - Format: "Když jsem [situation], uvědomil jsem si..."

    3. **VALUES MANIFESTATION** - Not just listed, but demonstrated
       For each core value:
       - Tell a specific story where this value was tested
       - Show the decision made based on this value
       - Explain the positive outcome for customers
       - Use format: "Když se nám stalo [situation], rozhodli jsme se [action] protože [value]"

    4. **CUSTOMER-CENTRIC PHILOSOPHY** - Your "why"
       - Deep understanding of customer struggles
       - How your approach is different from competitors
       - The transformation you facilitate in customers' lives
       - Your promise/commitment to each customer

    5. **TEAM & EXPERTISE** - Credibility builders
       - Combined years of experience
       - Unique qualifications or backgrounds
       - Specializations and certifications
       - What each team member brings to customer value
       - Format: "Náš tým spojuje [experience] s [passion] aby [customer benefit]"

    6. **PROOF POINTS** - Credibility without bragging
       - Number of satisfied customers
       - Years in business
       - Successful projects completed
       - Awards or recognitions (if any)
       - Community involvement or contributions

    7. **FUTURE VISION** - Where you're heading
       - Industry trends you're preparing for
       - How you plan to evolve to serve customers better
       - Invitation for customers to be part of the journey

    EMOTIONAL PSYCHOLOGY TECHNIQUES:
    - **Mirror neurons**: Describe experiences customers can relate to
    - **Social proof**: Reference similar customers' success
    - **Authority**: Demonstrate expertise through storytelling, not claiming
    - **Likability**: Show vulnerability and genuine care
    - **Consistency**: Align values with actions through examples

    TRUST-BUILDING ELEMENTS:
    - Transparency about challenges and how they were handled
    - Customer testimonials woven into the story
    - Behind-the-scenes insights into your process
    - Personal photos and real moments (not stock photography)
    - Contact information and accessibility

    CZECH CULTURAL CONSIDERATIONS:
    - Modesty over self-promotion
    - Community and relationship values
    - Long-term thinking over quick gains
    - Craftsmanship and quality appreciation
    - Skepticism of "too good to be true" claims

    NARRATIVE STRUCTURE:
    - Use the "nested loop" technique: Start story, provide context, return to complete story
    - Include specific details that make stories memorable
    - Show transformation not just state facts
    - End with customer benefit and future promise

    TONE: Authentic, warm, professional with personal touches, confident but humble

    OUTPUT: Complete "About Us" page that reads like a compelling story while building maximum trust and connection
  `,

  'cta': (info, additional) => `
    ROLE: Direct response copywriting specialist with expertise in call-to-action optimization and conversion psychology

    TASK: Create 5 high-converting call-to-action variations for "${info}" using proven psychological triggers

    BUSINESS CONTEXT: ${info}  
    CAMPAIGN SPECIFICS: ${additional || 'General conversion optimization across touchpoints'}

    CTA PSYCHOLOGY MASTERCLASS:
    Each CTA must incorporate multiple psychological principles for maximum conversion impact

    **CTA VARIATION 1: URGENCY + SCARCITY**
    Framework: "Action Verb + Benefit + Time Constraint + Scarcity Element"
    - Lead with commanding action verb
    - Include specific timeframe
    - Reference limited availability
    - Add FOMO (fear of missing out) element
    - Example structure: "Získejte [benefit] do [timeframe] - pouze pro prvních [number] zájemců"

    **CTA VARIATION 2: RISK REVERSAL + SOCIAL PROOF**  
    Framework: "Benefit Promise + Risk Elimination + Social Validation"
    - Start with desired outcome
    - Remove barrier with guarantee
    - Include social proof element
    - Add credibility marker
    - Example: "Začněte bez rizika + [guarantee] + přes [number] spokojených zákazníků"

    **CTA VARIATION 3: CURIOSITY + EXCLUSIVITY**
    Framework: "Intrigue Hook + Exclusive Access + Value Proposition"
    - Create curiosity gap
    - Offer insider access
    - Emphasize unique value
    - Include mystery element
    - Example: "Objevte tajemství [outcome] - exkluzivně pro [target audience]"

    **CTA VARIATION 4: INSTANT GRATIFICATION + EASE**
    Framework: "Immediate Benefit + Effortless Process + Quick Timeline"
    - Promise immediate value
    - Emphasize simplicity  
    - Minimize perceived effort
    - Include quick timeline
    - Example: "Získejte okamžitě [benefit] - 3 minuty, žádné složitosti"

    **CTA VARIATION 5: TRANSFORMATION + ASPIRATION**
    Framework: "Future State Vision + Identity Alignment + Success Promise"
    - Paint picture of transformation
    - Align with customer aspirations
    - Promise success/achievement
    - Include identity upgrade
    - Example: "Staňte se [desired identity] s naším [solution] - garantovaný úspěch"

    FOR EACH CTA VARIATION PROVIDE:

    1. **HEADLINE CTA** - Main button/banner text
       - 2-6 words maximum
       - Action-oriented
       - Benefit-focused

    2. **SUPPORTING COPY** - Reinforcement text
       - 8-15 words
       - Addresses main objection
       - Adds urgency or value

    3. **MICRO-COPY** - Fine print that builds trust
       - Risk reversal statement
       - Credibility element
       - Process explanation

    4. **CONTEXT NOTES** - When/where to use each variation
       - Best placement recommendations
       - Target audience fit
       - Conversion stage alignment

    PSYCHOLOGICAL TRIGGERS TO INCORPORATE:
    - **Loss aversion**: "Don't miss out on..."
    - **Social proof**: "Join thousands who..."
    - **Authority**: "Expert-recommended..."
    - **Reciprocity**: "Free [value] included..."
    - **Commitment**: "Yes, I want to..."
    - **Progress**: "Take the next step..."

    CZECH MARKET ADAPTATIONS:
    - Prefer "Získejte" over "Kupte"
    - Use "Bez závazku" for risk reversal
    - Include "Ověřeno zákazníky" for social proof
    - Emphasize value and quality over speed
    - Use formal address initially

    CONVERSION OPTIMIZATION PRINCIPLES:
    - Contrast colors for visibility
    - White space for attention
    - Action verbs in imperative mood
    - Benefit-focused language
    - Urgency without pressure

    OUTPUT: 5 complete CTA variations with headlines, supporting copy, micro-copy, and usage recommendations for A/B testing
  `,

  'social-fb': (info, additional) => `
    ROLE: Social media conversion specialist with deep expertise in Facebook algorithm optimization and engagement psychology

    TASK: Create a high-engagement Facebook post for "${info}" that drives meaningful business results

    BUSINESS CONTEXT: ${info}
    CAMPAIGN OBJECTIVES: ${additional || 'Brand awareness, engagement, and lead generation'}

    FACEBOOK ALGORITHM MASTERY:
    Create content that Facebook's algorithm will prioritize for maximum organic reach

    **POST STRUCTURE - "AIDA + HOOK" FRAMEWORK:**

    1. **OPENING HOOK** (First 3 words critical!)
       - Stop-scroll pattern interrupt
       - Curiosity-driven opening
       - Emotional trigger words
       - Options: Question, Surprising fact, Bold statement, Story starter
       - Examples: "Věděli jste, že...", "Právě jsem objevil...", "Toto mě šokovalo..."

    2. **VALUE-PACKED STORY** (125-250 characters optimal)
       - Customer transformation story
       - Behind-the-scenes insight  
       - Problem-solving moment
       - Educational content
       - Use storytelling format: Setup → Conflict → Resolution

    3. **ENGAGEMENT CATALYST** - Algorithm boost
       - Specific question that requires detailed answers
       - Controversial but professional opinion
       - "Fill in the blank" prompt
       - Experience sharing request
       - Avoid yes/no questions (algorithm penalty)

    4. **SOFT CALL-TO-ACTION** - Non-pushy conversion
       - Valuable free resource offer
       - "More info in comments" technique
       - "DM for details" approach
       - Link to valuable content (not sales page)

    **PSYCHOLOGICAL ENGAGEMENT TRIGGERS:**

    1. **SOCIAL PROOF INTEGRATION**
       - "Právě pomohl jsem klientovi..."
       - "Včera mi zákazník řekl..."
       - "Ostatní podnikatelé používají..."

    2. **CURIOSITY GAPS**
       - "3 věci, které možná nevíte o..."
       - "Tajemství, které konkurence nerad sdílí..."
       - "Chyba, kterou dělá 90% [target audience]..."

    3. **EMOTIONAL RESONANCE**
       - Pride: "Jsem hrdý na..."
       - Relief: "Konečně jsem našel řešení..."
       - Excitement: "Nemohu se dočkat, až vám ukážu..."
       - Concern: "Trápí vás také..."

    **HASHTAG STRATEGY:**
    - 3-5 hashtags maximum (algorithm preference)
    - Mix of broad and niche tags
    - Include location-based tags if local business
    - Create branded hashtag for campaign tracking
    - Czech tags: #českýbusiness #podnikání #kvalita #služby

    **EMOJI USAGE PSYCHOLOGY:**
    - Maximum 3-4 emojis per post
    - Use for emphasis, not decoration
    - Match emoji emotion to content tone
    - Avoid overuse (reduces professionalism)
    - Strategic placement: Beginning, middle breaks, end

    **FACEBOOK-SPECIFIC OPTIMIZATIONS:**
    - Native video over external links (algorithm boost)
    - Multiple photos/carousel for higher engagement
    - Facebook Live mention for FOMO
    - Event creation for time-sensitive offers
    - Group mention for community building

    **CONTENT CATEGORIES TO CHOOSE FROM:**
    1. **Educational**: "Jak na..." tutorials
    2. **Behind-the-scenes**: Process insights
    3. **Customer spotlight**: Success stories  
    4. **Industry news**: Expert commentary
    5. **Personal**: Founder's journey moments
    6. **Interactive**: Polls, questions, challenges

    **POSTING TIME OPTIMIZATION:**
    - Include note about optimal posting time for this business type
    - Consider Czech timezone and behavior patterns
    - Account for business vs consumer audience differences

    **CONVERSION TRACKING ELEMENTS:**
    - UTM parameters for link tracking
    - Specific CTA for lead generation
    - Comment engagement monitoring keywords
    - Share-worthy content for amplification

    TONE: Conversational, authentic, value-first, subtly promotional

    OUTPUT: Complete Facebook post with hook, story, engagement question, soft CTA, strategic hashtags, and emoji placement optimized for maximum algorithm reach and business results
  `,

  'social-ig': (info, additional) => `
    ROLE: Instagram growth strategist with expertise in visual storytelling and Instagram algorithm optimization

    TASK: Create an Instagram post with caption for "${info}" that maximizes engagement and drives business growth

    BUSINESS CONTEXT: ${info}
    VISUAL STRATEGY: ${additional || 'Professional, authentic, visually appealing content'}

    INSTAGRAM ALGORITHM SECRETS:
    Optimize every element for Instagram's engagement-focused algorithm

    **POST STRUCTURE - "STORY HOOK + VALUE + CTA" METHOD:**

    1. **VISUAL HOOK SUGGESTIONS** (for accompanying image/video)
       - Behind-the-scenes action shot
       - Before/after transformation  
       - Product/service in natural setting
       - Team member authentically working
       - Customer using your service
       - Infographic with key statistics
       - Quote graphic with brand colors

    2. **CAPTION OPENING** (Critical first 2 lines visible without "more")
       Must accomplish 3 things:
       - Stop the scroll with curiosity/emotion
       - Relate to target audience's experience
       - Promise valuable content below
       - Example formats:
         * "Včera jsem dostal otázku: '[common customer question]'"
         * "Tuto chybu jsem viděl už stokrát..."
         * "3 roky zpět jsem netušil, že..."

    3. **VALUE-RICH MIDDLE** (The "meat" of the post)
       Choose ONE primary value type:
       
       **EDUCATIONAL VALUE:**
       - "Krok za krokem" tutorial
       - "3 způsoby jak..." listicle
       - Myth-busting content
       - Industry insights

       **INSPIRATIONAL VALUE:**
       - Customer success story
       - Personal journey moment
       - Overcoming challenges narrative
       - Achievement celebration

       **BEHIND-THE-SCENES VALUE:**
       - Process explanation
       - Day-in-the-life content
       - Team spotlights
       - Company culture moments

    4. **ENGAGEMENT HOOK** - Algorithm booster
       Design questions that generate detailed responses:
       - "Jaká je vaše největší výzva s [topic]?"
       - "Co by se stalo, kdyby [scenario]?"
       - "Která z těchto možností je nejbližší vaší situaci?"
       - "Sdílejte svou zkušenost s [topic] v komentářích!"

    5. **SOFT CTA + VALUE OFFER**
       - Link in bio mention with specific benefit
       - DM invitation for personalized help
       - Save post for future reference
       - Share with someone who needs this

    **HASHTAG STRATEGY - INSTAGRAM OPTIMIZED:**
    
    **Tier 1: High Competition (1M+ posts)**
    - #podnikání #business #služby #kvalita
    
    **Tier 2: Medium Competition (100K-1M posts)**  
    - #českýbusiness #podnikatelsketipy #[your industry]
    
    **Tier 3: Niche/Long-tail (Under 100K posts)**
    - #[city][yourindustry] #[specific service] #[unique approach]
    
    **Research tip**: Check current post volume for each hashtag

    **STORY ELEMENTS TO WEAVE IN:**
    
    1. **Personal Connection**
       - "Když jsem začínal..."
       - "Můj nejlepší zákazník mi řekl..."
       - "Učím své děti, že..."

    2. **Social Proof Integration**
       - "Právě jsem pomohl klientovi [achieve result]"
       - "Týden co týden vidím, jak [customer benefit]"
       - "Nezapomenu na moment, kdy zákazník..."

    3. **Vulnerability/Authenticity**
       - "Není to vždy jednoduché..."
       - "Také jsem dělal tuto chybu..."
       - "Někdy se ptám sám sebe..."

    **INSTAGRAM-SPECIFIC OPTIMIZATIONS:**

    **Caption Length Strategy:**
    - 150-300 words optimal for engagement
    - Front-load value in first 125 characters
    - Use line breaks for readability
    - End with strong CTA

    **Emoji Psychology:**
    - Use relevant emojis as bullet points
    - Create visual breaks in long text  
    - Match emoji emotion to content
    - Maximum 5-7 emojis per post

    **Stories Integration:**
    - Reference current Stories content
    - Tease upcoming Stories content
    - Create content series across posts + Stories

    **Engagement Timing:**
    - Post when your audience is most active
    - Respond to comments within first hour
    - Ask questions in comments to boost engagement
    - Use Instagram's question sticker data

    **CONVERSION OPTIMIZATION:**
    - Clear link in bio reference with specific benefit
    - Stories highlights organization for easy access  
    - DM automation setup for lead capture
    - Track engagement metrics for optimization

    TONE: Authentic, inspiring, valuable, subtly promotional, conversational

    OUTPUT: Complete Instagram post with visual suggestions, optimized caption structure, strategic hashtag mix, and engagement-driving elements ready for immediate posting
  `,

  'email': (info, additional) => `
    ROLE: Email marketing specialist with expertise in deliverability, open rates, click-through optimization, and customer lifecycle management

    TASK: Create a high-converting email campaign for "${info}" using advanced email psychology and deliverability best practices

    BUSINESS CONTEXT: ${info}
    CAMPAIGN PURPOSE: ${additional || 'Customer engagement, value delivery, and conversion optimization'}

    EMAIL MARKETING MASTERCLASS - "PASTOR + PAS" HYBRID METHOD:

    **SUBJECT LINE OPTIMIZATION** (Multiple variants for A/B testing):
    
    1. **CURIOSITY-DRIVEN SUBJECT** (Best open rates)
       - Create knowledge gap: "Věc, kterou možná nevíte o [topic]"
       - Incomplete information: "Půlka příběhu o [topic]..."
       - Mystery element: "Tajemství za naším [result/success]"
       - Length: 30-50 characters optimal

    2. **BENEFIT-FOCUSED SUBJECT** (Best for conversions)
       - Direct value proposition: "[Specific benefit] za [timeframe]"
       - Problem-solution: "Konec problémů s [pain point]"
       - Achievement promise: "Jak získat [desired outcome]"

    3. **PERSONALIZED/URGENT SUBJECT** (High engagement)
       - Scarcity element: "Poslední šance pro [first name]"
       - Time-sensitive: "[Name], končí za 24 hodin"
       - Exclusive access: "Speciálně pro vás, [name]"

    **PREHEADER OPTIMIZATION:**
    - Complement subject line, don't repeat
    - 35-90 characters optimal length
    - Include additional hook or benefit
    - Create cohesive message with subject

    **EMAIL BODY STRUCTURE:**

    **1. OPENING HOOK** (First 2 lines - visible in preview)
    - Personal greeting with context
    - Immediate value or intriguing statement
    - Reference previous interaction or common experience
    - Examples:
      * "Pamatujete si, když jsme mluvili o [topic]?"
      * "Právě jsem dokončil [relevant work] a pomyslel jsem si na vás."
      * "Tuto otázku mi pokládají zákazníci každý týden..."

    **2. VALUE SECTION** - Core content (Choose one approach)
    
    **EDUCATIONAL APPROACH:**
    - "Dnes se s vámi podělím o [valuable insight]"
    - Provide actionable tip or strategy
    - Include step-by-step instructions
    - Add personal experience or case study

    **STORY-DRIVEN APPROACH:**
    - Customer success story with specific results
    - Behind-the-scenes business moment
    - Personal challenge and resolution
    - Industry trend observation and implications

    **PROBLEM-SOLVING APPROACH:**  
    - Identify common customer pain point
    - Explain why traditional solutions fail
    - Present your unique approach/solution
    - Provide proof or validation

    **3. SOCIAL PROOF INTEGRATION**
    - Recent customer testimonial (specific results)
    - Case study snippet with measurable outcomes
    - Industry recognition or media mention
    - User-generated content reference

    **4. SOFT TRANSITION TO OFFER** - Bridge content to CTA
    - "Speaking of [topic], I wanted to let you know..."
    - "Since you're interested in [topic], you might appreciate..."
    - "This reminds me of something that could help you..."

    **5. CALL-TO-ACTION OPTIMIZATION**
    
    **PRIMARY CTA Requirements:**
    - Benefit-focused button text (not "click here")
    - Contrasting color for visibility
    - Single, clear action requested
    - Examples: "Získejte zdarma průvodce", "Rezervujte konzultaci", "Stáhněte nyní"

    **SECONDARY CTA Options:**
    - "Máte otázky? Odpovězte na tento email"
    - "Přepošlete kolegovi, který by to ocenil"
    - "Sledujte nás pro denní tipy"

    **6. P.S. SECTION** - High-readership area
    - Restate main benefit or offer
    - Add scarcity or urgency element  
    - Include additional value proposition
    - Create FOMO (fear of missing out)
    - Example: "P.S. Těchto 10 míst se obvykle zaplní do 48 hodin. Rezervujte si své místo dnes."

    **DELIVERABILITY OPTIMIZATION:**
    
    **Content Guidelines:**
    - Avoid spam trigger words: "Free", "Guarantee", "Act now", etc.
    - Use text-to-image ratio 80:20 or better
    - Include both HTML and plain text versions
    - Optimize for mobile (60%+ mobile opens)

    **Authentication & Reputation:**
    - SPF, DKIM, DMARC setup
    - Consistent from name and email
    - Gradual volume increases for new campaigns
    - Monitor bounce and complaint rates

    **PSYCHOLOGICAL TRIGGERS:**
    
    **Reciprocity**: Provide valuable content before asking
    **Commitment**: Ask for small commitments that lead to larger ones
    **Social Proof**: Reference similar customers' successes  
    **Authority**: Demonstrate expertise through content quality
    **Scarcity**: Limited-time offers or exclusive access
    **Loss Aversion**: "Don't miss out on..." positioning

    **CZECH EMAIL MARKETING SPECIFICS:**
    - GDPR compliance mandatory
    - Preference for longer, detailed emails (value over brevity)
    - Formal address (Vy) in initial emails
    - Include unsubscribe link prominently
    - Avoid overly promotional language

    **TESTING & OPTIMIZATION:**
    - A/B test subject lines (minimum 100 recipients per variant)
    - Test send times (Tuesday-Thursday, 9-11am often optimal)
    - Monitor key metrics: Open rate, click rate, conversion rate
    - Segment lists for better personalization

    TONE: Professional yet personal, valuable, helpful, subtly persuasive

    OUTPUT: Complete email campaign with multiple subject line variants, optimized preheader, full body content, strategic CTAs, and P.S. section ready for immediate deployment
  `,

  'blog': (info, additional) => `
    ROLE: SEO content strategist and professional blogger with expertise in topic authority, search ranking, and reader engagement optimization

    TASK: Create a comprehensive blog article strategy and introduction for "${info}" that ranks well and drives business results

    BUSINESS CONTEXT: ${info}
    CONTENT FOCUS: ${additional || 'Thought leadership, SEO optimization, and lead generation'}

    BLOG CONTENT STRATEGY - "SKYSCRAPER + E-A-T" METHOD:

    **KEYWORD RESEARCH & SEO FOUNDATION:**
    
    **Primary Keyword Strategy:**
    - Target: [Main topic] + [location/modifier] + [intent keyword]
    - Search volume: 500-2000 monthly (sweet spot for new content)
    - Competition: Medium (possible to rank with quality content)
    - Examples: "jak vybrat [service] v [city]", "[service] cena [year]", "nejlepší [service] tipy"

    **Semantic Keywords** (Related terms Google expects):
    - 5-8 related terms naturally integrated
    - Long-tail variations of main keyword
    - Question-based keywords for featured snippets
    - LSI (Latent Semantic Indexing) terms

    **CONTENT STRUCTURE - READER + SEO OPTIMIZED:**

    **1. ARTICLE TITLE** (H1) - Multiple options for testing
    
    **Option A: How-to Format** (High search volume)
    - "Jak [achieve desired outcome] v roce 2024: Kompletní průvodce"
    - Include year for freshness signal
    - Promise comprehensive coverage

    **Option B: List Format** (High click-through rates)
    - "[Number] způsobů, jak [solve problem] (včetně real-life příkladů)"
    - Use odd numbers (7, 9, 11) for psychological impact
    - Include benefit in parentheses

    **Option C: Problem/Solution** (High relevance)
    - "Proč [common approach] nefunguje a co dělat místo toho"
    - Address common misconceptions
    - Position expertise against conventional wisdom

    **2. META DESCRIPTION** (155 characters max)
    - Include primary keyword
    - Create compelling reason to click
    - Include emotional trigger or benefit
    - Add call-to-action phrase

    **3. INTRODUCTION SECTION** (Hook + Value Promise + Structure Preview)
    
    **Opening Hook** (First 25 words critical):
    - Start with relatable problem or surprising statistic
    - Create immediate emotional connection
    - Examples:
      * "95% podnikatelů dělá tuto chybu s [topic] - a ani o tom nevědí."
      * "Když jsem začínal s [topic], udělal jsem všechno špatně. Tady je to, co jsem se naučil."
      * "Kolik vás stojí každý měsíc [problem]? Možná víc, než si myslíte."

    **Value Proposition** (What reader will gain):
    - Specific, measurable outcomes
    - Time savings or efficiency gains  
    - Money savings or earning potential
    - Problem resolution or skill improvement

    **Article Structure Preview** (Builds anticipation):
    - "V tomto článku zjistíte:"
    - 3-4 bullet points of main sections
    - Include benefit for each section
    - End with transformation promise

    **4. MAIN CONTENT OUTLINE** (H2 and H3 structure)
    
    **Section 1: Problem Identification** (H2)
    - Current situation analysis
    - Why existing solutions fall short
    - Cost of inaction (pain points)
    - Statistical backing or case studies

    **Section 2: Solution Framework** (H2)  
    - Your unique approach/methodology
    - Step-by-step process explanation
    - Tools and resources needed
    - Timeline expectations

    **Section 3: Implementation Guide** (H2)
    - Detailed how-to instructions
    - Common mistakes to avoid
    - Troubleshooting tips
    - Success metrics to track

    **Section 4: Advanced Strategies** (H2)
    - Pro tips for optimization
    - Advanced techniques
    - Case studies and examples
    - Industry best practices

    **Section 5: Tools and Resources** (H2)
    - Recommended tools (affiliate opportunities)
    - Free resources and templates
    - Further reading suggestions
    - Community resources

    **5. CONCLUSION + CTA SECTION**
    
    **Summary Points:**
    - Recap main benefits
    - Reinforce transformation promise
    - Address final objections

    **Multiple CTA Options:**
    - **Primary**: Free resource download (lead magnet)
    - **Secondary**: Consultation booking
    - **Tertiary**: Social media follow
    - **Quaternary**: Related article suggestions

    **E-A-T OPTIMIZATION** (Expertise, Authoritativeness, Trustworthiness):
    
    **Expertise Signals:**
    - Author bio with credentials
    - Personal experience stories
    - Industry-specific knowledge demonstration
    - Professional affiliations or certifications

    **Authority Building:**
    - Original research or data
    - Expert quotes and interviews
    - References to authoritative sources
    - Media mentions or awards

    **Trust Factors:**
    - Transparent about limitations
    - Honest pros/cons discussions
    - Contact information readily available
    - Privacy policy and terms links
    - Customer testimonials integration

    **TECHNICAL SEO ELEMENTS:**
    
    **On-Page Optimization:**
    - Primary keyword in title, URL, H1
    - Keyword density 1-2% naturally integrated
    - Alt text for all images with descriptive keywords
    - Internal linking to related content (3-5 links)
    - External linking to authoritative sources (2-3 links)

    **User Experience Signals:**
    - Reading time 7-12 minutes (comprehensive but digestible)
    - Subheadings every 200-300 words
    - Bullet points and numbered lists for scannability
    - Images/graphics every 300-400 words
    - Mobile-optimized formatting

    **Featured Snippet Optimization:**
    - Question-based H2/H3 headings
    - Concise answers in 40-60 word paragraphs
    - Table or list format where appropriate
    - FAQ section with common questions

    TONE: Authoritative yet accessible, helpful, data-driven, professionally confident

    OUTPUT: Complete blog article strategy with SEO-optimized title options, meta description, comprehensive introduction, detailed outline, E-A-T elements, and technical SEO checklist ready for content creation
  `
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, businessInfo, additionalInfo, userId } = req.body;

  if (!type || !businessInfo || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check user credits with Firebase error handling
    const creditsNeeded = 2; // Uniform pricing for all text types
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
      console.error('[CONTENT] Firebase check failed:', firebaseError.message);
      // Allow operation to continue - will attempt credit deduction anyway
      userData = null;
    }

    // Generate text with professional prompts
    const prompt = textPrompts[type](businessInfo, additionalInfo);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5-2025-08-07", // Updated to use GPT-5 API with correct model version
      messages: [
        {
          role: "system",
          content: `Jsi špičkový český copywriter s 15+ lety zkušeností v conversion copywritingu, direct response marketingu a brand storytellingu. Specializuješ se na tvorbu textů, které nejen informují, ale především přesvědčují a konvertují. Rozumíš psychologii zákazníka, českému trhu a kulturním nuancím.

          TVŮJ PŘÍSTUP:
          - Používáš osvědčené copywriting frameworky (AIDA, PAS, PASTOR)
          - Integruje psychologické spouštěče (social proof, scarcity, authority)
          - Píšeš pro český trh s porozuměním kulturním specifkům
          - Vyvažuješ profesionalitu s lidským přístupem
          - SEO optimalizuješ přirozeně, bez přetížení klíčovými slovy
          - Výstup je vždy připraven k okamžitému použití`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_completion_tokens: 5000 // GPT-5 only supports default temperature (1) and no penalty parameters
    });

    const generatedText = completion.choices[0].message.content;

    // Always attempt to deduct credits using FieldValue.increment
    try {
      await db.collection('users').doc(userId).update({
        'subscription.credits': admin.firestore.FieldValue.increment(-creditsNeeded)
      });
      console.log('[CONTENT] Credits deducted successfully');
    } catch (firebaseError) {
      console.error('[CONTENT] Credit deduction failed:', firebaseError.message);
      // Continue - service works even if deduction fails
    }
    
    // Firebase logging with error handling (bypassed due to Firebase GRPC issues)
    try {
      await db.collection('content_generations').add({
        userId,
        type: 'text',
        subType: type,
        businessInfo,
        additionalInfo, 
        generatedText,
        creditsUsed: creditsNeeded,
        model: 'gpt-5-2025-08-07',
        promptVersion: 'professional-v1',
        success: true,
        createdAt: new Date()
      });
      console.log('[CONTENT] Generation logged successfully');
    } catch (firebaseError) {
      console.log('[CONTENT] Firebase logging failed:', firebaseError.message);
    }

    res.status(200).json({ 
      text: generatedText,
      creditsUsed: creditsNeeded,
      message: 'Text vygenerován pomocí pokročilých copywriting technik'
    });

  } catch (error) {
    console.error('Error generating text:', error);
    
    // TEMPORARILY DISABLED - Log failed attempt (bypassed due to Firebase GRPC issues)
    /*
    try {
      await db.collection('content_generations').add({
        userId,
        type: 'text',
        subType: type,
        businessInfo,
        additionalInfo,
        creditsUsed: 0,
        success: false,
        error: error.message,
        createdAt: new Date()
      });
    } catch (logError) {
      console.error('Error logging failed generation:', logError);
    }
    */
    console.log('[CONTENT] Error logging bypassed - Firebase issues');

    res.status(500).json({ 
      error: 'Failed to generate text',
      message: 'Nepodařilo se vygenerovat text. Zkuste to prosím znovu. Kredity nebyly strženy.'
    });
  }
}