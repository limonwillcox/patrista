# Douay-Rheims (Challoner), 1899 American Edition

The Douay-Rheims Bible, translated from the Latin Vulgate, Challoner revision as printed in the 1899 American edition. Public domain.

Source: eBible.org engDRA VPL (https://ebible.org/Scriptures/engDRA_vpl.zip, about page: "Public Domain"). scripts/import-bibles.ts --versification lxx lays the Vulgate's numbering (Greek Psalm numbers, Psalm titles counted as verses, Job 39-41 and other places where the Vulgate divides the verses differently) onto the KJV's books, chapters and verses by matching the wording, so a verse number here means the same verse as in the KJV. Daniel 3:24-90 (the Song of the Three Children) is joined onto 3:23; Daniel 13-14, Esther 10:4-16:24 and the deuterocanonical books are left out.

`scripts/dra-fix-versification.py` then moves the words of 39 passages to the KJV verse they translate,
where the wording alignment had run two verses into one (Matthew 5:4-5, whose order the Vulgate reverses;
Mark 4:40-41; Acts 8:8-9; 2 Corinthians 13:12-13 ...). Nothing is reworded. Eighteen KJV verses have no
Douay verse of their own (the title of the Song of Songs, Joshua 21:36-37 and others, where the Vulgate
has no counterpart or holds the words inside a neighbouring verse); they are empty strings, and the reader
shows them as absent with the reason on hover.
