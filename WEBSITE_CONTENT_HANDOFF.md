# Website content & build pack — Alessandro Facchini

**For the GitHub-connected session.** Everything below is final, ready-to-paste content for
`index.html` in `alessandrofacchini-git.github.io`. Sections are ordered in the order you should
apply them. Each one says exactly what to replace.

Companion asset folder: `WEBSITE/assets_new/` — five favicon files, described in §7.

**Already verified.** Every instruction in this file was applied to a copy of the current
`index.html` and the result was loaded in a browser. All ten toggles open and close with the right
labels, both JSON-LD blocks parse (`Person` ends up with 14 `knowsAbout` entries and 3 `alumniOf`),
both DOI links resolve, and the page has no horizontal overflow at 1280px or at 279px, with every
panel open. The built page is at `WEBSITE/index_PREVIEW_do_not_commit.html` if you want to open it
locally first — it is a preview only, not the file to commit.

---

## Contents

1. Hero lede (replace)
2. Research Interests (replace)
3. Work in Progress — 2 items (replace)
4. Research Contributions — 8 items (replace the two placeholders)
5. CSS additions (3 small rules)
6. JavaScript patch (1 function, so the toggle label can differ per section)
7. Favicon replacement
8. Meta / SEO / structured-data updates
9. Open items — things only Alessandro can supply

---

## 1. Hero lede — replace

Replace the contents of `<p class="hero-lede">…</p>` in the `<header class="hero">` block with:

```html
<p class="hero-lede">Hi, I’m Alessandro — an economist working across behavioural economics, labour economics, and public policy. A single thread runs through most of what I do: separating what is genuinely a property of a person — a preference, a bias, a manager’s style — from what is a property of the situation the person is placed in, and building the tests that can tell the two apart. I combine revealed-preference and nonparametric methods with quasi-experimental designs on large administrative and experimental data, and I have worked on these questions in research roles at MIT, Bocconi, Princeton, Sciences Po and the OECD. I am drawn to questions where a sharper method changes the answer, and where the answer changes what a policymaker would do.</p>
```

---

## 2. Research Interests — replace

Replace the contents of `<div class="prose">…</div>` inside `<section id="research">` with:

```html
<div class="prose">
  <p>My research sits between econometric methodology and applied microeconomics. On the methodological side I work on revealed preference and nonparametric identification: what can be learned about preferences, rationality and welfare from choice data alone, under assumptions weak enough that a rejection is informative about behaviour rather than about a functional form. That includes tests that stay valid when preferences are stochastic, state-dependent, or changing over time, and inference for the moment inequalities such tests generate.</p>
  <p>On the applied side I hold the same standard of evidence to questions about labour markets, organisations, inequality and public policy — how managers shape the way work is organised and what that does to output; how early-life circumstances and educational institutions generate inequality of opportunity; how wage floors and wage ceilings reshape pay, effort and turnover in the public sector. This work uses large administrative and geospatial panels, matched worker–manager data, and the quasi-experimental toolkit: event studies with staggered adoption and heterogeneous treatment effects, regression discontinuity, shift-share and lottery-based designs.</p>
  <p>What connects the two sides is a preference for methods that make their own assumptions visible, and for results that are still standing after the design has been given every chance to break them.</p>
</div>
```

---

## 3. Work in Progress — replace both items

Replace the whole `<ul class="papers">…</ul>` inside `<section id="work-in-progress">` with the block
below. The two abstracts deliberately stay about as long as the current ones.

