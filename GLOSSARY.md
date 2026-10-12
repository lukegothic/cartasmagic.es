# cartasmagic

Two sites that work together to buy Magic: The Gathering collections in Spain. The hub
(cartasmagic.es) explains what cards are worth. Vender (vendercartasmagic.es) buys them.
A daily report reads search and analytics data and tells the founder what to change.

## Domains

**Hub**:
cartasmagic.es, the informational site: what determines a card's price, what is worth money.
_Avoid_: blog, main site

**Vender**:
vendercartasmagic.es, the transactional site: how to sell, what is paid, when the money arrives.
_Avoid_: shop, store

**Owner domain**:
The domain a query belongs to by intent, informational to the hub and transactional to vender, whichever domain currently ranks for it.
_Avoid_: dueño, right domain

**Buy intent**:
A query from someone who wants to buy cards. Deliberately owned by neither domain.

## Report

**Report**:
The markdown document produced from search and analytics data and handed to an agent to apply.
_Avoid_: informe (in code only), aviso, email

**Finding**:
Something the data shows about a query or a page, before any judgement on whether to act on it.
_Spanish_: hallazgo
_Avoid_: alert, issue

**Candidate**:
A finding that maps to a concrete change in a concrete file, not yet checked against the discard reasons.

**Action**:
A candidate that passed every discard reason, safe for an agent to apply without the founder reviewing it.
_Spanish_: accion
_Avoid_: recommendation, task, suggestion

**Discard reason**:
The stated cause for which a candidate did not become an action, such as too little demand or a target changed too recently.
_Avoid_: filter, skip

**Watch list**:
Candidates discarded only for lack of demand, shown so an emerging signal is visible without an instruction attached.
_Avoid_: POCO VOLUMEN, low-volume actions

**Demand**:
How many times a query was searched, as seen by the domain with the most impressions for it. Impressions from two domains in the same results page are the same search, so they are never added together.
_Avoid_: total impressions, volume

**Target**:
The page field an action changes: a title, a description, the keywords or the visible copy of one page.

**Cooldown**:
The period after a target changes during which its numbers still describe the old version, so no candidate on it can become an action.
_Avoid_: grace period, freeze

**Query variant**:
A query with the same words as another in a different order. Search engines treat them as one search.
_Avoid_: synonym, related query

**Measurement alarm**:
A finding that says the analytics are wrong rather than that a page should change, such as more leads than submit attempts.
