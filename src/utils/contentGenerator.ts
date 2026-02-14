interface City {
  name: string;
  slug: string;
  region: string;
  population: number;
  type: string;
  searchVolume: string;
  priority: string;
}

interface Profession {
  name: string;
  slug: string;
  category: string;
  searchVolume: string;
  priority: string;
  keywords: string[];
  avgProjectValue: number;
  webNeeds: string[];
}

interface GeneratedContent {
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  structuredData: any;
}

export class ContentGenerator {
  private templates: any;

  constructor(templates: any) {
    this.templates = templates;
  }

  generateProfessionCityPage(profession: Profession, city: City): GeneratedContent {
    const template = this.templates.contentTemplates['profession-city-landing'];
    
    // Generate title
    const title = this.replaceVariables(template.structure.h1, { profession, city });
    
    // Generate meta description
    const metaDescription = this.replaceVariables(
      `Vytvořte si profesionální web pro ${profession.name.toLowerCase()} v ${city.name} za 10 minut s AI. Bez programování, za 580 Kč/měsíc. Trial za 70 Kč!`,
      { profession, city }
    );

    // Generate content sections
    const sections = template.structure.sections.map((section: any) => {
      return this.generateSection(section, { profession, city });
    }).join('\n\n');

    // Generate FAQ
    const faq = template.structure.faq.map((item: any) => {
      const question = this.replaceVariables(item.q, { profession, city });
      const answer = this.replaceVariables(item.a, { profession, city });
      return `**${question}**\n${answer}`;
    }).join('\n\n');

    const content = `
${this.generateHeroSection(template.structure.hero, { profession, city })}

${sections}

## Často kladené dotazy

${faq}

## Začněte ještě dnes

Připojte se k tisícům spokojených podnikatelů v ${city.name}. Vytvořte si web pro ${profession.name.toLowerCase()} za 10 minut.

[Vyzkoušet Trial](/auth)
`.trim();

    return {
      title: title.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      h1: title,
      content,
      structuredData: this.generateStructuredData('LocalBusiness', { profession, city })
    };
  }

  generateCityPage(city: City): GeneratedContent {
    const template = this.templates.contentTemplates['city-landing'];
    
    const title = this.replaceVariables(template.structure.h1, { city });
    const metaDescription = `Profesionální tvorba webu v ${city.name} s AI. Bez programování, za 580 Kč/měsíc. Naklikejte si web za 10 minut. Trial za 70 Kč!`;

    const sections = template.structure.sections.map((section: any) => {
      return this.generateSection(section, { city });
    }).join('\\n\\n');

    const content = `
${this.generateHeroSection(template.structure.hero, { city })}

${sections}

## Nejoblíbenější typy webů v ${city.name}

- **Autoservisy** - rezervace termínů, ceník služeb
- **Kadeřnictví** - galerie účesů, online rezervace
- **Restaurace** - menu, rezervace stolů
- **Truhlářství** - portfolio prací, kontakt
- **Elektrikáři** - služby, reference, pohotovost

[Vyzkoušet Trial](/auth)
`.trim();

    return {
      title: title.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      h1: title,
      content,
      structuredData: this.generateStructuredData('Organization', { city })
    };
  }

  generateProfessionTemplate(profession: Profession): GeneratedContent {
    const template = this.templates.contentTemplates['profession-template'];
    
    const title = this.replaceVariables(template.structure.h1, { profession });
    const metaDescription = `Hotová šablona webu pro ${profession.name.toLowerCase()}. Profesionální design, optimalizovaná pro ${profession.category.toLowerCase()}. Naklikejte si za 5 minut!`;

    const sections = template.structure.sections.map((section: any) => {
      return this.generateSection(section, { profession });
    }).join('\\n\\n');

    const content = `
${this.generateHeroSection(template.structure.hero, { profession })}

${sections}

## Funkce šablony pro ${profession.name}

${profession.webNeeds.map(need => `- ✅ ${need}`).join('\\n')}

## Klíčová slova pro SEO

Šablona je optimalizována pro: ${profession.keywords.join(', ')}

[Použít tuto šablonu](/auth)
`.trim();

    return {
      title: title.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      h1: title,
      content,
      structuredData: this.generateStructuredData('WebPage', { profession })
    };
  }

  generateHowToGuide(profession: Profession): GeneratedContent {
    const template = this.templates.contentTemplates['how-to-guide'];
    
    const title = this.replaceVariables(template.structure.h1, { profession });
    const metaDescription = `Kompletní návod jak si udělat web pro ${profession.name.toLowerCase()}. S AI za 10 minut, bez programování. Sledujte náš krok za krokem průvodce.`;

    const sections = template.structure.sections.map((section: any) => {
      return this.generateSection(section, { profession });
    }).join('\\n\\n');

    const content = `
${this.generateHeroSection(template.structure.hero, { profession })}

${sections}

## Co je důležité pro web ${profession.name}

Pro úspěšný web ${profession.name.toLowerCase()} je klíčové mít:

${profession.webNeeds.map(need => `- **${need}** - základ každého webu pro ${profession.category.toLowerCase()}`).join('\\n')}

## Příklad promptu pro AI

*"Vytvoř mi web pro ${profession.name.toLowerCase()} s ${profession.webNeeds.slice(0, 3).join(', ')}. Použij barvy které se hodí k ${profession.category.toLowerCase()}u."*

[Začít tvořit web](/auth)
`.trim();

    return {
      title: title.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      h1: title,
      content,
      structuredData: this.generateStructuredData('HowTo', { profession })
    };
  }