```html
<ul class="papers">

  <li class="paper">
    <div class="num" aria-hidden="true">01</div>
    <div>
      <!-- Alternative title, kept for later:
           Present Bias Is a Property of the Moment, Not the Person
           — A Revealed-Preference Audit of the Present-Bias Parameter -->
      <h3 class="paper-title">Disentangling Rationality: A Nonparametric Approach to Intertemporal Choice, Self-Control, and Present Bias</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="wip-1">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read abstract" data-less="Hide abstract">Read abstract</span>
      </button>
      <div class="abstract" id="wip-1" hidden>
        <p>Why do people act against their own plans — procrastinating on unpleasant tasks, saving less than they intended, choosing differently about food, substances or screens than they had decided to? Economics has a standard answer, <em>present bias</em>, and a standard way of recording it: one parameter, attached to a person, carried across goods, states and settings, and calibrated into optimal-tax and default-design exercises. Yet the field’s own published estimates of that parameter, placed side by side, span nearly the whole range the theory allows, and even its best-known regularities do not hold across elicitation methods. The usual reading of that spread is imprecision. This project takes seriously a different one — that the spread is the parameter failing to be a single thing — and asks the prior question the literature tends to skip: <strong>is there one present-bias parameter, and if so, of what is it a property? Of a person, of a person in a domain, or of a moment?</strong></p>
        <p>The question is answered with research designs that share no data, no subjects and no identification strategy, so that agreement between them means something: a randomised, within-person manipulation of the state a decision is taken in, already embedded in the canonical real-effort panel; the cross-domain correlation of <em>individual</em> present bias, corrected for the sampling noise in each individual estimate rather than reported raw; and a protocol that holds the price grid, the delay and the subjects fixed and varies only the good, so that the most cited fact in this literature can be tested as a claim about the timing of consumption rather than about commodities.</p>
        <p>Reaching those answers required repairing the instrument first. The statistic conventionally used to ask whether present bias depends on some state does not, in fact, test state-dependence: under nulls in which the parameter is stochastic and heterogeneous but independent of the state, it rejects almost always. The project therefore develops a revealed-preference characterisation of state-dependent quasi-hyperbolic discounting; a nested ladder of restrictions on it, with the result that its unrestricted rung has no testable content, so that everything testable lives in the restrictions; the moment-inequality statistic each rung actually requires; and Monte-Carlo certificates of size and power for every test before any of them touches data. It also audits the estimator itself, which is an exponential of estimates and therefore carries a bias that can manufacture a state gradient out of a world where the parameter is exactly constant.</p>
        <p>The payoff is a framework for asking <strong>when observed impatience is evidence of a self-control problem, when it is not, and what choices can and cannot reveal about self-control</strong>. It supports treating present bias not necessarily as a fixed individual trait but as a potentially state- and context-dependent feature of decision-making, and it takes that reading to welfare: whether demand for commitment can serve as the certifier the literature calls it, and whether the measured welfare wedge is located in people or in the environments they act in. Both have direct implications for how behavioural parameters are measured and reported, how welfare is evaluated when the analyst cannot appeal to a stable preference, and where choice architecture is worth applying.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">02</div>
    <div>
      <h3 class="paper-title">Inequality of Opportunity: Early Education, Life-Course Trajectories, and Public Policy</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="wip-2">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read abstract" data-less="Hide abstract">Read abstract</span>
      </button>
      <div class="abstract" id="wip-2" hidden>
        <p>Inequalities that appear early in life are strikingly persistent — but persistence is not inevitability, and the policy question is <strong>where along a trajectory an intervention actually changes the path</strong>. This project studies how family background, educational environments and institutional access generate inequality of opportunity over the life course, and which policy margins can most effectively alter it.</p>
        <p>Its premise is that the two dominant approaches to the question answer different things and are stronger together than apart. Descriptive work documents correlations between early circumstances and later outcomes; causal work identifies the effect of one intervention over a short horizon. Structured correlations across time reveal the <em>architecture</em> of a life course — which transitions are load-bearing, where disadvantage compounds, which margins are worth an identification strategy at all. Causal analysis then disciplines that architecture by sequencing its links and pricing the interventions that operate on them.</p>
        <p>The empirical setting is Chile, which pairs unusually rich individual-level and administrative data — linking students’ socio-economic background, test scores and educational trajectories over time, together with detailed information on teachers and schools — with a sequence of major education reforms that generate quasi-random variation at different points of the trajectory. The analysis proceeds in two stages. It first maps early-life and educational trajectories, building on the circumstance-based measurement of inequality of opportunity to identify systematic patterns linking family background, school attachment, educational progression and later outcomes. It then turns to identification: administrative eligibility thresholds and later expansions in the targeted school-funding scheme, which support regression-discontinuity and event-study difference-in-differences estimates of the effect of additional resources and governance requirements; the staggered roll-out of extended instructional time and the extension of compulsory schooling, which allow difference-in-differences estimation robust to heterogeneous treatment effects; and the centralised, lottery-based admission system, which delivers random variation in access to oversubscribed schools and therefore clean estimates of school, teacher and peer effects. Throughout, heterogeneity is the object of interest rather than a robustness check: which students, in which schools, from which backgrounds.</p>
        <p>The contribution is to connect the structure of inequality of opportunity to its causal mechanisms within a single setting. Measures of inequality of opportunity are increasingly used to describe how fair an outcome distribution is, but they are rarely taken into administrative data and asked which concrete policy margins move them. By combining life-course analysis with credible identification, the project aims to move past documenting disparities toward saying when, where and for whom public policy can genuinely widen the set of opportunities open to a child — rather than reducing disparities in outcomes after the fact.</p>
      </div>
    </div>
  </li>

</ul>
```

