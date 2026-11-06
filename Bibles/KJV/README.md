# King James Version

Public-domain KJV (1769 Oxford / Blayney text), United States.

Stored one book per file so the phone reader can load a single book instead of the whole Bible.

First packaged from thiagobodruk/bible `en_kjv.json`; the verse text is now eBible.org's (below).

## Text and notes

Every verse is the 1769 standard text of eBible.org's public-domain KJV (`eng-kjv_vpl.zip`), cleaned only
of the [brackets] round italic words and the pilcrows (`scripts/kjv-match-ebible.py`, which checks every
verse). The copy first imported here ran margin notes into the verses ("...shall not prevail against it.
Peter: this name signifies a rock"), left stray braces from its note markup, printed the epistles'
subscriptions as verse text, and spelled some names apart from 1769 (Genesis 25:4 "Abida" for "Abidah").
Anything it had after the end of a verse is now in the book's `notes` map ("chapter:verse" -> note), which
the reader shows behind a dagger:

- margin notes, most of them the 1611 translators' own;
- the conversions into American cents ("about fourteen cents") that later American printings added to the
  coin notes, labelled as such in the reader;
- the subscriptions after Paul's letters and Hebrews, in «guillemets», labelled as not part of the text.

The KJV is public domain except in the United Kingdom, where the Crown's letters patent apply.
