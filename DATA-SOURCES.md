# Data sources

Astronomical measurements are facts and not subject to copyright, but the people and institutions
who produced them deserve credit, and anyone checking this model's output deserves to know where
the numbers came from.

## Orbital elements

**The eight planets and Pluto** use *Keplerian Elements for Approximate Positions of the Major
Planets*, E. M. Standish, JPL/Caltech — the J2000 table with linear rates per century, valid
roughly 1800–2050. Work of the US Government, public domain.
<https://ssd.jpl.nasa.gov/planets/approx_pos.html>

**Ceres, Haumea, Makemake and Eris** use fixed osculating elements (semi-major axis, eccentricity,
inclination, node, argument of perihelion) with a mean motion derived from the orbital period.
Mean anomalies at epoch were fitted so that current heliocentric distances match published values.
Good to a fraction of a degree over this era; not survey grade.

**Comets 1P/Halley and 2P/Encke** use published osculating elements with perihelion passages of
9 February 1986 and 9 September 2000 respectively.

## Physical data

Diameters, rotation periods, moon counts and moon orbital elements are the standard published
values, principally from NASA's planetary fact sheets and the JPL Solar System Dynamics
satellite tables.

- <https://nssdc.gsfc.nasa.gov/planetary/factsheet/>
- <https://ssd.jpl.nasa.gov/sats/elem/>
- NASA, *Moons of Our Solar System* — 891 confirmed moons as of 25 March 2025:
  <https://science.nasa.gov/solar-system/moons/>
- Satellite counts current to April 2026 (Saturn 292, Jupiter 115, Uranus 29, Neptune 16)

## Stars

Positions are J2000 right ascension and declination, magnitudes are visual, taken from the
standard bright-star values. Only principal pattern stars are included — enough to recognise a
shape in the sky, not a substitute for an atlas. Constellation boundaries along the ecliptic
follow the IAU boundaries fixed by Eugène Delporte in 1930, which is why Ophiuchus appears and
the spans are unequal.

## The Moon

Abridged lunar theory following Jean Meeus, *Astronomical Algorithms*, carrying the principal
periodic terms — the equation of the centre, evection, variation and the annual equation. Lands
the principal phases within about half an hour. Not adequate for eclipse prediction, which is why
none is attempted.

## Eclipses

**Not computed by this model.** The table is transcribed from published catalogues:

- NASA Eclipse Web Site (Fred Espenak), *Solar Eclipses: 2021–2040* and *Lunar Eclipses:
  2021–2040* — <https://eclipse.gsfc.nasa.gov/>
- EclipseWise decade tables (Fred Espenak) — <https://eclipsewise.com/>
- Royal Observatory Greenwich, *How to see the 12 August 2026 partial solar eclipse* — the UK
  timings and percentages
- timeanddate.com eclipse listings, used for cross-checking dates and regions

## Verification sources

Used to check the model's output rather than to produce it:

- Star Walk, *How to see the planetary alignment in August 2026* — cross-checked the geocentric
  constellation of all seven planets for 12 August 2026
- NASA, *Total solar eclipse on 12 August 2026* — cross-checked the computed new moon

## A note on accuracy

Nothing here is fitted to a modern numerical ephemeris such as DE440, and no planetary
perturbations are modelled. For anything that matters — an observing plan, a telescope pointing,
a research result — use JPL Horizons. This is a model built to be understood, not a source of
truth.