---

## 4. Research Contributions — replace both placeholders

Replace the whole `<ul class="papers">…</ul>` inside `<section id="contributions">` with the block below.

Two structural notes:

* **The lead paragraph** (`<p class="sec-lead">`) is what does the work of framing the section
  honestly without diminishing the role. If you would rather not have it, delete it — but I
  recommend keeping it.
* **Items 07 and 08** are **live by default** and are marked with a fence comment. To hide either
  one while keeping it in the HTML, add the single word `hidden` to its `<li>`:

  ```html
  <li class="paper" hidden>          <!-- item 08 is now invisible, still in the file -->
  ```

  The stylesheet already carries `[hidden]{display:none!important}`, and `hidden` also removes the
  item from the accessibility tree and from search-engine text, so this is a genuine hide rather
  than a visual one. It is a one-word edit to reverse. (The §5 CSS change moves the closing rule
  from `.paper:last-child` to the list itself, so the bottom border stays correct no matter which
  items are hidden.)

```html
<p class="sec-lead">Projects I have worked on substantially as a pre-doctoral researcher, research assistant or policy analyst. I am not an author on these; my involvement has typically spanned the empirical design, the estimation pipeline and the analysis. The researchers leading each project are named alongside it.</p>

<ul class="papers">

  <li class="paper">
    <div class="num" aria-hidden="true">01</div>
    <div>
      <h3 class="paper-title">Testing Rationality When Tastes Can Change: Revealed Preference Meets Instrumental Variables</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-1">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-1" hidden>
        <p class="byline">Dave Donaldson (MIT)</p>
        <p>The classical revealed-preference test asks whether a finite set of price–quantity observations can be rationalised by one stable utility function. Its great strength is that it assumes no functional form; its weakness is that when it rejects, an irrational consumer and a consumer whose tastes simply moved look identical. This project builds a test that does not need stable tastes at all. Revealed preference does not deliver a point prediction for how quantities respond to a price change — it delivers a corridor of admissible responses. Writing that corridor as a system of inequalities, and treating any departure from it as an unobserved taste displacement, converts the rationality question into one an instrument can answer, in the spirit of testing a quantitative model’s causal predictions rather than its in-sample fit. The null becomes not that preferences are stable but that they do not co-move with prices: tastes may jump every period, for every consumer, so long as they do not respond to the price environment. The work spans the theory of the pairwise construction that makes this possible, the design of the randomised price environment and of the instrument built from it, inference for the resulting moment inequalities, and Monte-Carlo evidence on size and power across demand systems, measurement error, taste drift and non-optimising choice.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">02</div>
    <div>
      <h3 class="paper-title">Managers and the Organisation of Remote Work</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-2">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-2" hidden>
        <p class="byline">Erika Deserranno (Bocconi University) · Maria De Paola (University of Calabria and INPS) · Silvia Vannutelli (Northwestern University)</p>
        <p>Remote work now accounts for a large and durable share of paid workdays, and workers differ enormously not only in how much of it they do but in how it is <em>organised</em>: whether it is spread evenly across a team or captured by a few people, and whether it always falls on the same weekdays. Some of that variation is industry, job and preference. This project asks how much of it is the manager, and whether the answer shows up in output.</p>
        <p>The setting is INPS, Italy’s social security agency: several hundred territorial offices processing pension, unemployment, disability and family claims, daily remote-work records for around thirty thousand employees, monthly office-level productivity measured in complexity-weighted claims per worker, and an anti-corruption rule that rotates managers between offices for reasons largely unrelated to an office’s performance. Manager fixed effects estimated on the worker–month panel separate a manager’s style from worker composition and from the calendar; a matched, stacked event study around manager changes then asks what happens to productivity when an office receives a manager with a different style. Because the amount of remote work can be held fixed in that second stage, <em>how</em> remote work is organised can be read separately from <em>how much</em> of it there is — which is where the project departs from a literature that has largely studied intensity alone, and in a public-sector setting where exit is rare and pay is rigid.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">03</div>
    <div>
      <h3 class="paper-title">Discrete Choice, Matching, and Equilibrium Transport</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-3">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-3" hidden>
        <p class="byline">Alfred Galichon (New York University and Sciences Po) · Antoine Jacquet (Sciences Po)</p>
        <p>Discrete choice models sit at the centre of demand estimation, matching and equilibrium pricing, and their mathematics is roughly half optimisation theory and half probability. This strand covers several connected projects. The first is the book <em>Discrete Choice Models: Mathematical Methods, Econometrics, and Data Science</em> (Alfred Galichon, forthcoming, Princeton University Press), which pairs its theory with an extensive appendix of Python demonstrations, and whose preface records research assistance at various stages of the project. The second is a lecture chapter on substitutability, equilibrium transport and matching models, which recovers a largely forgotten literature on Z- and M-functions to establish when coordinate-update algorithms such as nonlinear Jacobi and Sinkhorn converge, and uses substitutability rather than convexity to treat matching with transferable, imperfectly transferable and non-transferable utility inside one framework. The third is computational, on matching problems that resist the standard machinery: Scarf’s ordinal basis algorithm applied to near-feasible stable matchings with couples, the multi-unit assignment problem underlying combinatorial course allocation, and the Alkan–Gale approach to the existence and computation of matching equilibria.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">04</div>
    <div>
      <h3 class="paper-title">To Have and Have Not: How to Bridge the Gap in Opportunities</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-4">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-4" hidden>
        <p class="byline">OECD (2025), OECD Publishing, Paris · Centre on Well-being, Inclusion, Sustainability and Equal Opportunity (WISE) · <a href="https://doi.org/10.1787/dec143ad-en" target="_blank" rel="noopener">doi.org/10.1787/dec143ad-en</a></p>
        <p>The seventh in the OECD’s flagship series on inequality, and the first released under the Observatory on Social Mobility and Equal Opportunity. The report asks how much of the dispersion in market income across OECD countries is attributable to circumstances beyond an individual’s control — sex, place of birth, parental socio-economic background — rather than to effort and talent, and it does so with a measure of inequality of opportunity built on recent methodological advances and designed to align more closely with how citizens themselves judge economic fairness. Beyond levels and trends, it decomposes inequality of opportunity into the circumstances that drive it, asks for whom each circumstance matters most, contrasts household-level with individual-level measurement, and adds a geographic dimension: within-country disparities in access to education, employment and essential services. My statistical support and input on the measurement chapters and on the policy chapter are recorded in the report.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">05</div>
    <div>
      <h3 class="paper-title">Global Experiences of Discrimination</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-5">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-5" hidden>
        <p class="byline">OECD (2025), <em>OECD Policy Insights on Well-being, Inclusion and Equal Opportunity</em>, No. 22, OECD Publishing, Paris · WISE Centre · <a href="https://doi.org/10.1787/4b01b73c-en" target="_blank" rel="noopener">doi.org/10.1787/4b01b73c-en</a></p>
        <p>Self-reported discrimination rates are used to track the Sustainable Development Goals, but they are typically published without the social, institutional and economic context that shapes them, and the available data miss several protected grounds entirely. This brief assembles recently released global discrimination surveys, world values surveys, objective measures of inequality and qualitative accounts of individual experience to produce the broadest analysis of self-reported discrimination to date — wider in the countries it covers and in the grounds it can examine than the official statistics. It documents how reported discrimination varies across regions and across groups, and uses country-level regression analysis to separate the institutional, demographic, economic, cultural and knowledge-related factors associated with it. That includes an uncomfortable and policy-relevant result: more equal, more educated and more developed societies can report <em>more</em> discrimination, because expectations of equal treatment and awareness of one’s rights are higher there — which is precisely why the headline rate should not be read on its own.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">06</div>
    <div>
      <h3 class="paper-title">Understanding the Macroeconomic and Societal Impacts of the Living Wage</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-6">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-6" hidden>
        <p class="byline">OECD (2025), working paper · WISE Centre</p>
        <p>Whether the widespread adoption of a living wage can durably raise low-wage workers’ living standards depends on how the economy responds — and the evidence base is thinner and more fragile than the policy debate assumes. This paper reviews what is known about the impacts of living wage initiatives and, because those schemes are usually voluntary or bounded to a single city, complements it with a selected review of minimum wage increases in countries beyond the usual Anglophone evidence base. It covers wage inequality, in-work poverty, hours and employment, and price pass-through, and it is deliberately explicit about what the evidence cannot yet support: retrospective studies struggle to separate the policy from employers’ self-selection into it; prospective microsimulations import elasticities estimated at a much lower wage floor and typically assume immediate and universal compliance, which makes them upper bounds; and few studies follow adjustment beyond two or three years. Institutional context — coverage, enforcement, informality, indexation, wage-setting institutions — is treated as a first-order determinant of the effect rather than as a closing caveat.</p>
      </div>
    </div>
  </li>

  <!-- ============================================================
       OPTIONAL ITEMS 07 AND 08 start here. They are LIVE as written.
       To hide either one without removing it from the file, add the
       word  hidden  to its <li>, i.e.  <li class="paper" hidden>
       ============================================================ -->

  <li class="paper">
    <div class="num" aria-hidden="true">07</div>
    <div>
      <h3 class="paper-title">Maximum Wage and Organisational Performance</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-7">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-7" hidden>
        <p class="byline">Erika Deserranno (Bocconi University) · Matteo Ruzzante · Daniel Rogger (World Bank)</p>
        <p>A very large literature studies the minimum wage. There is far less evidence on the <em>maximum</em> wage, despite its growing policy salience. Liberia introduced one in 2019: a public-sector pay reform that abolished the discretionary allowances which had made up most of top earners’ compensation and replaced them with a standardised payscale and a binding wage ceiling, with the twin goals of compressing pay and cutting the wage bill. The reform took effect in most ministries at once, leaving a set of comparison ministries, and it produced a sharp, largely mechanical pay cut whose size is predicted almost exactly by an employee’s pre-reform position relative to the ceiling. The project combines payroll snapshots covering the universe of public employees, randomised spot-check audits of attendance and turnover, and 360-degree performance surveys covering entire units, to trace the effects on pay compression, exit, absenteeism and organisational performance. Because the cut falls overwhelmingly on managers while their staff sit below the ceiling, the design also identifies the spillover of a manager’s pay cut onto the team, alongside difference-in-differences, triple-difference and shift-share exposure strategies built at the team level.</p>
      </div>
    </div>
  </li>

  <li class="paper">
    <div class="num" aria-hidden="true">08</div>
    <div>
      <h3 class="paper-title">The Rise of the City and the Decline in Fertility</h3>
      <button class="toggle" type="button" data-abstract-toggle
              aria-expanded="false" aria-controls="con-8">
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg><span data-label data-more="Read more" data-less="Hide">Read more</span>
      </button>
      <div class="abstract" id="con-8" hidden>
        <p class="byline">Leonardo D’Amico (Princeton University) · Francesco Nuzzi (Harvard University)</p>
        <p>How much of the decline in US fertility over the past four decades is attributable to the rise of high-density cities, and specifically to what living in them costs? Agglomeration has pulled workers, especially skilled workers, into dense urban areas, where housing and the non-tradable goods that dominate the price of raising a child are considerably more expensive, and where wages do not on average keep pace. The project pairs a quantitative spatial model with fertility and location choice, amenable to general-equilibrium counterfactuals and extendable to heterogeneity by skill, with an empirical strategy for identifying the causal effect of housing costs on completed fertility. The empirical side builds a long panel of US commuting zones from census and survey microdata, linking population density, house-price-to-income ratios and childcare costs to total and age-specific fertility rates. Doing that credibly means harmonising variable definitions and geographic crosswalks across four decades, so that a gradient first observed in the cross-section can be followed through time rather than only across space.</p>
      </div>
    </div>
  </li>

</ul>
```

