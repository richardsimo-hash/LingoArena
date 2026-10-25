# LingoArena learning path — structure and analysis

_Last updated 2026-10-25 · 100 units · 300 lessons · 900 phrases × 7 languages (en, es, fr, de, it, pt-PT, ja)_

## 1. How the path is built

| Layer | Size | Notes |
|---|---|---|
| Level band (CEFR) | 4 | A1 units 1–29 · A2 30–53 · B1 54–77 · B2 78–100 |
| Unit | 100 | One theme + one communicative/grammar focus; every 25th-ish unit is a review checkpoint (29, 53, 77, 100) |
| Lesson | 3 per unit | 3 new phrases each, never reused anywhere else in the course |
| Exercise | 10 per lesson | choose ×3, listen ×2, translate ×2, fill-in ×2, speak ×1 (adapted per phrase, see §3) |

Content lives in `src/lib/lingo/curriculum/{a1,a2,b1,b2}.ts` (units 6–100) and `src/lib/lingo/content.ts` (units 1–5, kept first so saved progress — stored as lesson indexes — stays valid).
Automated checks (`src/test/content.test.ts`) guarantee: exactly 100 units in CEFR order, complete translations, no phrase repeated in any language, a unit title in every interface language, 10 distinct exercises in every lesson, and fill-ins with a real blank and visible context for every target/native pair.

## 2. Progression mechanics

- **Nothing is locked.** Learners can open any lesson; the path *recommends* rather than gates.
- **Continue** button jumps to the first unfinished lesson (`nextLesson`), even if lessons were done out of order.
- **Level bands** collapse/expand with a progress bar per band; the band containing the next lesson opens automatically.
- **Practice modes follow the path.** Speech Arena, Grammar Battle and Fire Combo draw phrases from units up to two past the learner's furthest finished lesson (at least units 1–5), via `practiceConcepts`. Beginners no longer get B2 idioms; advanced learners still get variety from everything they have reached.
- **Free Talk** is level-independent but adapts in the prompt (CEFR hint, simplifies when the learner struggles).

## 3. Exercise logic review (and fixes in this release)

| Issue found | Effect | Fix |
|---|---|---|
| Fill-in always blanked the first word | One-word phrases ("Hello") became just "_____" with nothing to infer | Fill-in now blanks the longest word that appears once; one-word and unspaced (Japanese) phrases switch to another exercise type |
| Fill-in showed no meaning | Learner had to guess which phrase was meant | Prompt now includes the meaning in the learner's language |
| Japanese fill-ins | JS `\b` never matches in Japanese, so the full answer was shown | Japanese uses translate/choose instead |
| Prompts numbered before shuffling | "Fill-in challenge 4" appeared as question 6 | Numbers removed; the progress bar shows position |
| Repeated word in phrase | "Schritt für Schritt": blanking one copy revealed the answer | Only words occurring once can be blanked |

## 4. Analysis

**Strengths**
- Functional, situation-first progression: survival (A1) → transactions and past/future (A2) → opinions, narration, conditionals (B1) → argument, register, idiom (B2).
- Grammar is introduced through phrases learners need, with a named focus per unit, and recycled in later units (e.g. past tense in A2 units 30–31, reused in B1 storytelling and review units).
- Four skills are touched in every lesson (reading via choose, listening, writing via translate/fill-in, speaking), all offline-capable with no API cost.
- Review checkpoints at the end of each band consolidate the band's grammar in one realistic conversation.

**Gaps and risks**
1. **Phrase-based, not full CEFR.** 900 phrases (≈ 300 lessons × ~5 min ≈ 25 hours) give strong functional coverage, but CEFR B2 typically needs several hundred guided hours. Free Talk is the bridge; the path alone should be described as "B2 phrases and patterns", not "B2 certified".
2. **No spaced repetition.** Finished lessons are never resurfaced, so A1 phrases fade by B1. Highest-value next step (see §5).
3. **Instructions are English-only.** Exercise prompts ("Choose the … translation") and unit focus lines are in English even for Spanish speakers; unit titles are translated.
4. **Translation review.** Translations were authored for this release and validated for completeness and uniqueness only. They should be reviewed by native speakers, especially Japanese, German and European Portuguese idioms (B2 idiom units deliberately use the closest natural equivalent, not a literal translation).
5. **Assessment is per-answer only.** There is no placement test or end-of-band test, so learners who already know A1 must click through or skip manually.
6. **Bundle size.** The course adds ≈ 250 KB to the main JavaScript bundle (≈ 110 KB gzipped). Splitting each level into a lazily loaded chunk would keep first load fast.

