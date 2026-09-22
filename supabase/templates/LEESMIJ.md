# E-mailtemplates van Supabase Auth

Deze map houdt bij wat er in het Supabase-dashboard onder
**Authentication → Emails** staat. Ze staan hier omdat ze anders alleen in
het dashboard bestaan en ongemerkt kunnen afwijken van wat deze repository
beschrijft.

| Bestand | Betekenis |
|---|---|
| `magic-link.oud.html` | Wat er live stond vóór de code-alinea (opgehaald 22-09-2026). |
| `magic-link.nieuw.html` | Wat er nu live hoort te staan. |
| `confirm-signup.oud.html` | Idem, voor de bevestigingsmail. |
| `confirm-signup.nieuw.html` | Idem. |

Bijwerken gaat via de workflow **Auth e-mailtemplates** (Actions →
workflow_dispatch):

* `tonen` — drukt de live tekst af, en ook als base64 zodat die byte-exact
  over te nemen is.
* `vergelijken` — legt de live tekst naast `*.oud.html`.
* `bijwerken` — zet `*.nieuw.html`, maar alléén als de live tekst nog precies
  gelijk is aan `*.oud.html`. Is er intussen in het dashboard iets gewijzigd,
  dan stopt de workflow zonder iets te doen.

Na een geslaagde `bijwerken` hoort `*.nieuw.html` naar `*.oud.html` te
verhuizen, zodat de volgende wijziging weer vanaf de live stand vertrekt.

## De code-alinea

`{{ .Token }}` is de code van acht cijfers die Supabase in dezelfde mail
meestuurt (`mailer_otp_length` staat op 8, `mailer_otp_exp` op 3600
seconden). Die code is er altijd al geweest, maar stond niet in de mail.

Hij bestaat omdat de link zelf op PKCE draait en dus alleen werkt in de
browser die hem aanvroeg. Wie zijn mail op de telefoon leest en op de laptop
wil lezen, komt met de link niet binnen; met de code wel. Op login.html staat
daarvoor het veld "Of typ hier de code uit de mail".