---

## 5. CSS additions

**(a) One existing rule changes.** Find this line:

```css
.paper:last-child{border-bottom:1px solid var(--rule)}
```

and replace it with:

```css
.papers{border-bottom:1px solid var(--rule)}
```

It renders identically today, but it keeps the closing rule of each list correct when an item is
hidden with the `hidden` attribute (see §4), which `:last-child` would not.

**(b) Add these rules** to the `<style>` block, immediately after the existing
`.abstract strong{…}` line and before the `@media (prefers-reduced-motion…)` block.

```css
/* lead paragraph under a section heading */
.sec-lead{max-width:var(--text);margin:0 0 30px;font-size:16.5px;line-height:1.65;color:var(--muted)}

/* collaborator / citation line at the top of an expandable panel */
.byline{margin:0 0 15px!important;padding-bottom:13px;border-bottom:1px solid var(--rule);
  font-family:var(--sans);font-size:13.5px;line-height:1.6;color:var(--muted);letter-spacing:.004em}
.byline em{font-style:italic;color:var(--ink-2)}
.byline a{color:var(--navy);text-decoration:underline;text-underline-offset:2px;
  text-decoration-thickness:1px;text-decoration-color:rgba(15,36,56,.3)}
.byline a:hover{text-decoration-color:var(--gold)}
```

