# Vercel Personal Access Token Setup

Tento dokument popisuje, jak nastavit Vercel Personal Access Token pro deployment integraci.

## 1. Vytvoření Personal Access Token

1. Jděte na [Vercel Account Settings](https://vercel.com/account/tokens)
2. Klikněte na "Create Token"
3. Zadejte popis tokenu (např. "Naklikam.cz Integration")
4. Vyberte expiration (doporučeno: 1 rok)
5. Vyberte scope:
   - **Personal Account** pro osobní projekty
   - **Team** pokud pracujete s týmem
6. Klikněte "Create Token"

## 2. Použití tokenu v aplikaci

1. V aplikaci klikněte na "Connect with Personal Access Token"
2. Zadejte váš token do formuláře
3. Klikněte "Connect"
4. Token se uloží lokálně v browseru

## 3. Bezpečnost

- **Nikdy nesdílejte** svůj Personal Access Token
- Token má přístup k vašemu Vercel účtu, takže ho chraňte jako heslo
- Nastavte expiraci tokenu pro zvýšení bezpečnosti
- Můžete token kdykoliv odvolat ve Vercel nastavení

## 4. Oprávnění tokenu

Token umožňuje aplikaci:
- Číst informace o vašem účtu
- Zobrazit seznam vašich projektů  
- Vytvářet nové projekty
- Sledovat status deploymentů
- Propojovat projekty s GitHub repozitáři

## 5. Troubleshooting

### "Invalid Vercel token" chyba
- Zkontrolujte, zda je token správně zkopírován
- Ověřte, že token není expirovaný
- Ujistěte se, že token má správný scope

### Nenacházejí se projekty
- Zkontrolujte, zda token má přístup ke správnému účtu/týmu
- Ověřte oprávnění tokenu

### Nelze vytvořit projekt
- Zkontrolujte, zda máte dostatečná oprávnění
- Ověřte, že název projektu není již použitý

## 6. Výhody Personal Access Token

- **Jednoduchost**: Žádný složitý OAuth flow
- **Kontrola**: Plná kontrola nad oprávněními
- **Bezpečnost**: Můžete token kdykoliv odvolat
- **Flexibilita**: Funguje pro osobní i týmové účty

## API použití

Aplikace používá tyto Vercel API endpointy:
- `GET https://api.vercel.com/v2/user` - informace o uživateli
- `GET https://api.vercel.com/v9/projects` - seznam projektů  
- `POST https://api.vercel.com/v10/projects` - vytvoření projektu
- `GET https://api.vercel.com/v13/deployments/[id]` - detail deploymentu