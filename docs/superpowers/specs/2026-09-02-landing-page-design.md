# Landing page design

Date: 2026-09-02  
Status: approved

## Goal

Replace the Passage of the Day home with a landing page that orients readers toward Church History and Church Writings, then offers era-based starting works.

## Layout

- `/` is a full-bleed hero using `assets/council-of-nicea.jpg` (slight zoom), dark overlay, 2 Peter 1:20–21 quote, and two CTAs.
- **Church History** → `/church-history/`
- **Church Writings** → `/church-fathers`
- Below the fold: **Great places to start** with eras 33–150, 150–313, 313–500, 500–modern day and the listed works.
- Hide site header and search strip on `/` only; keep the left rail. On small screens, show a floating hamburger so the rail remains reachable.
- Footer remains.

## Routing

- `/church-fathers` renders the existing Browse page.
- `/browse` redirects to `/church-fathers`.
- Rail Browse link targets `/church-fathers`.
- `/` no longer highlights the Read rail item; Read is `/read` only.

## Starter works

Link to catalog work IDs when present. For works not yet split as their own library entries, render a visible placeholder node (“Coming soon”) with a stable id for later wiring:

- Present: Didache, Polycarp martyrdom, 1 Clement, Apology, Against Heresies, Rich Man, Against Celsus, Confessions, Eusebius Church History, Homilies on Matthew, Pastoral Rule.
- Placeholder: Ignatius to the Romans, On the Incarnation, Fount of Knowledge, Bede.

## Out of scope

- Adding missing texts to the corpus.
- Top-bar navigation beyond the existing rail.
- Changing the church-history cinematic page itself.