And add one line to the existing `@media (max-width:900px)` block so the lead paragraph tightens on
phones:

```css
  .sec-lead{font-size:15.5px;margin-bottom:24px}
```

---

## 6. JavaScript patch

The current toggle hard-codes the words “Read abstract” / “Hide abstract”, which is wrong for the
Research Contributions items. Replace the **expandable abstracts** block in the inline `<script>`
with this (backwards compatible — any button without the new attributes keeps the old wording):

```js
  /* ---- expandable abstracts ------------------------------------------- */
  document.querySelectorAll("[data-abstract-toggle]").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    var lab  = btn.querySelector("[data-label]");
    var more = (lab && lab.getAttribute("data-more")) || "Read abstract";
    var less = (lab && lab.getAttribute("data-less")) || "Hide abstract";
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      if (lab) lab.textContent = open ? more : less;
    });
  });
```

---

## 7. Favicon replacement

The old mark was an “AF” drawn as four bare strokes. The replacement is a proper editorial serif
**AF monogram in gold on the site’s navy, with the site’s gold hairline rule beneath it** — the same
gold bar that sits under the H1 and under every section heading, so the icon is visibly part of the
same design system. It stays legible down to 16px.

**Files to overwrite** — all five are in `WEBSITE/assets_new/`:

| Put this file | at this path in the repo |
| --- | --- |
| `favicon.svg` | `assets/favicon.svg` |
| `favicon-32.png` | `assets/favicon-32.png` |
| `apple-touch-icon.png` | `assets/apple-touch-icon.png` (180×180, full-bleed navy — iOS applies its own rounding) |
| `icon-512.png` | `assets/icon-512.png` |
| `favicon.ico` | `favicon.ico` (repo root; contains 16/32/48) |

