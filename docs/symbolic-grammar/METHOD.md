# How to read the symbols

These are the rules the Connections tool follows. Each rule is merged from the sources it cites. Where all
the traditions agree, the rule is stated plainly. Where they disagree, the grammar entry says so instead.

Abbreviations: **TNE** = Jordan, *Through New Eyes* (chapter, page). **SM** = Jordan, *Symbolism: A
Manifesto*. **RTD** = Jordan, *Rebellion, Tyranny, and Dominion in the Book of Genesis*. **LoC** = Matthieu
Pageau, *The Language of Creation* (chapter). **DC** = Augustine, *On Christian Doctrine*. **AH** =
Irenaeus, *Against Heresies*. **DP** = Origen, *De Principiis*. **Bapt.** = Tertullian, *On Baptism*.
Leithart and Jonathan Pageau are cited from public essays and talks, listed in `data/connections/grammar/sources.json`.

## A. What a symbol is

1. **Symbols come from how God made the world.** They are not conventions an author invented, and not
   codes. (TNE ch. 3, p. 30; SM p. 1; LoC ch. 8; DC 1.2.2, "some things are also signs")
2. **Symbols belong to one system, and the system starts in Genesis.** The first chapters lay out the
   grid; the rest of the Bible unpacks it. (TNE ch. 1, p. 16, Rule 2; Matthieu Pageau: every story
   repeats the separation and union of heaven and earth in Genesis 1; Jonathan Pageau: follow a thread
   from its origin in Genesis to its full form in Christ)
3. **A symbol is a field of associations, not a one-word code.** It is used when a plain statement will
   not do. Do not reduce it to an idea. (TNE ch. 1, p. 15, Rule 1; SM pp. 4-5; DC 2.6.8)
4. **Symbols come in opposite pairs, and one symbol can carry opposite senses.** The thorn is a cursed
   tree; the serpent deceives in Genesis 3 and heals in Numbers 21. (SM p. 2; DC 3.25.35-36; LoC
   chs. 9, 13; Jonathan Pageau: every symbol has a good and a bad side)
5. **A symbol holds in a stated respect, not in every respect.** The lion stands for Christ and for the
   devil, in different respects. A type can also fail: the flood is a figure of baptism, but the world
   went back to sin. (TNE ch. 8, pp. 101-102; Bapt. 8)
6. **The same pattern works at every scale:** the cosmos, the person, the community, the nations.
   (LoC chs. 7, 20-22; TNE ch. 2, pp. 24-25)
7. **What points to God also shows what man should be.** God is a rock, so his people are stones.
   (TNE ch. 2, pp. 23, 26; SM p. 1)

## B. How a reading earns its place

8. **Start from the Bible's own usage.** Define a symbol from its nearest context and its first
   appearance, and read obscure passages by clear ones. (TNE ch. 1, p. 16, Rule 3; SM p. 1; RTD, Jordan's
   practice; DC 3.26-28)
9. **Shared words signal a shared story.** A rare word repeated between two passages, or a name that
   carries a meaning, is evidence of a link. (Jordan's practice in RTD; LoC chs. 28, 68, 73; Matthieu
   Pageau on Edom = red)
10. **Odd details are invitations.** A stumbling-block, an apparent contradiction or a strange action
    signals that something deeper is meant. Do not explain it away. (DP 4.1.15; TNE ch. 1, p. 14)
11. **Account for every detail, including the ordinary ones, and notice what is missing.** (Leithart;
    Matthieu Pageau)
12. **Two or three witnesses.** A pattern seen once is a guess. Scripture confirms by repetition and
    parallel. (SM p. 4; Deut 19:15)
13. **The history is real.** The spiritual sense does not cancel the plain sense; most of the narrative
    is literally true. Do not read plain speech as a figure either. (DP 4.1.19-20; LoC ch. 7; TNE ch. 1,
    p. 12; DC 3.10.14)
14. **Repetition is never identical.** The differences between instances matter as much as the
    likeness. A template that erases what is particular to each story is a misreading. (Leithart;
    Matthieu Pageau; Alastair Roberts's critique of LoC)
15. **A good reading makes hard texts clear and opens further discoveries.** (LoC ch. 4; Leithart)

## C. Checks against error

16. **Christ is the center.** The figures point to him, and some become clear only after the
    fulfillment. Jesus and the apostles are the model readers. (Luke 24:27; AH 4.26.1; SM p. 9;
    Leithart; Jonathan Pageau)
17. **The rule of faith keeps the stones in the king's picture.** True pieces can be arranged into a
    false whole. Church tradition and other readers are the check. (AH 1.8.1, 1.9.4; TNE ch. 1, p. 16,
    Rule 4; Leithart)
18. **The rule of charity.** A reading that does not build up love of God and neighbour has not
    understood the text. (DC 1.36.40-41)
19. **No borrowed frames.** Do not read Platonic philosophy, modern academic categories or pagan
    parallels into the text. Other literature may give clues, never warrant. (TNE ch. 1, pp. 16-17,
    Rules 3 and 5; Matthieu Pageau)
20. **Restraint with speculative systems.** Mark a tentative reading as tentative. Jordan does this with
    his own zodiac suggestion. (TNE ch. 5, pp. 59-61)
21. **Man's symbols are not God's.** Raising a human-made symbol to God's place is idolatry. (SM pp. 4,
    7-8)
22. **Be suspicious of chiasms forced onto narratives.** (Critics cited in the Pageau/Leithart notes)

## What the tool does with these rules

| Rule | In the tool |
|---|---|
| 4. Opposite senses | Each tagged occurrence of a symbol records its sense: blessed or cursed. The grammar entry does not. |
| 5. A stated respect | A tag names the role a figure plays in that story ("dove as mediator from above"), not a fixed meaning. |
| 8, 9. Usage and shared words | The word layer shows each word's first appearance and the rare words two passages share. |
| 10. Odd details | Tags can mark a detail as "odd", and the tool lists them as open questions. |
| 12. Two or three witnesses | A pattern needs at least two tagged instances. It counts as **established** only when the word layer, the sequence match and a Father or other witness agree. |
| 13. The history is real | The plain text always shows first. Tags sit beside it and never replace it. |
| 14. Never identical | When two stories match a sequence, the tool shows the steps that differ as well as the steps that match. |
| 16, 17. Christ and the rule of faith | Every sequence records how the tradition reads it toward Christ, and the witnesses show before the tool's own findings. |
| 20. Restraint | Every entry and every tag has a status: draft, tentative or reviewed. Nothing is reviewed until a person reviews it. |
| 22. Chiasms | No chiasm detection for narratives until there is a test that random text fails. |