## 5. Recommended next steps (priority order)

1. **Spaced review lesson**: after every 3 finished lessons, offer a 10-question review mixing phrases due by a simple Leitner schedule (store per-concept last-seen and correct-streak alongside `done`).
2. **Placement test**: 15 adaptive questions on first launch that set the "Continue" pointer to the right band.
3. **Localise exercise instructions** using the existing `i18n.ts` table (6 interface languages).
4. **Band checkpoint**: a scored 20-question test at units 29/53/77/100 with a certificate-style summary, feeding the Stats screen.
5. **Native review pass** on translations, tracked per language in the repo.
6. **Code-split** the four curriculum files by level.

## 6. Full unit list

### A1 · Beginner (units 1–29)

| Unit | Topic | Communicative / grammar focus |
|---|---|---|
| 1 | 👋 Greetings & Politeness | Greetings, thanks and introductions |
| 2 | 🥐 Cafés & Food | Ordering food and drinks politely |
| 3 | 🧭 Directions & Transport | Asking where things are and getting around |
| 4 | 🛍️ Shopping & Hotels | Prices, sizes and hotel basics |
| 5 | 🚑 Health & Emergencies | Asking for help and describing symptoms |
| 6 | 🔢 Numbers & Age | Numbers, age and quantities |
| 7 | 👨‍👩‍👧 Family | Family members and possessives |
| 8 | 🧑 Describing People | Describing people with adjectives |
| 9 | 🕒 Days & Time | Telling the time and days of the week |
| 10 | ⏰ Daily Routine | Daily routine with reflexive and frequency words |
| 11 | 🏠 At Home | Rooms, furniture and 'there is' |
| 12 | 👕 Colors & Clothes | Colors, clothes and adjective agreement |
| 13 | 🌦️ Weather & Seasons | Weather expressions and seasons |
| 14 | ❤️ Likes & Dislikes | Expressing likes and dislikes |
| 15 | 🎨 Hobbies | Hobbies and free time with 'play/do/go' |
| 16 | 💼 Jobs | Jobs and workplaces |
| 17 | 🏙️ Around Town | Places in town and prepositions of place |
| 18 | 🌍 Countries & Languages | Countries, nationalities and languages |
| 19 | 📞 Personal Details | Personal details and spelling |
| 20 | 🛒 At the Supermarket | Food shopping, quantities and containers |
| 21 | 😊 Feelings | Feelings and states with 'to be' |
| 22 | 🐾 Animals | Animals and pets with 'have' |
| 23 | 🏫 In Class | Classroom language and asking for help |
| 24 | 📅 Dates & Birthdays | Months, dates and birthdays |
| 25 | 🍳 Meals | Meals and simple food vocabulary |
| 26 | 🚗 Getting Around | Means of transport and 'by/on' |
| 27 | 🙋 Can & Can't | Can / can't for ability and requests |
| 28 | 📍 Right Now | Present continuous: what is happening now |
| 29 | 🤝 A1 Review: Meeting Someone | Review: introductions, questions and small talk |

### A2 · Elementary (units 30–53)

| Unit | Topic | Communicative / grammar focus |
|---|---|---|
| 30 | 🎉 Last Weekend | Simple past: last weekend |
| 31 | 🧒 Childhood | Past habits: when I was a child |
| 32 | 🧳 Travel Plans | Future plans with 'going to' |
| 33 | 🛫 At the Airport | Airport procedures and polite requests |
| 34 | 🚆 Train Travel | Timetables, tickets and platforms |
| 35 | 📅 Bookings | Booking, changing and cancelling |
| 36 | 🍷 Eating Out | Ordering, recommendations and complaints in a restaurant |
| 37 | 🥘 Cooking | Imperatives and sequencing in recipes |
| 38 | 👗 Clothes Shopping | Sizes, fitting rooms and returns |
| 39 | 🩺 At the Doctor's | Symptoms, duration and the doctor's advice |
| 40 | 🏃 Sports & Fitness | Sports, fitness and frequency |
| 41 | 📲 Making Plans | Suggestions and arrangements |
| 42 | 💌 Invitations | Invitations: accepting and declining politely |
| 43 | 🧭 Finding the Way | Detailed directions and landmarks |
| 44 | 🔑 Renting a Flat | Renting a flat and talking to a landlord |
| 45 | 🖥️ A Day at Work | Workday tasks and obligations |
| 46 | 💻 Technology | Technology problems and instructions |
| 47 | ⚖️ Comparing Things | Comparatives and superlatives |
| 48 | 🎆 Celebrations | Festivals, traditions and wishes |
| 49 | 🏦 Money & Banking | Banking, payments and money matters |
| 50 | 📮 Everyday Services | Services: post office, hairdresser, repairs |
| 51 | 😤 Problems & Complaints | Problems, apologies and complaints |
| 52 | 🌋 Experiences | Present perfect: life experiences |
| 53 | 🗺️ A2 Review: A Trip Abroad | Review: planning and surviving a trip abroad |

