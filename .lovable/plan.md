Uppdatera default-bubbelstilen i `src/components/game/Bubble.tsx` (endast default-grenen, ej soap/sports/rubik/shapes) till "Gelatinous glass"-varianten:

- Rikare gradient: ljusare topp → mättad mitt → mörk botten per färg
- Inre skuggor (inset top-highlight + inset bottom-shadow) för 3D-djup
- Yttre drop shadow för lyft från brädet
- Tunn vit rim-highlight upptill
- Mjuk suddig glans-oval uppe till vänster (behåll befintlig men förstärk)
- Subtil färgad glow bakom bubblan

Bokstäver:
- Öka från `text-base md:text-lg lg:text-xl` till `text-xl md:text-2xl lg:text-3xl`
- Behåll `font-bold` + starkare `text-shadow` för läsbarhet
- Värdesiffra i hörnet lämnas oförändrad

Endast presentationsändringar — ingen spel-logik rörs.