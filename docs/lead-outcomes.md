# Lead outcomes

What happened to each web lead after the form was sent. GA4 stops at `generate_lead`;
this is the rest of the funnel, which only exists in the inbox. No names, emails or
addresses here: describe the lead, not the person.

"Market value" is the Cardmarket reference for the whole lot. "Paid" is what the seller
received.

## Log

| Logged | Lead | Outcome | Market value | Paid | Notes |
|---|---|---|---|---|---|
| 2026-09-25 | Unpriced collection, postal route | Bought | 38 EUR | 5 EUR | Cards in bad shape |
| 2026-09-25 | Unpriced collection, postal route | Bought | 80 EUR | 31.38 EUR | |
| 2026-09-25 | 42 cards, seller had already listed them | Rejected offer | | | Claimed a competing offer of more than double. Knew prices |
| 2026-09-25 | 1,000+ old cards found in a flat, over 2 kg, address flagged incomplete | No reply after first answer | | | Pre-2000 cards and an artist-signed card. Likely the most valuable lead of the batch |
| 2026-09-25 | Sealed product reseller (LOTR collector boosters), second contact in 3 months | Priced out on purpose | | | Not a collection. Sealed product added to the no-buy list the same day |

## Running totals

| Leads | Bought | Rejected | Went silent | Out of scope |
|---|---|---|---|---|
| 5 | 2 | 1 | 1 | 1 |

## Patterns so far

- **The funnel works end to end.** Both bought collections went label, parcel, price,
  acceptance and payment with no manual rescue.
- **Sellers who already list on Cardmarket are a poor fit.** They compare against retail
  prices, not against the effort saved, and the offer cannot win that comparison.
- **The site never said it did not buy sealed product**, so a reseller read "we buy
  Magic" as "we buy sealed". The no-buy list now says it.
- **Five leads is too few to read a conversion rate.** Keep logging and read it together
  with the funnel data from `plan-medicion-embudo.md`.