(`favicon-preview.png` is only a contact sheet for review — do **not** commit it.)

No `<head>` changes are needed: every filename is identical to what `index.html` already links.
The `mask-icon` colour `#0A1A29` still matches.

If it is easier to paste the SVG than to move files, this is the complete new `assets/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="AF">
  <rect width="64" height="64" rx="14" fill="#0A1A29"/>
  <path fill="#E0C48A" fill-rule="evenodd" d="M21.37 38.6L21.37 37.41Q24.42 37.13 24.42 36.54Q24.42 36.23 24.27 35.85L22.42 31.34L14.95 31.34Q13.41 35.04 13.41 36.06Q13.41 37.09 16.63 37.41L16.63 38.6L7.76 38.6L7.76 37.41Q9.1 37.32 9.96 36.83Q10.83 36.34 11.18 35.7Q11.53 35.07 14.07 28.91L19.14 16.6L22.21 16.6L28.58 32.43Q29.86 35.64 30.19 36.07Q30.52 36.51 31.2 36.9Q31.88 37.29 33.19 37.41L33.19 38.6ZM18.63 21.99L15.55 29.85L21.8 29.85ZM55.1 22.71Q54.55 21.26 53.46 19.95Q52.38 18.63 51.47 18.46Q50.56 18.3 48.77 18.3L45.4 18.3L45.4 26.81L47.52 26.81Q49.54 26.81 50.34 25.81Q51.14 24.82 51.49 23.05L52.65 23.05L52.65 32.15L51.49 32.15Q51.45 31.54 50.94 30.3Q50.44 29.07 49.64 28.64Q48.85 28.21 47.52 28.21L45.4 28.21L45.4 35.41Q45.4 36.12 45.84 36.64Q46.28 37.16 48.47 37.41L48.47 38.6L36.79 38.6L36.79 37.41Q38.81 37.26 39.38 36.87Q39.94 36.48 39.94 35.5L39.94 20.21Q39.94 19.21 39.31 18.81Q38.67 18.4 36.79 18.11L36.79 16.92L56.24 16.92L56.24 22.71Z"/>
  <rect x="20.5" y="44.2" width="23" height="2" rx="1" fill="#C8A253"/>
</svg>
```

