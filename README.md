# gasdossier-stillewille

Statische landingspagina met downloadbare documenten over de gasnaheffing 2024-2025 op Landgoed De Stille Wille.

## Structuur

```
/
├── index.html                              # de pagina zelf
├── Dossier_V2.2.docx                       # juridisch dossier
├── Bezwaarbrief_Template_Bewoners.docx     # invulbare voorbeeldbrief
└── README.md                               # dit bestand
```

## Hosting

Gehost via Vercel. Automatische deploy bij elke push naar `main`.

- Vercel-URL: `https://gasdossier-stillewille.vercel.app`
- Eventueel later: custom domein via TransIP

## Updates

Bij een nieuwe versie van het dossier of de voorbeeldbrief:

1. Upload het nieuwe docx-bestand naar de repo (vervangt het oude).
2. Pas in `index.html` de versievermelding aan in de footer (regel onderaan).
3. Pas eventueel de bestandsgrootte in de downloadknoppen aan.
4. Commit en push — Vercel deployt automatisch.

## Indexering

De pagina staat op `noindex, nofollow` zodat hij niet via Google vindbaar wordt. Deelbaar alleen via directe URL.

## Eigenaarschap

Opgesteld namens gasverbruikende bewoners van Landgoed De Stille Wille. Mei 2026.
