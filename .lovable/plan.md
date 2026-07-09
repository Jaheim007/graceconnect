# SiteViral — Vertical services & functionality map

## 1. The 8 services shown on the landing page

Each becomes a category card in the marketplace slider AND an option in the "Propose" chooser (with a matching "Find" route).


| #   | Service                          | Who it's for (Find)                                      | Who it's for (Propose)              |
| --- | -------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| 1   | **Digital Products**             | People buying ebooks, templates, PDFs, courses           | Creators selling downloadable files |
| 2   | **Artisans / Home services**     | People needing plumbers, electricians, cleaners, repairs | Artisans offering on-site work      |
| 3   | **Beauty**                       | People booking hair, nails, barber, makeup               | Beauticians / barbers               |
| 4   | **Church**                       | Members / donors                                         | Churches & pastors                  |
| 5   | **Influencers**                  | Brands seeking collabs                                   | Influencers offering collabs        |
| 6   | **Sports / Coach**               | People wanting a coach or sport activity                 | Coaches, trainers                   |
| 7   | **Tutors / Teachers**            | Students / parents                                       | Tutors, home teachers               |
| 8   | **Music**                        | churches, artists needing musicians                      | Musicians etc                       |
| 9   | **Other Services** *(catch-all)* | Anything else                                            | Anyone with another kind of offer   |


Landing categories slider = these 9 tiles (no more "Events" as a separate one — events fits under General/Musicians/Church; confirm if you want it back).

## 2. Functionality matrix (from your table)

Legend: ✅ full · ◐ partial/optional · — not applicable


| Functionality                     | Digital | Artisans | Beauty | Church | Influencers | Sports | Tutors | Musicians | General |
| --------------------------------- | ------- | -------- | ------ | ------ | ----------- | ------ | ------ | --------- | ------- |
| Appointment / Booking             | —       | ✅        | ✅      | ✅      | ✅           | ✅      | ◐      | ✅         | ✅       |
| Digital product sales             | ✅       | —        | ◐      | ✅      | ◐           | —      | ✅      | —         | ✅       |
| Order generator (custom quote)    | ✅       | ✅        | ✅      | ✅      | ✅           | ✅      | ✅      | ✅         | ✅       |
| Offering / Donation / Gifts       | ✅       | —        | —      | ✅      | ✅           | —      | —      | —         | —       |
| Payment integration (MoMo + card) | ✅       | ✅        | ✅      | ✅      | ✅           | ✅      | ◐      | ✅         | ✅       |
| AI Book creation                  | ✅       | —        | ✅      | ✅      | ◐           | —      | ◐      | —         | ◐       |
| AI info / content creation        | ✅       | ◐        | ✅      | ✅      | ✅           | ◐      | ✅      | ◐         | ✅       |
| Comments on digital products      | ✅       | —        | ◐      | ✅      | ◐           | —      | ✅      | —         | ✅       |
| Location / Map / Area             | —       | ✅        | ✅      | ✅      | —           | ✅      | ✅      | ✅         | ✅       |
| Events + Tickets                  | ✅       | —        | ◐      | ◐      | ✅           | ✅      | ◐      | ✅         | ◐       |
| Reviews on person / establishment | —       | ✅        | ✅      | ◐      | ✅           | ✅      | ✅      | ✅         | ✅       |
| KYC                               | ✅       | ✅        | ✅      | ✅      | ✅           | ✅      | ✅      | ✅         | ✅       |
| Affiliation                       | ✅       | ✅        | ✅      | ✅      | ✅           | ✅      | ✅      | ✅         | ✅       |


## 3. What I'll change in code

**A. Central config (`src/lib/marketplaceCats.ts`)**

- Replace the current 9 entries with the 9 above (add Sports, Influencers stays, drop standalone Events, keep General as catch-all).
- Add a `modules` field per category listing enabled functionalities from the matrix, e.g.:
  ```ts
  modules: ['booking','orderGen','payments','location','reviews','kyc','affiliate']
  ```
- Add gradients/icons for the new Sports vertical.

**B. Landing (`MarketplaceCategories.tsx`)** — auto-renders from the new list, no structural change needed.

**C. Propose flow (`/start` activity chooser)** — the activities list will be regenerated from `MARKET_CATS` so it stays in sync with the landing (the crossed-out items in your screenshot — "rendez-vous", "commandes sur mesure", "événements", "livres IA", "formations IA", "paiements", "localisation", "avis", "dons", "affiliation" — disappear as standalone choices; they become **capabilities inside a vertical**, not verticals themselves).

**D. Per-vertical dashboards** — each vertical hub reads its `modules` array and only shows the tiles/features that apply (so a Digital seller doesn't see "Booking", an Artisan doesn't see "Digital product sales", etc.). Existing vertical hubs (Beauty, Church, Home, Events, Education) already exist; I'll add lightweight hubs for **Sports**, **Influencers**, **General**, and route Musicians into an existing or new hub.

**E. Find routes**

- Digital → `/discover?type=digital`
- Artisans → `/home/discover`
- Beauty → `/beauty/search`
- Church → `/church/discover`
- Influencers → `/discover?type=influencer`
- Sports → `/discover?type=sport` (new filter)
- Tutors → `/learn/discover`
- Musicians → `/discover?type=music`
- General → `/discover`

## 4. Open questions before I build

1. Do you want **Events** kept as its own tile on the landing, or fully folded into Church/Musicians/General?
2. For **Sports** and **Influencers**, do you want a full dedicated hub (like Beauty) now, or a lightweight "coming soon / lead capture" hub and we deepen it later?
3. Confirm my ✅/◐/— reading of the matrix — the columns in your screenshot get cut off on the right; want me to treat "Influencers" and "General services" exactly as I wrote them above?

Once you confirm, I'll implement A → E in one pass.