The PNG and `.ico` versions still have to be replaced from `assets_new/` — they cannot be
regenerated from the SVG inside a chat.

---

## 8. Meta / SEO / structured data

**(a) Description** — used three times in `<head>` (`meta name="description"`,
`og:description`, `twitter:description`). Replace all three with the same string:

```
Alessandro Facchini — economist working on behavioural and labour economics, revealed preference and nonparametric econometrics, inequality of opportunity, and public policy.
```

**(b) `knowsAbout`** in the `Person` JSON-LD — replace the array with:

```json
"knowsAbout": ["Behavioral economics", "Labor economics", "Public policy",
               "Econometrics", "Revealed preference", "Nonparametric inference",
               "Intertemporal choice", "Present bias", "Moment inequalities",
               "Inequality of opportunity", "Personnel economics",
               "Remote work", "Matching models", "Causal inference"],
```

**(c) `description`** inside the same `Person` block — replace with the string from (a).

**(d) Optional but worth it** — add `alumniOf` to the `Person` block. Purely factual, and it helps
Google connect the entity.

⚠ `sameAs` is currently the **last** property in that object, so it has no trailing comma. Do not
just paste a new key after it — that produces invalid JSON and the whole `Person` block is silently
dropped. Replace the line, comma included. Find:

```json
  "sameAs": ["https://www.linkedin.com/in/alessandro-facchini-6b2490238/"]
```

