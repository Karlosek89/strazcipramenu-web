# strazcipramenu.cz — landing page

Statický web na GitHub Pages s vlastní doménou.

## Soubory

| Soubor | Účel |
|---|---|
| `index.html` | Landing page se subscribe formulářem |
| `soukromi.html` | Privacy Policy (GDPR-compliant) |
| `dekujeme.html` | Thank you stránka po odeslání emailu |
| `styles.css` | Sdílené styly |
| `CNAME` | Custom doména pro GitHub Pages (`strazcipramenu.cz`) |

## Co musíš udělat před publishem

### 1. Doplň své jméno do `soukromi.html`

Najdi text `[TVÉ JMÉNO A PŘÍJMENÍ]` a nahraď ho.

### 2. Nastav Formspree formulář (= subscribe v `index.html`)

1. Jdi na [formspree.io](https://formspree.io) → registruj zdarma
2. Vytvoř nový formulář („New form")
3. Dostaneš endpoint URL ve tvaru `https://formspree.io/f/xyzABC123`
4. V `index.html` najdi `YOUR_FORM_ID` a nahraď ho tím ID (po lomítku `/f/`)

Free plán: 50 emailů/měsíc, dostatečné pro launch.

### 3. Nahraj na GitHub a aktivuj Pages

Viz „GitHub setup" níže.

### 4. Nastav DNS u Wedos

Viz „Wedos DNS" níže.

---

## GitHub setup (krok za krokem)

1. Jdi na [github.com](https://github.com) → přihlas se
2. Klikni **+** vpravo nahoře → **New repository**
3. **Repository name:** `strazcipramenu-web` (nebo cokoliv — nezáleží)
4. **Public** (nesmí být private, jinak Pages nefungují)
5. **Initialize with README**: nezaškrtávat
6. **Create repository**

Pak v repu klikni na **uploading an existing file** a nahraj všechny soubory z této složky (`index.html`, `soukromi.html`, `dekujeme.html`, `styles.css`, `CNAME`, `README.md`).

### Aktivace Pages

1. V repu: **Settings** → vlevo dole **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** main, folder: `/ (root)`
4. **Save**
5. Po pár minutách bude web dostupný na `https://tvojeusername.github.io/strazcipramenu-web`

### Custom doména

1. V Pages settings → **Custom domain:** zadat `strazcipramenu.cz` → **Save**
2. Zaškrtnout **Enforce HTTPS** (= za pár hodin, až se vystaví certifikát)
3. GitHub zkontroluje DNS — viz Wedos níže

---

## Wedos DNS setup

V administraci wedos.cz → **Domény** → `strazcipramenu.cz` → **DNS záznamy**.

### Přidat 4× A záznamy

| Typ | Název | Hodnota | TTL |
|---|---|---|---|
| A | @ | `185.199.108.153` | 1800 |
| A | @ | `185.199.109.153` | 1800 |
| A | @ | `185.199.110.153` | 1800 |
| A | @ | `185.199.111.153` | 1800 |

### Přidat CNAME pro www

| Typ | Název | Hodnota | TTL |
|---|---|---|---|
| CNAME | www | `tvojeusername.github.io` | 1800 |

(nahraď `tvojeusername` svým GitHub username)

### Pokud máš MX (email) záznamy pro ImproveMX

**Nechej je být** — A záznamy a MX záznamy se navzájem neovlivňují.

---

## Časový plán

| Krok | Doba |
|---|---|
| Vytvořit GitHub repo + upload souborů | 5 min |
| Zapnout Pages + custom domain | 2 min |
| Nastavit Formspree | 5 min |
| Nastavit DNS u Wedos | 5 min |
| **Propagace DNS** | 1-2 hodiny |
| **HTTPS certifikát** | 1-24 hodin |

Po DNS propagaci bude web dostupný na `https://strazcipramenu.cz` a `https://www.strazcipramenu.cz`.

---

## Update obsahu později

Stačí v GitHub UI klikat na soubor → tužka (edit) → udělat změnu → commit. Web se automaticky aktualizuje do 1-2 minut.