  generateCompetitorPage(competitor: string): GeneratedContent {
    const template = this.templates.contentTemplates['competitor-comparison'];
    
    const title = this.replaceVariables(template.structure.h1, { competitor });
    const metaDescription = `Hledáte alternativu k ${competitor.charAt(0).toUpperCase() + competitor.slice(1)}? Naklikám.cz je rychlejší, levnější a 100% v češtině. Trial za 70 Kč!`;

    const sections = template.structure.sections.map((section: any) => {
      return this.generateSection(section, { competitor });
    }).join('\\n\\n');

    const content = `
${this.generateHeroSection(template.structure.hero, { competitor })}

${sections}

## Proč přejít z ${competitor} na Naklikám.cz?

### 🇨🇿 100% česky
Zatímco ${competitor} je v angličtině, my mluvíme česky. Podpora, rozhraní, platby - vše v češtině.

### 💰 Levnější
${competitor} stojí $20+ měsíčně, my jen 580 Kč. Plus žádné skryté poplatky.

### 🤖 Pokročilejší AI
Naše AI rozumí českému kontextu a vytvoří web přesně pro český trh.

### ⚡ Rychlejší
Web máte hotový za 10 minut, ne za hodiny jako u ${competitor}.

[Vyzkoušet Trial](/auth)
`.trim();

    return {
      title: title.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      h1: title,
      content,
      structuredData: this.generateStructuredData('WebPage', { competitor })
    };
  }

  private generateHeroSection(hero: any, variables: any): string {
    const headline = this.replaceVariables(hero.headline, variables);
    const subheadline = this.replaceVariables(hero.subheadline, variables);
    const cta = hero.cta || 'Vyzkoušet Trial';

    return `# ${headline}

${subheadline}

[${cta}](/auth)`;
  }

  private generateSection(section: any, variables: any): string {
    const title = this.replaceVariables(section.title, variables);
    let content = '';

    switch (section.type) {
      case 'benefits':
        content = section.content.map((item: string) => 
          this.replaceVariables(item, variables)
        ).join('\n');
        break;
      
      case 'local-stats':
        content = this.replaceVariables(section.content, variables);
        break;

      case 'profession-specific':
        if (variables.profession && variables.profession.webNeeds) {
          content = variables.profession.webNeeds.map((need: string) => 
            `- ✅ ${need}`
          ).join('\n');
        }
        break;

      case 'how-it-works':
        content = section.steps.map((step: string, index: number) => 
          `${index + 1}. ${this.replaceVariables(step, variables)}`
        ).join('\n');
        break;

      case 'step-by-step':
        content = section.steps.map((step: string) => 
          this.replaceVariables(step, variables)
        ).join('\n\n');
        break;

      case 'comparison-table':
        if (section.comparison) {
          content = Object.entries(section.comparison).map(([key, value]) => 
            `**${key}**: ${this.replaceVariables(value as string, variables)}`
          ).join('\n');
        }
        break;

      default:
        content = section.content ? this.replaceVariables(section.content, variables) : '';
    }

    return `## ${title}\n\n${content}`;
  }

  private replaceVariables(text: string, variables: any): string {
    let result = text;
    
    // Replace profession variables
    if (variables.profession) {
      result = result.replace(/\{\{profession\.name\}\}/g, variables.profession.name);
      result = result.replace(/\{\{profession\.slug\}\}/g, variables.profession.slug);
      result = result.replace(/\{\{profession\.category\}\}/g, variables.profession.category);
      result = result.replace(/\{\{profession\.avgProjectValue\}\}/g, variables.profession.avgProjectValue.toLocaleString());
    }

    // Replace city variables
    if (variables.city) {
      result = result.replace(/\{\{city\.name\}\}/g, variables.city.name);
      result = result.replace(/\{\{city\.slug\}\}/g, variables.city.slug);
      result = result.replace(/\{\{city\.region\}\}/g, variables.city.region);
      result = result.replace(/\{\{city\.population\}\}/g, variables.city.population.toLocaleString());
    }

    // Replace competitor variables
    if (variables.competitor) {
      result = result.replace(/\{\{competitor\}\}/g, variables.competitor);
    }

    // Replace Math expressions (simple ones)
    result = result.replace(/\{\{Math\.round\(city\.population \* ([0-9.]+)\)\}\}/g, (match, multiplier) => {
      if (variables.city) {
        return Math.round(variables.city.population * parseFloat(multiplier)).toString();
      }
      return match;
    });

    return result;
  }

  private generateStructuredData(type: string, variables: any): any {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type
    };

    switch (type) {
      case 'LocalBusiness':
        return {
          ...baseData,
          name: `${variables.profession.name} - Naklikám.cz`,
          description: `Profesionální web pro ${variables.profession.name} v ${variables.city.name}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: variables.city.name,
            addressRegion: variables.city.region,
            addressCountry: 'CZ'
          },
          serviceArea: variables.city.name,
          priceRange: '580 Kč/měsíc'
        };

      case 'Organization':
        return {
          ...baseData,
          name: 'Naklikám.cz',
          description: `Tvorba webů v ${variables.city.name} s umělou inteligencí`,
          url: 'https://naklikam.cz',
          serviceArea: variables.city.name
        };

      case 'HowTo':
        return {
          ...baseData,
          name: `Jak udělat web pro ${variables.profession.name}`,
          description: `Návod jak vytvořit web pro ${variables.profession.name} s AI`,
          totalTime: 'PT10M',
          supply: ['Nápad na web', 'Internetové připojení'],
          tool: 'Naklikám.cz AI'
        };

      default:
        return {
          ...baseData,
          name: 'Naklikám.cz',
          description: 'Tvorba webů s umělou inteligencí'
        };
    }
  }
}

export default ContentGenerator;