and replace it with:

```json
  "sameAs": ["https://www.linkedin.com/in/alessandro-facchini-6b2490238/"],
  "alumniOf": [
    { "@type": "CollegeOrUniversity", "name": "Sciences Po" },
    { "@type": "CollegeOrUniversity", "name": "University of Bologna" },
    { "@type": "CollegeOrUniversity", "name": "Erasmus University Rotterdam" }
  ]
```

After the edit, confirm both `<script type="application/ld+json">` blocks still parse — in the
browser console, `[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent))`
must not throw.

**(e) `sitemap.xml`** — bump `<lastmod>` to the date you push.

---

## 9. Open items — things only Alessandro can supply

These are the only gaps. Everything else above is finished.

1. **Living Wage link.** Item 06 has no URL. Send the OECD link and it goes into the `byline`
   exactly like the two DOI links in items 04 and 05.
2. **Matteo Ruzzante’s affiliation** (item 07). Left without one rather than guessed. Same for
   confirming **Francesco Nuzzi (Harvard)** and **Leonardo D’Amico (Princeton)** in item 08 —
   these are taken from your CV and the project slides, worth a glance before publishing.
3. **`Three_Rationalities.pdf` sitting in the repo root is currently linked from nowhere.** Your
   current time paper is the separate 89-page manuscript, so the old chapter PDF is stale. Either
   delete it, or replace it with the current paper and I will add a “Draft (PDF)” link to
   Work in Progress item 01.
4. **`6550face.JPG` and `AF.png` in the repo root** are also unreferenced by `index.html`. Safe to
   delete if you want the repo tidy.
5. **Contributions I did *not* include**, because you did not list them — say the word if any should
   be added: the India district-matching / bank credit work with Dave Donaldson (it is on your CV
   and is a genuinely different skill showcase — large-scale geospatial record linkage);
   the neighbourhood-effects work with Lidia Panico at CRIS; the HIV gender-gap project with
   Daniela Iorio; the Ministry of Labour work on poverty and social exclusion.

---

## Verbatim source for the Galichon credit

For reference, in case anyone asks. From the Preface of *Discrete Choice Models: Mathematical
Methods, Econometrics, and Data Science* (Alfred Galichon, forthcoming, Princeton University Press):

> “Gabriele Buontempo, Enzo Di Pasquale, Alexandre d’Epinay, **Alessandro Facchini**, Clément Montes
> and Jiawei Qian have provided helpful research assistance at various stages of this project.”

And from the Foreword of *To Have and Have Not* (OECD, 2025): Chapters 1 and 2 were prepared “with
statistical support and input from Alessandro Facchini (WISE)”, and Chapter 4 “with statistical
support from Alessandro Facchini”.

---

## Order of operations for the GitHub session

1. Apply §5 (CSS) and §6 (JS) first — they are the scaffolding the new markup needs.
2. Then §1, §2, §3, §4 (content).
3. Then §7 (five asset files).
4. Then §8 (head + sitemap).
5. Build/preview, check that all ten toggles open and close, that the section nav still highlights
   correctly, and that the printed stylesheet still expands every abstract.
