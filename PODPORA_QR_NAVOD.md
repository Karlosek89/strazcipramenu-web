# Návod: jak vygenerovat 4 QR kódy pro podporu projektu

Stránka `podpora.html` čeká na 4 obrázky a 4 deep-link odkazy. Toto je
checklist co si připravit a kam to nahrát.

## 1. Vygenerovat 4 QR kódy přes qr-platba.cz

Otevři: **https://qr-platba.cz/**

Vyplň formulář (pro každou ze 4 částek znovu):

| Polčet | 50 Kč | 200 Kč | 500 Kč | Vlastní (žolík) |
|---|---|---|---|---|
| Číslo účtu | tvůj | tvůj | tvůj | tvůj |
| Částka | 50 | 200 | 500 | **PRÁZDNÉ** |
| Zpráva pro příjemce | `Studanky - Pivo` | `Studanky - Mapa` | `Studanky - Patron` | `Studanky - Dar` |
| Variabilní symbol | volitelné, doporučuju jiný pro každou (50/200/500/0) |

Pro každý:
1. Klikni "Vygenerovat QR".
2. **Stáhni obrázek** → ulož pod správným jménem:
   - `qr_50.png`
   - `qr_200.png`
   - `qr_500.png`
   - `qr_custom.png`
3. **Zkopíruj textový řetězec** (začíná `SPD*1.0*ACC:...`) — najdeš ho
   na stránce pod QR (sekce "Textová podoba" nebo podobně).

## 2. Nahradit placeholder obrázky

Skopíruj 4 stažené `.png` soubory do:
```
C:\Users\Admin\strazcipramenu-web\
```
(přepiš existující `qr_50.png` / `qr_200.png` / `qr_500.png` /
`qr_custom.png` — momentálně jsou tam jen placeholdery / starý
`qr_support.png`)

## 3. Upravit deep-link odkazy v `podpora.html`

V `podpora.html` najdi 3 odkazy s textem `VASE_IBAN` a nahraď je
URL-encoded SPD řetězci od qr-platba.cz.

Trik: na qr-platba.cz po vygenerování dej ten SPD text do online
**URL encoderu** (např. urlencoder.org) → dostaneš encoded podobu jako:
```
SPD%2A1.0%2AACC%3ACZ1234567890123456789012%2AAM%3A50.00%2ACC%3ACZK%2AMSG%3AStudanky%20-%20Pivo
```

A pak v HTML nahraď celý `href` u 3 tlačítek:

**Před (placeholder):**
```html
<a class="qr-button" href="https://qr-platba.cz/?platba=SPD%2A1.0%2AACC%3AVASE_IBAN%2AAM%3A50.00%2ACC%3ACZK%2AMSG%3AStudanky%20-%20Pivo">
```

**Po (s tvým IBAN):**
```html
<a class="qr-button" href="https://qr-platba.cz/?platba=SPD%2A1.0%2AACC%3ACZ1234567890123456789012%2AAM%3A50.00%2ACC%3ACZK%2AMSG%3AStudanky%20-%20Pivo">
```

Stejně pro 200 Kč a 500 Kč.

**Pozn:** žolík (qr_custom) tlačítko nemá — vlastní částka se nedá
předvyplnit, takže user prostě naskenuje QR a v bance si zadá sumu.

## 4. Commit + push

```bash
cd C:\Users\Admin\strazcipramenu-web
git add qr_50.png qr_200.png qr_500.png qr_custom.png podpora.html
git commit -m "Add real QR codes for donation"
git push
```

Za pár minut se ti to objeví na `strazcipramenu.cz/podpora.html`.

---

## Alternativní cesta — extrahovat SPD z bankovní app

Pokud máš ty 4 QR z bankovní aplikace (Smartbanking, George, Air Bank…),
otevři **https://webqr.com/** a:

1. Klikni na ikonku obrázku (nahraj soubor).
2. Vyber `qr_50.png`.
3. Web ti pod náhledem vypíše obsah QR — `SPD*1.0*ACC:...`.
4. Tento text dáš do URL encoderu a vložíš do HTML.

Funguje pro všechny 4 obrázky.