### B1 · Intermediate (units 54–77)

| Unit | Topic | Communicative / grammar focus |
|---|---|---|
| 54 | 💭 Opinions | Giving and asking for opinions |
| 55 | 🤜 Agreeing & Disagreeing | Agreeing, disagreeing and partial agreement |
| 56 | 💡 Giving Advice | Advice and suggestions with should / why don't you |
| 57 | 👔 Job Interview | Talking about yourself in a job interview |
| 58 | 📧 At the Office | Workplace communication and requests |
| 59 | 🎓 Learning & Study | Learning strategies and studying |
| 60 | 📖 Telling a Story | Narrating events: sequencing and past tenses |
| 61 | 🎭 Emotions | Describing emotions and reactions |
| 62 | 💞 Relationships | Friendship, dating and relationships |
| 63 | 🥗 Healthy Living | Healthy habits and lifestyle changes |
| 64 | 🌱 The Environment | Environment, causes and consequences |
| 65 | 📰 News & Media | News, media and reporting what people say |
| 66 | 📸 Social Media | Social media habits and their effects |
| 67 | 🔮 What If… | Second conditional: imaginary situations |
| 68 | 😔 Regrets & Wishes | Regrets and wishes about the past |
| 69 | 🎯 Goals & Ambitions | Goals, ambitions and future predictions |
| 70 | 🧳 Travel Troubles | Dealing with travel problems |
| 71 | 🏮 Culture & Customs | Customs, traditions and cultural differences |
| 72 | 🎞️ Reviews & Recommendations | Reviewing films, series and books |
| 73 | ☎️ Phone Calls | Phone calls, messages and voicemail |
| 74 | 🛠️ Customer Service | Customer service and polite insistence |
| 75 | 🧩 Explaining Processes | Explaining how something works, step by step |
| 76 | 🏡 Living Abroad | Settling in a new country |
| 77 | 🏅 B1 Review: My Story | Review: a full conversation about your life |

### B2 · Upper-intermediate (units 78–100)

| Unit | Topic | Communicative / grammar focus |
|---|---|---|
| 78 | 🗣️ Debating | Building an argument with linking words |
| 79 | 🎯 Persuasion | Persuading and convincing |
| 80 | 🌫️ Nuance & Hedging | Hedging, softening and expressing uncertainty |
| 81 | 🤝 Negotiation | Negotiating terms and compromises |
| 82 | 🧑‍💼 Meetings | Running and taking part in meetings |
| 83 | 📊 Presentations | Structuring and delivering a presentation |
| 84 | ✉️ Formal Emails | Formal written register |
| 85 | 🔬 Science & Innovation | Science, innovation and the passive voice |
| 86 | 📈 The Economy | Economy, trends and describing graphs |
| 87 | 🏛️ Society | Society, citizenship and public issues (neutral) |
| 88 | ⚖️ Ethics & Dilemmas | Ethical dilemmas and moral reasoning |
| 89 | 🏫 Education | Education systems and lifelong learning |
| 90 | 🌃 City Living | Urban life, housing and planning |
| 91 | 🖼️ Arts & Culture | Art, music and describing impressions |
| 92 | 🐘 Idioms I | Common idioms for everyday situations |
| 93 | 🦉 Idioms II | Idioms for people, work and decisions |
| 94 | 💬 Reported Speech | Reported speech |
| 95 | 🧾 Formal Structures | Passive and impersonal structures in formal contexts |
| 96 | 🔀 Advanced Conditionals | Third and mixed conditionals |
| 97 | ☕ Small Talk Mastery | Fluent small talk, fillers and keeping a chat going |
| 98 | 🕊️ Difficult Conversations | Handling conflict and difficult conversations |
| 99 | 🚀 Career Growth | Career development and professional growth |
| 100 | 🏆 B2 Final Challenge | Final review: an extended, nuanced conversation |
