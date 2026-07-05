# Personal Social Media Manager Assistant - Project Flow

## 1. Project Vision

Build a personal AI assistant that helps plan, create, publish, and manage content across **personal accounts** on:

- Facebook (personal profile)
- Instagram (personal account)
- LinkedIn (personal profile)
- YouTube (personal channel)
- TikTok (personal account)

The assistant should support idea research, viral topic discovery, work-related content planning, caption/title generation, media upload, scheduling, publishing, analytics tracking, and comment reply assistance.

**Core principle (highest priority):** **One Idea → Multi-Platform Adapt** — enter one idea and the system generates platform-specific versions (Facebook, Instagram, LinkedIn, YouTube, TikTok) with the right tone, length, and format for each. This is a must-have feature built from Phase 2, even before all platforms are connected for publishing.

**Scope note:** This project is designed for **personal use only** (single user, personal social accounts). Architecture should stay simple and avoid multi-tenant complexity.

**Platform rollout order:** Build and integrate one platform at a time, in this sequence:

1. **Facebook** (MVP — first)
2. **Instagram**
3. **LinkedIn**
4. **YouTube**
5. **TikTok** (last)

## 2. Main User Goals

- **Enter one idea → get adapted posts for every platform** (Facebook, Instagram, LinkedIn, YouTube, TikTok) — highest priority.
- Get daily or weekly content ideas based on niche, work, audience, and trending topics.
- Save links, notes, screenshots, and voice memos to an **Inspiration Inbox** for later posts.
- Turn **voice notes**, **URLs/articles**, or **saved ideas** into ready-to-publish captions.
- Plan a full week of content in one **batch session**.
- Generate platform-specific posts from one idea.
- Upload static images, videos, reels, shorts, and long-form videos.
- Generate titles, captions, descriptions, tags, hashtags, thumbnails ideas, and CTAs.
- Create **quote/image cards** from text for higher engagement.
- Use **caption templates** that worked before.
- Schedule and publish content to multiple personal platforms.
- Set from the dashboard how many posts to publish today, tomorrow, or on any specific day.
- Get reminded about upcoming special days, occasions, and events — and be asked if they want to create a post.
- Get **festival countdown post suggestions** (7/5/3/1 days before Eid, Pohela Boishakh, etc.).
- **Approve posts from Telegram/WhatsApp** without opening the dashboard.
- Read comments and suggest or auto-send replies; **shield toxic/spam comments**.
- Track performance, **hashtag effectiveness**, **best posting times**, and **content pillar balance**.
- Maintain posting **streaks** and recycle top-performing old posts.
- **Pause all automation instantly** if something goes wrong.
- Maintain a consistent personal brand voice.

## 3. High-Level Product Flow

### Step 1: User Onboarding

Collect:

- User name, profession, business, niche, and target audience
- Brand tone: professional, friendly, educational, funny, bold, etc.
- Language preference: Bangla, English, Banglish, or mixed
- Personal platforms to connect
- Default daily post target (e.g., 2 posts/day on Facebook)
- Preferred posting times per platform
- Content pillars
- Competitors or inspiration accounts
- Approval preference: manual approval or auto-publish
- Special day interests: which categories to track (BD national days, international days, religious days, sports, personal occasions)

Output:

- Personal brand profile
- Content strategy baseline
- Platform-specific rules
- Default posting plan (posts per day per platform)

### Step 1.1: Dashboard Posting Goals

From the dashboard, the user can set and adjust posting targets at any time:

| Setting | Example | Description |
|---------|---------|-------------|
| **Today's post target** | 3 posts | How many posts to publish today (per platform or total) |
| **Tomorrow's post target** | 2 posts | Plan ahead — set how many posts for tomorrow |
| **Default daily target** | 2 posts/day | Baseline used when no specific day is set |
| **Per-platform target** | FB: 2, IG: 1 | Different targets per connected platform |

Dashboard shows:

- Target vs. published count for today and tomorrow
- Remaining posts needed to hit today's goal
- Scheduled drafts that fill tomorrow's quota
- Quick action: "Generate post ideas to reach today's target"

The assistant uses these targets when suggesting content and scheduling — e.g., if today's target is 3 and only 1 is published, it prompts the user to create 2 more.

### Step 2: Personal Account Connection via Automation

Official APIs do **not** support publishing to personal Facebook, Instagram, LinkedIn, or TikTok accounts. This project connects and publishes through **automation** (browser or mobile app), not business/page APIs.

Because this is for personal use with low volume (approx. 4–5 posts per day and limited comment replies), the risk of account limitation or detection is lower — but not zero.

#### Step 2.1: Platform Capability Matrix (Personal Accounts Only)

| Platform | Official API for Personal? | Connection Method | Publish | Comments | Analytics |
|----------|---------------------------|-------------------|---------|----------|-----------|
| Facebook Personal | No | Browser or Appium | Automation | Automation | Automation / manual |
| Instagram Personal | No | Browser or Appium | Automation | Automation | Automation / manual |
| LinkedIn Personal | No (very limited) | Browser or Appium | Automation | Automation | Automation / manual |
| YouTube Personal | Yes (Data API v3) | OAuth API | API | API | API |
| TikTok Personal | Partial / restricted | Browser or Appium (primary) | Automation | Automation | Automation / manual |

**Key rules:**

- Facebook, Instagram, LinkedIn, and TikTok personal accounts → **automation only**.
- YouTube personal channel → **official API** (OAuth) where possible; automation as fallback only if needed.
- No Facebook Page, Instagram Business, or LinkedIn Company Page integrations in this project.

#### Option 1: Browser Automation (Headless / Headed Browser)
- **Tools**: Playwright (preferred), Puppeteer, or Selenium (Python or Node.js).
- **Platforms**: Facebook, Instagram, LinkedIn, TikTok (personal accounts via web).
- **Execution Mode**: Runs in the background (headless or headed with user session visible).
- **Authentication**: Uses saved session cookies and local storage state (loaded after a one-time manual login). No raw password storage.
- **Workflow**:
  - Reads the platform DOM to locate post creation inputs, media upload elements, and comment boxes.
  - Types the generated post, uploads media, and submits.
  - Periodically checks recent posts and comments to suggest or send replies.
- **Pros**: Easier to implement, runs on a server, one tool for multiple platforms.
- **Cons**: Fragile to UI updates; higher bot detection risk on web; requires script maintenance.

#### Option 2: Mobile App Automation (Appium)
- **Tools**: Appium (Python or Node.js).
- **Platforms**: Facebook, Instagram, LinkedIn, TikTok (official mobile apps).
- **Execution Mode**: Runs on an Android emulator or a real physical Android device.
- **Authentication**: Interacts with the official app while the user stays logged in.
- **Workflow**:
  - Launches the official app.
  - Simulates human gestures (tap, scroll, type) via element IDs or coordinates.
  - Performs posting, comment navigation, and reply typing.
- **Pros**: Lower bot detection risk; platform sees the official mobile app.
- **Cons**: Higher setup complexity; emulator/device maintenance; slower than browser.

### Step 2.2: Technical Decision — Automation Strategy

**Overall architecture: Automation-first for personal accounts. YouTube is the exception (API).**

```
Platform rollout (one at a time):
  Phase 3 → Facebook Personal    → Playwright → Appium fallback (Phase 8)
  Phase 4 → Instagram Personal   → Playwright → Appium fallback (Phase 8)
  Phase 5 → LinkedIn Personal    → Playwright → Appium fallback (Phase 8)
  Phase 6 → YouTube Personal     → YouTube Data API v3 (OAuth)
  Phase 7 → TikTok Personal      → Playwright → Appium fallback (Phase 8)
```

| Rollout | Platform | Tool | When |
|---------|----------|------|------|
| **1st (MVP)** | Facebook | **Playwright** | Phase 3 — first platform to build and ship |
| **2nd** | Instagram | **Playwright** | Phase 4 — after Facebook is stable |
| **3rd** | LinkedIn | **Playwright** | Phase 5 |
| **4th** | YouTube | **YouTube Data API** | Phase 6 — official API |
| **5th (last)** | TikTok | **Playwright** | Phase 7 |
| Fallback (any platform) | All above | **Appium** | Phase 8 — only if Playwright gets blocked or breaks often |

#### Publisher Abstraction Layer

All publishing logic goes through a single interface so we can swap browser, Appium, or API implementations without changing the rest of the app:

```
PublisherInterface
  ├── publish(post, media) → PublishResult
  ├── fetchComments(postId) → Comment[]
  ├── replyToComment(commentId, text) → ReplyResult
  └── healthCheck() → HealthStatus

Implementations:
  ├── BrowserPublisher    → Playwright (FB, IG, LinkedIn, TikTok personal)
  ├── AppiumPublisher     → Appium (FB, IG, LinkedIn, TikTok personal — fallback)
  └── ApiPublisher        → YouTube Data API v3 only
```

The publishing module selects the correct implementation based on `social_accounts.platform` and `social_accounts.connection_type`.

#### Safety & Anti-Detect Measures
- **Low-Frequency Posting**: Limit automated activities to 4–5 posts per day per platform and reply only to comments that genuinely need attention.
- **Human Mimicry & Typing Emulation**:
  - Do not paste text instantly; type captions with random delays (e.g., 50–150ms) between characters.
  - Introduce random delays (e.g., 2–5 seconds) before clicking buttons or submitting forms.
  - Perform natural gestures like scrolling and cursor movement before interacting.
- **Session-only Authentication (No Password Storage)**: Import browser cookies and local storage state (JSON) after a one-time manual login. Encrypt session data at rest. Never store raw passwords.
- **Failover Mode & Alerts**: If automation fails (CAPTCHA, UI change, expired session), capture a screenshot and alert the user via email, Telegram, or WhatsApp. Switch the post to "Manual Handoff" with a copy-paste ready caption and downloadable media.

#### Automation Resilience Strategy

- **Selector strategy**: Multiple fallback selectors — CSS, XPath, accessibility labels. Never rely on a single class name.
- **Health check job**: Daily check that login state is valid and the post composer is reachable. Alert on login page or CAPTCHA.
- **Screenshot on failure**: Save screenshot with error log for debugging.
- **Version tracking**: Tag each automation script with a version. Record which version broke and which fix resolved it.
- **Canary dry-run**: Before publishing, optionally verify composer elements exist without submitting.
- **Graceful degradation**: After 3 consecutive failures, disable auto-publish for that account and switch to manual-only mode until re-authentication or script update.

### Step 3: Idea Research Engine

Inputs:

- User niche
- User work topics
- Keywords
- Competitor accounts
- Trending topics
- Previous post performance
- Seasonal events
- **Upcoming special days and occasions** (from Special Days Calendar)
- **Sports events and match schedules**
- **User's daily/tomorrow posting targets**

Outputs:

- Daily content ideas
- Viral topic suggestions
- Educational post topics
- Personal branding topics
- Industry insight topics
- Content hooks
- Suggested platform fit
- **Occasion-based post ideas** (e.g., "Tomorrow is Mother's Day — here are 3 caption ideas")

Research sources may include:

- Public trend feeds
- Google Trends
- YouTube search/trending signals
- TikTok/Instagram trend observation
- LinkedIn topic search
- User-provided links, notes, and documents
- **Built-in Special Days Calendar** (BD, international, religious, sports)
- **Sports event feeds** (cricket, football, and other followed sports)

### Step 3.1: Special Days, Occasions & Events Calendar

The system maintains and monitors a calendar of special days across multiple categories. **One day before** each relevant occasion, the assistant proactively informs the user and asks if they want to create a post.

#### Occasion Categories

| Category | Examples |
|----------|----------|
| **Bangladesh National & Cultural Days** | Independence Day (26 March), Victory Day (16 December), Language Martyrs' Day (21 February), Pohela Boishakh, International Mother Language Day, National Mourning Day, etc. |
| **International Special Days** | Mother's Day, Father's Day, Valentine's Day, Women's Day (8 March), Earth Day, World Health Day, New Year's Day, Christmas, Halloween, etc. |
| **Religious Days** | Eid-ul-Fitr, Eid-ul-Adha, Shab-e-Barat, Shab-e-Qadr, Mawlid, Ashura, Durga Puja, Kali Puja, Buddha Purnima, Christmas, Easter, etc. (user selects religions to follow) |
| **Sports Events** | BPL cricket matches, ICC tournaments, FIFA World Cup, Champions League, national team matches, major finals — with live score and result updates |
| **Personal Occasions** | User-added birthdays, anniversaries, business launch dates, custom reminders |

#### Day-Before Alert Flow

```
Every evening (e.g., 8:00 PM user local time):
  1. Check tomorrow's date against Special Days Calendar
  2. Filter by user's enabled categories and preferences
  3. If match found → send notification:

     "📅 কাল Mother's Day (8 May)!
      তুমি কি এই occasion নিয়ে কোনো post করতে চাও?
      [হ্যাঁ, idea দাও]  [না, skip]  [আগামী বছর remind করো না]"

  4. If user says yes → AI generates 2–3 occasion-specific post ideas
  5. User picks one → draft created → goes to approval workflow
```

Alert channels:

- In-app dashboard notification (primary)
- Optional: email, Telegram, or WhatsApp (user preference)

#### Sports Event Updates

For followed sports and teams, the system provides:

- **Pre-match alert** (day before or morning of): "Bangladesh vs India — T20 tonight at 7:30 PM. Post a prediction or good luck message?"
- **Live score updates** (optional, during match): short dashboard widget or notification
- **Post-match alert**: "Bangladesh won! Want to post a celebration caption?"
- AI-generated post ideas based on match result, player performance, or upcoming fixtures

User can configure:

- Which sports to follow (cricket, football, etc.)
- Which teams or tournaments matter
- Whether to get live updates or only pre/post-match alerts

### Step 4: Content Planning

The assistant creates a content calendar with:

- Date and time
- Platform
- Content type
- Topic
- **Occasion tag** (e.g., Mother's Day, Victory Day, BPL Final — if post is occasion-based)
- Draft status
- Approval status
- Publishing status
- Campaign or content pillar
- **Daily post target for that date** (from dashboard settings)

Calendar views:

- **Day view** — today's target vs. scheduled/published count
- **Week view** — upcoming special days highlighted with color tags per category
- **Month view** — all occasions visible; click a day to see events and set post targets

Content types:

- Facebook personal text post
- Facebook personal image/video post
- Instagram personal post
- Instagram reel
- LinkedIn personal post
- YouTube short
- YouTube long video
- TikTok video
- **Occasion/tribute post** (special day, religious day, sports celebration)
- **Sports update post** (pre-match hype, live update, post-match reaction)

### Step 5: Content Generation

#### Step 5.0: One Idea → Multi-Platform Adapt ⭐ (Highest Priority — Must Have)

This is the **core content engine**. Every other input method (manual idea, voice note, URL, inspiration inbox, occasion alert) feeds into this flow.

**Flow:**

```
One idea (text / voice / URL / inbox item / occasion)
        ↓
AI generates platform-specific versions in one pass:
        ↓
┌─────────────┬──────────────┬──────────────┬─────────────┬─────────────┐
│  Facebook   │  Instagram   │  LinkedIn    │  YouTube    │   TikTok    │
│ conversational│ short caption│ professional│ title + desc│ hook + cap  │
│  medium len │ + hashtags   │  long-form   │ + tags      │ ultra short │
└─────────────┴──────────────┴──────────────┴─────────────┴─────────────┘
        ↓
User reviews each platform version → approve one / some / all → schedule or publish
```

**Per-platform adaptation rules:**

| Platform | Tone | Length | Extras |
|----------|------|--------|--------|
| Facebook | Conversational, personal | Medium (2–4 paragraphs ok) | Emoji ok, story-style |
| Instagram | Visual-first, catchy | Short caption + hashtags | 20–30 hashtags, CTA |
| LinkedIn | Professional, insightful | Long-form, structured | No emoji overload, industry angle |
| YouTube | SEO-focused | Title (60 chars), description (detailed) | Tags, timestamps, CTA |
| TikTok | Hook-driven | Ultra short | Trending hook, 3–5 hashtags |

**Built from Phase 2** — even if only Facebook is connected for publishing (Phase 3), all platform versions are generated and stored as drafts. When Instagram/LinkedIn/etc. are added in later phases, drafts are already ready to publish.

**UI:** Side-by-side or tab view showing all platform versions from one idea. Edit individually or "rewrite all."

#### Step 5.1: Content Input Sources

All input sources feed into **One Idea → Multi-Platform Adapt**:

| # | Feature | Input | Phase |
|---|---------|-------|-------|
| 1 | **Inspiration Inbox** | Save links, screenshots, notes, quick ideas anytime | Phase 2 |
| 2 | **Voice Note → Post** | Record voice → transcribe → multi-platform adapt | Phase 2 |
| 3 | **Link/Article → Post** | Paste URL → summarize → multi-platform adapt | Phase 2 |
| 4 | **One Idea → Multi-Platform Adapt** | Text idea → all platform versions | **Phase 2 (Priority #1)** |
| 5 | **Batch Weekly Session** | "Plan next 7 days" → multiple ideas + drafts at once | Phase 2 (basic), Phase 8 (full auto) |

#### Step 5.2: Content Enhancement Tools

| # | Feature | Description | Phase |
|---|---------|-------------|-------|
| 7 | **Content Pillars Balance** | Dashboard shows if posting mix is balanced across pillars | Phase 2 |
| 8 | **Caption Templates Library** | Save and reuse caption structures that performed well | Phase 2 |
| 9 | **Quote/Image Card Generator** | Text → branded image card ready to post | Phase 3 |
| 11 | **Festival Countdown Series** | 7/5/3/1 days before occasion → countdown post suggestions | Phase 2 |

#### Step 5.3: Engagement & Safety Features

| # | Feature | Description | Phase |
|---|---------|-------------|-------|
| 6 | **Telegram/WhatsApp Approval** | Approve/reject/edit posts from phone | Phase 3 |
| 10 | **Best Time to Post** | Learn from analytics, suggest optimal schedule time | Phase 3 (basic), Phase 7 (full) |
| 12 | **Content Recycling** | Resurface top old posts with updated caption | Phase 4+ |
| 13 | **Hashtag Performance Tracker** | Track which hashtags drove reach | Phase 3+ |
| 14 | **Post Streak Tracker** | Consecutive posting days, motivation widget | Phase 1 |
| 15 | **Negative Comment Shield** | Auto-detect toxic/spam; escalate sensitive topics | Phase 3 |
| 18 | **Emergency Pause Button** | One-click stop all automation | Phase 3 |

#### Step 5.4: Advanced Intelligence (Phase 8)

| # | Feature | Description | Phase |
|---|---------|-------------|-------|
| 16 | **Competitor/Inspiration Watch** | Monitor inspiration accounts for trending topics → suggest ideas | Phase 8 |
| 17 | **RSS/News Monitor** | Niche news feeds → "this is trending, want to post?" | Phase 8 |

For each idea (from any source), generate:

- Hook
- Caption
- Title
- Description
- Hashtags
- CTA
- Short post version
- Long post version
- **All platform-specific adaptations (via Step 5.0)**
- Optional image/video brief

Example:

One idea can become:

- LinkedIn personal insight post
- Facebook personal conversational post
- Instagram personal short caption with hashtags
- YouTube title, description, tags
- TikTok hook and caption

### Step 6: Media Handling

User can upload:

- Static image
- Carousel images
- Short video
- Long video
- Thumbnail
- Raw footage

Assistant tasks:

- Detect media type
- Validate platform requirements
- Suggest crop/aspect ratio
- Generate title/caption/description
- Suggest thumbnail text
- Extract transcript from video if needed

### Step 7: Approval Workflow

Every generated item should support:

- Draft
- Needs review
- Approved
- Scheduled
- Published
- Failed

User can:

- Edit content manually
- Ask AI to rewrite
- Approve one platform
- Approve all platforms
- Schedule manually
- Publish immediately
- **Approve from Telegram/WhatsApp** — receive notification with [Approve] [Edit] [Reject] buttons (Phase 3)

**Emergency Pause (Phase 3):** One dashboard button to immediately halt all scheduled publishes and automation jobs. Use when account issues, CAPTCHA, or any emergency occurs.

### Step 8: Publishing Workflow

Publishing process:

1. Validate account connection (session alive or YouTube OAuth valid).
2. Validate media format and text length for the target platform.
3. Select publisher implementation (`BrowserPublisher`, `AppiumPublisher`, or `ApiPublisher` for YouTube).
4. Prepare platform-specific payload.
5. Upload media if needed.
6. Create post/video.
7. Store platform post ID or URL.
8. Mark status as published.
9. Start analytics and comment monitoring.

### Step 9: Comment Management

Assistant should:

- Fetch comments (via automation or YouTube API)
- Detect sentiment
- Detect questions
- Detect spam or toxic comments
- **Negative Comment Shield** — auto-flag or hide toxic/spam comments; never auto-reply to sensitive topics (religion, politics, personal attacks)
- Suggest replies
- Auto-reply only if user enables it
- Escalate sensitive comments for manual approval

Reply modes:

- Suggest only
- One-click approve
- Auto-reply for safe comments
- Never auto-reply to sensitive topics

### Step 10: Analytics and Learning

Track (via automation scraping or YouTube API):

- Views
- Reach
- Likes
- Comments
- Shares
- Watch time
- Clicks
- Follower growth
- Engagement rate

Use analytics to:

- **Best Time to Post** — recommend optimal posting times per platform based on historical engagement
- **Hashtag Performance** — identify which hashtags drove the most reach
- **Content Pillars Balance** — show weekly mix across educational, personal, promotional, entertainment pillars
- **Content Recycling** — flag top-performing posts from 3–6 months ago for repost with updated caption
- **Post Streak** — track consecutive posting days
- Recommend better posting times
- Identify best-performing topics
- Improve hooks
- Suggest repeatable content formats
- Build weekly performance reports

## 4. Core Modules

### User and Workspace Module

- User profile
- Brand voice
- Niche
- Platforms
- Preferences

### Social Account Module

- Personal account connection (browser session or Appium device)
- YouTube OAuth (personal channel only)
- Session state storage and refresh
- Connection health status
- Connection type tracking (`browser_session`, `appium_device`, `oauth` for YouTube only)
- Automation health check status

### AI Content Module

- **One Idea → Multi-Platform Adapt** (core engine — highest priority)
- Caption generation using OpenAI API
- Title, hashtag, and description generation
- Platform adaptation (LinkedIn professional tone, Facebook conversational, YouTube short hooks)
- **Voice Note → Post** — transcribe audio, then multi-platform adapt
- **Link/Article → Post** — fetch URL, summarize, then multi-platform adapt
- **Batch Weekly Session** — generate multiple ideas + all platform versions for the week
- **Quote/Image Card Generator** — text to branded image card
- **Caption Templates Library** — save and apply reusable structures
- **Festival Countdown Series** — countdown post ideas before occasions
- AI-driven comment reply generation (sentiment detection and drafted response suggestions)
- **Brand Voice Memory & Few-shot Prompting**: Stores best-performing posts to inject as few-shot examples into OpenAI prompts for tone consistency (Bangla, English, or Banglish).
- **Structured JSON Outputs**: Uses OpenAI Structured Outputs (JSON Schema) for consistent parser responses.
- **Dynamic System Prompt Assembly**: Builds prompts from onboarding details (niche, brand tone, audience).
- **Occasion-aware captions**: Generates tribute, celebration, and awareness posts for special days (Mother's Day, Victory Day, Eid, etc.).
- **Sports-aware captions**: Generates pre-match hype, live reaction, and post-match celebration posts.

### Inspiration Inbox Module

- Save links, screenshots, text notes, and quick ideas
- Voice memo attachment
- Tag and categorize inbox items
- Convert any inbox item → One Idea → Multi-Platform Adapt
- Inbox status: `new` | `used` | `archived`

### Content Intelligence Module

- **Content Pillars Balance** dashboard widget
- **Post Streak Tracker** — consecutive days posted
- **Hashtag Performance Tracker** — reach per hashtag over time
- **Best Time to Post** recommendation engine
- **Content Recycling** — resurface top old posts with new captions
- **Competitor/Inspiration Watch** (Phase 8) — observe public posts from inspiration accounts
- **RSS/News Monitor** (Phase 8) — niche news → post suggestions

### Media Module

- Upload media
- Store media
- Validate media
- Generate metadata
- Future: clipping, resizing, subtitles

### Calendar and Scheduling Module

- Draft calendar (day / week / month views)
- Scheduled posts
- Queue
- Time zone support
- Retry failed publish jobs
- **Daily and tomorrow post targets** (set from dashboard)
- **Target vs. actual progress bar** per day
- **Special days overlay** on calendar (color-coded by category)

### Posting Goals Module

- Default daily post target per platform
- Override target for today or any specific date
- Tomorrow's planned post count
- Progress tracking (published / scheduled / remaining)
- Smart prompts when behind target ("You need 2 more posts today — generate ideas?")

### Special Days & Events Module

- Built-in calendar database (BD days, international days, religious days)
- User preference: which categories and religions to follow
- Personal custom occasions (birthdays, anniversaries)
- **Day-before alert job** (evening notification with post suggestion prompt)
- Occasion → AI post idea generation on user confirmation
- Sports event tracking (teams, tournaments, match schedules)
- Pre-match, live, and post-match alerts with post suggestions
- Snooze or disable specific occasions per year

### Research Module

- Trend discovery
- Competitor/topic research
- Idea ranking
- Content pillar mapping
- **Occasion-aware idea generation**
- **Sports event-aware content suggestions**

### Publishing Module

- `PublisherInterface` abstraction
- `BrowserPublisher` — Playwright for Facebook, Instagram, LinkedIn, TikTok personal
- `AppiumPublisher` — fallback for the same platforms
- `ApiPublisher` — YouTube Data API v3 only
- Post creation, media publishing, error handling, published post tracking

### Comment Inbox Module

- Unified comment inbox
- Sentiment tags
- AI reply suggestions
- Approval flow
- Reply history

### Analytics Module

- Platform metrics (scraped or via YouTube API)
- Reports
- Recommendation engine
- Performance learning

### Admin and Settings Module

- API keys (OpenAI, YouTube)
- Usage limits
- Automation rules
- Security settings
- **Emergency Pause** — global kill switch for all automation and scheduled jobs
- **Telegram/WhatsApp bot connection** for mobile approval notifications

## 5. Suggested MVP Scope

**MVP = Facebook personal account only.** Other platforms come in later phases (Instagram → LinkedIn → YouTube → TikTok).

| Platform | MVP (Phase 3) | Later Phases |
|----------|---------------|--------------|
| Facebook Personal | ✅ **Yes** — Playwright | — |
| Instagram Personal | ❌ Phase 4 | Playwright |
| LinkedIn Personal | ❌ Phase 5 | Playwright |
| YouTube Personal | ❌ Phase 6 | YouTube Data API |
| TikTok Personal | ❌ Phase 7 | Playwright |

MVP should include (Facebook only):

- User profile and brand setup
- Connect Facebook personal account via browser session (manual login → cookie import)
- Manual media upload
- **One Idea → Multi-Platform Adapt** — generate all platform versions from one idea (Facebook publishes; others saved as drafts)
- **Inspiration Inbox** — save links, notes, screenshots for later
- **Voice Note → Post** and **Link/Article → Post**
- **Caption Templates Library**
- **Content Pillars Balance** widget
- **Post Streak Tracker**
- **Festival Countdown Series** (with special days)
- AI caption generation for Facebook posts
- Content calendar (Facebook posts)
- **Dashboard posting goals** — set today's and tomorrow's post target
- **Basic Special Days calendar** — BD national days, major international days, major religious days (Eid, etc.)
- **Day-before occasion alert** with "do you want to post?" prompt and AI idea generation
- Manual approval (always ask before publish)
- **Telegram/WhatsApp approval** for posts
- **Emergency Pause Button**
- Schedule or publish to Facebook via Playwright
- Facebook comment fetch, **Negative Comment Shield**, and reply suggestion
- Basic Facebook post analytics + **Hashtag Performance** + **Best Time to Post** (basic)

MVP can skip:

- Instagram, LinkedIn, YouTube, TikTok (later phases)
- Sports live score updates (add in Phase 8; pre/post-match alerts optional in Phase 3)
- Appium mobile automation (Phase 8 fallback)
- Fully automatic replies
- Advanced video editing
- Deep competitor scraping
- Billing

## 6. Phase by Phase Roadmap

> **Rollout rule:** Complete and stabilize each platform phase before starting the next. Order: **Facebook → Instagram → LinkedIn → YouTube → TikTok**.

### Phase 0: Planning and Architecture

- Define exact feature list for personal accounts
- Choose tech stack
- Design database schema
- Map Facebook automation flow first (other platforms documented but not built yet)
- Design `PublisherInterface` abstraction (platform-agnostic from day one)
- Design **One Idea → Multi-Platform Adapt** engine architecture (highest priority)
- Create prompt strategy (Facebook-first, but all 5 platform adapt rules defined)
- Create wireframes

Deliverables:

- Product requirement document
- Technical architecture
- Database schema draft
- Facebook automation checklist

### Phase 1: Foundation (Platform-Agnostic)

- App authentication (email/password)
- User profile and brand voice setup
- Dashboard layout with **posting goals widget** (today / tomorrow target)
- **Post Streak Tracker** widget on dashboard
- Content calendar base with **special days overlay** (BD, international, religious)
- Media upload base
- Platform settings screen shell (session import UI ready for Facebook)
- **Posting goals settings** — default daily target, per-day override, tomorrow's plan
- **Special days preferences** — select categories (BD, international, religious) and religions to follow

Deliverables:

- Working app shell
- User onboarding
- Brand profile stored
- Calendar UI with occasion markers
- Media upload working
- Posting goals dashboard (today / tomorrow)
- Post streak tracker live

### Phase 2: AI Content Studio + Occasion Alerts (Facebook-First)

**Priority #1 — build the core content engine here.**

- **One Idea → Multi-Platform Adapt** ⭐ — core engine; all platform versions from one input
- Idea input (manual text)
- **Inspiration Inbox** — save links, notes, screenshots, quick ideas
- **Voice Note → Post** — record → transcribe → multi-platform adapt
- **Link/Article → Post** — paste URL → summarize → multi-platform adapt
- **Batch Weekly Session** (basic) — plan multiple posts for the week in one sitting
- Facebook-specific caption and hashtag generation
- **Caption Templates Library** — save and reuse winning structures
- **Content Pillars Balance** dashboard widget
- **Festival Countdown Series** — 7/5/3/1 day countdown post suggestions before occasions
- **Occasion-aware post generation** — AI creates captions when user accepts a day-before alert
- Rewrite options (per platform or all)
- Draft saving (all platform versions stored, even if platform not yet connected)
- `PublisherInterface` interface defined (implementations come in Phase 3+)
- **Day-before alert job** — evening check for tomorrow's occasions, in-app notification
- **"Do you want to post?" flow** — yes → AI ideas → multi-platform adapt, no → skip, snooze → don't remind this year

Deliverables:

- **Multi-platform content engine working** (drafts for all 5 platforms)
- Inspiration Inbox
- Voice Note → Post
- Link/Article → Post
- Caption templates
- Content pillars balance widget
- Festival countdown suggestions
- Special days day-before alerts working

### Phase 3: Facebook Personal — **MVP** 🎯

First platform. Ship end-to-end Facebook personal account support before touching any other platform.

- Browser session import for Facebook personal account
- Connection health check and session expiry detection
- `BrowserPublisher` for Facebook (text, image, video posts)
- Publish Facebook version from multi-platform drafts (other platforms remain as ready drafts)
- **Quote/Image Card Generator** — text to branded image card for Facebook
- Scheduling queue and background jobs for Facebook
- Publish status tracking and retry on failure
- Facebook comment fetch and AI reply suggestions
- **Negative Comment Shield** — flag toxic/spam, escalate sensitive topics
- Basic Facebook post analytics (views, likes, comments)
- **Hashtag Performance Tracker** (Facebook)
- **Best Time to Post** suggestion (basic, from Facebook data)
- Manual approval before every publish
- **Telegram/WhatsApp Approval** — approve posts from phone
- **Emergency Pause Button** — halt all automation instantly
- Failover: manual handoff (copy-paste caption + media) on automation failure

Deliverables:

- Facebook personal account connected and publishing
- Facebook scheduler live
- Facebook comment inbox with shield
- Facebook analytics + hashtag + best time insights
- Telegram/WhatsApp approval working
- Emergency pause live
- **MVP complete — usable daily for Facebook; other platform drafts ready**

### Phase 4: Instagram Personal

Add Instagram after Facebook is stable.

- Browser session import for Instagram personal account
- `BrowserPublisher` for Instagram (post, reel)
- Publish Instagram version from existing multi-platform drafts
- Instagram-specific caption/hashtag AI adaptation
- Schedule and publish to Instagram
- Instagram comment fetch and reply suggestions
- Basic Instagram analytics
- **Content Recycling** — suggest reposting top Facebook/IG posts with updated captions
- Unified calendar showing Facebook + Instagram posts

Deliverables:

- Instagram personal account connected
- Instagram publishing and scheduling
- Instagram comment inbox
- Content recycling suggestions
- Two-platform calendar

### Phase 5: LinkedIn Personal

- Browser session import for LinkedIn personal profile
- `BrowserPublisher` for LinkedIn (text, image, article-style posts)
- LinkedIn-specific professional tone AI adaptation
- Schedule and publish to LinkedIn
- LinkedIn comment fetch and reply suggestions
- Basic LinkedIn analytics
- Unified calendar (FB + IG + LinkedIn)

Deliverables:

- LinkedIn personal profile connected
- LinkedIn publishing and scheduling
- LinkedIn comment inbox
- Three-platform calendar

### Phase 6: YouTube Personal

- YouTube OAuth setup for personal channel
- `ApiPublisher` for YouTube (video upload, title, description, tags)
- YouTube Shorts and long-form video support
- YouTube comment fetch via API and reply suggestions
- YouTube analytics via API (views, watch time, subscribers)
- Unified calendar (FB + IG + LinkedIn + YouTube)

Deliverables:

- YouTube personal channel connected via OAuth
- Video upload and metadata publishing
- YouTube comment inbox
- YouTube analytics dashboard

### Phase 7: TikTok Personal (Last Platform)

- Browser session import for TikTok personal account
- `BrowserPublisher` for TikTok (short video posts)
- TikTok-specific hook/caption AI adaptation
- Schedule and publish to TikTok
- TikTok comment fetch and reply suggestions
- Basic TikTok analytics
- Full five-platform unified calendar

Deliverables:

- TikTok personal account connected
- TikTok publishing and scheduling
- TikTok comment inbox
- All five platforms live

### Phase 8: Advanced Automation and Intelligence

Cross-platform enhancements after all five platforms are live.

- `AppiumPublisher` fallback for any platform where Playwright fails or gets blocked
- **Batch Weekly Session** (full auto) — AI plans entire week based on occasions, pillars, and performance
- Research engine: topic ideas, trend discovery, weekly content plan
- Auto-generate drafts from research
- Auto-schedule approved content across platforms
- Subtitle and thumbnail generation
- Cross-platform performance reports and AI recommendations
- Brand voice learning from best-performing posts
- **Competitor/Inspiration Watch** — monitor inspiration accounts, suggest trending topics
- **RSS/News Monitor** — niche news feeds → post suggestions
- **Full sports events module** — live score updates, pre/post-match alerts, tournament calendars (BPL, ICC, FIFA, etc.)
- **Expanded occasion database** — all religious calendars (Hijri, Bengali calendar), more international days
- **Personal custom occasions** — birthdays, anniversaries, business milestones
- **Smart weekly posting plan** — auto-suggest daily targets based on upcoming occasions and past performance
- Optional alert channels: email, Telegram, WhatsApp

Deliverables:

- Appium fallback per platform (as needed)
- AI research assistant
- Competitor/inspiration watch
- RSS/news monitor
- Weekly content plan generator (full auto)
- Cross-platform analytics and optimization
- Sports events tracking and post suggestions
- Full special days calendar with all categories
- Semi-autonomous assistant mode

## 7. Recommended Tech Stack

Frontend:

- Next.js or React
- Tailwind CSS
- shadcn/ui if using Next.js

Backend:

- Node.js with NestJS/Express, or Laravel if the existing ecosystem prefers PHP
- REST or GraphQL API

Database:

- PostgreSQL

Queue:

- Redis + BullMQ, or Laravel Queue

Storage:

- S3-compatible object storage

AI:

- OpenAI API for content generation, classification, summarization, reply suggestions, and voice transcription (Whisper)

Notifications:

- Telegram Bot API (post approval, occasion alerts, emergency alerts)
- WhatsApp Business API or Twilio (optional, Phase 3+)

Auth:

- Email/password for app login
- YouTube OAuth for personal channel only
- Browser session import for all other platforms (no password storage)

Automation:

- Playwright (primary — build per platform in rollout order: FB → IG → LinkedIn → TikTok)
- Appium (fallback — Phase 8+, per platform as needed)
- YouTube Data API (Phase 6 only)

Deployment:

- Docker
- VPS, AWS, DigitalOcean, or similar

## 8. Basic Data Model

Main entities:

- users
- brand_profiles
- social_accounts
- content_ideas
- content_drafts
- media_assets
- scheduled_posts
- published_posts
- comments
- comment_replies
- analytics_snapshots
- automation_rules
- automation_logs
- **posting_goals**
- **special_days**
- **user_occasion_preferences**
- **occasion_alerts**
- **sports_events**
- **user_sports_preferences**
- **personal_occasions**
- **inspiration_inbox**
- **caption_templates**
- **post_streaks**
- **hashtag_performance**
- **content_recycling_suggestions**
- **competitor_accounts** (Phase 8)
- **rss_feeds** (Phase 8)

### `posting_goals` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `platform` | enum | `facebook` \| `instagram` \| ... \| `all` |
| `target_date` | date | Specific date (null = default daily target) |
| `target_count` | integer | How many posts planned for this date |
| `published_count` | integer | How many already published (updated on publish) |
| `scheduled_count` | integer | How many scheduled but not yet published |

### `special_days` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | e.g., "Mother's Day", "Victory Day", "Eid-ul-Fitr" |
| `name_bn` | string | Bengali name (optional) |
| `category` | enum | `bd_national` \| `international` \| `religious` \| `sports` \| `personal` |
| `religion` | enum | `islam` \| `hindu` \| `christian` \| `buddhist` \| null |
| `date_type` | enum | `fixed` (same date yearly) \| `lunar` (Hijri) \| `variable` |
| `month` | integer | For fixed dates |
| `day` | integer | For fixed dates |
| `date_rule` | string | For lunar/variable dates (e.g., "1st Shawwal") |
| `description` | text | Brief context for AI post generation |

### `user_occasion_preferences` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `category` | enum | Which categories to track |
| `religions` | array | Which religious calendars to follow |
| `alert_enabled` | boolean | Receive day-before alerts |
| `alert_time` | time | When to send evening alert (default 8:00 PM) |
| `alert_channel` | enum | `in_app` \| `email` \| `telegram` \| `whatsapp` |
| `snoozed_occasions` | array | Occasion IDs to skip this year |

### `occasion_alerts` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `special_day_id` | FK | Which occasion |
| `alert_date` | date | When alert was sent (day before occasion) |
| `user_response` | enum | `pending` \| `yes` \| `no` \| `snoozed` |
| `generated_ideas` | json | AI post ideas if user said yes |
| `draft_id` | FK | Draft created from selected idea (if any) |

### `sports_events` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | e.g., "Bangladesh vs India — T20" |
| `sport` | enum | `cricket` \| `football` \| `other` |
| `tournament` | string | e.g., "BPL 2026", "ICC T20 World Cup" |
| `match_datetime` | timestamp | When the match starts |
| `teams` | json | Team names |
| `status` | enum | `upcoming` \| `live` \| `completed` |
| `result` | json | Score, winner, player of the match (after completion) |
| `external_id` | string | ID from sports API feed (for live updates) |

### `user_sports_preferences` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `sports` | array | Which sports to follow |
| `teams` | array | Favorite teams |
| `tournaments` | array | Tournaments to track |
| `live_updates` | boolean | Get live score notifications during matches |
| `pre_match_alert` | boolean | Alert before match with post suggestion |
| `post_match_alert` | boolean | Alert after match with celebration/reaction post suggestion |

### `personal_occasions` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `name` | string | e.g., "My birthday", "Shop anniversary" |
| `date` | date | When it occurs |
| `recurring` | boolean | Repeats yearly |
| `alert_enabled` | boolean | Send day-before reminder |

### `inspiration_inbox` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `type` | enum | `link` \| `note` \| `screenshot` \| `voice` |
| `content` | text | URL, note text, or file path |
| `title` | string | User-given label (optional) |
| `tags` | array | User tags for organization |
| `status` | enum | `new` \| `used` \| `archived` |
| `draft_id` | FK | Draft created when converted to post |

### `caption_templates` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `name` | string | e.g., "Tip → Explain → CTA" |
| `structure` | text | Template with placeholders |
| `platform` | enum | `all` or specific platform |
| `usage_count` | integer | Times used |
| `avg_engagement` | float | Average engagement when used |

### `post_streaks` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `current_streak` | integer | Consecutive days posted |
| `longest_streak` | integer | All-time best |
| `last_post_date` | date | Last day a post was published |

### `hashtag_performance` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `hashtag` | string | The hashtag |
| `platform` | enum | Which platform |
| `post_id` | FK | Which post used it |
| `reach` | integer | Reach attributed to this post |
| `used_at` | timestamp | When posted |

### `content_recycling_suggestions` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `original_post_id` | FK | Top-performing old post |
| `suggested_caption` | text | AI-updated caption |
| `status` | enum | `pending` \| `accepted` \| `dismissed` |
| `suggested_at` | timestamp | When suggested |

### `competitor_accounts` — Fields (Phase 8)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `platform` | enum | Platform |
| `account_url` | string | Public profile URL |
| `last_checked_at` | timestamp | Last observation |
| `notes` | text | Why following this account |

### `rss_feeds` — Fields (Phase 8)

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | FK | Owner |
| `feed_url` | string | RSS/Atom feed URL |
| `niche` | string | Topic category |
| `last_fetched_at` | timestamp | Last fetch time |
| `active` | boolean | Enabled or not |

### `content_drafts` — Additional Fields (Multi-Platform)

| Field | Type | Description |
|-------|------|-------------|
| `source_idea_id` | FK | Parent idea that spawned all platform versions |
| `platform_versions` | json | All platform adaptations from one idea |
| `input_source` | enum | `manual` \| `inbox` \| `voice` \| `url` \| `occasion` \| `batch` |
| `approved_platforms` | array | Which platform versions are approved |

### `social_accounts` — Fields

| Field | Type | Description |
|-------|------|-------------|
| `platform` | enum | `facebook` \| `instagram` \| `linkedin` \| `youtube` \| `tiktok` |
| `account_type` | enum | Always `personal` for this project |
| `connection_type` | enum | `browser_session` \| `appium_device` \| `oauth` (YouTube only) |
| `session_state_path` | string | Encrypted path to Playwright storage state / cookies |
| `device_id` | string | Appium device or emulator identifier |
| `oauth_token_encrypted` | string | YouTube OAuth token (encrypted) |
| `last_health_check_at` | timestamp | Last successful connection health check |
| `automation_fail_count` | integer | Consecutive failures; triggers manual-only mode at threshold |
| `automation_script_version` | string | Version of the automation script last known to work |
| `is_manual_only` | boolean | True when automation is disabled due to repeated failures |

All session states and OAuth tokens must be **encrypted at rest**.

## 9. Important Rules and Safety

- Never auto-publish without user approval in early phases.
- Never auto-reply to sensitive comments without approval.
- Store session states and OAuth tokens encrypted.
- Keep low posting frequency (4–5 posts/day per platform).
- Keep audit logs for publish and reply actions.
- Allow user to disconnect accounts and delete session data anytime.
- If automation fails 3 times consecutively, switch account to manual-only mode and alert the user.
- Always provide manual handoff (copy-paste caption + media download) as fallback.

### Legal and Terms of Service Considerations

- Meta, LinkedIn, TikTok, and other platforms restrict unauthorized automation in their Terms of Service.
- Browser/Appium automation for personal accounts carries a **non-zero risk** of account restriction or temporary lock.
- Personal use with low volume (4–5 posts/day) reduces but does not eliminate this risk.
- YouTube is the only platform where official API publishing is used.
- Never store raw passwords — use session cookies or OAuth tokens only.
- Document all automated actions in audit logs for accountability.

## 10. Cost and Infrastructure Estimate

| Component | Browser Automation (MVP) | Appium Automation (Fallback) |
|-----------|--------------------------|------------------------------|
| Server | 1 VPS (~$10–20/mo) | VPS + Android emulator/device |
| Setup time | 2–4 days (multi-platform) | 3–5 days per platform |
| Maintenance | High (UI changes break scripts) | Medium (app version changes) |
| Detection risk | Medium–High (web) | Low (mobile app) |
| AI API (OpenAI) | ~$5–20/mo depending on usage | Same |
| Storage (S3) | ~$1–5/mo | Same |

**Recommendation:** MVP = Facebook Playwright only (Phase 3). Add one platform per phase in order. YouTube API in Phase 6. Appium fallback in Phase 8 only if needed.

## 11. Decisions and Open Questions

### Decided

| Question | Decision |
|----------|----------|
| Personal use or SaaS? | **Personal use** only; single-user architecture |
| Account type? | **Personal accounts only** — no Page, Business, or Company accounts |
| Platform rollout order? | **Facebook → Instagram → LinkedIn → YouTube → TikTok** (one at a time) |
| MVP platform? | **Facebook personal only** (Phase 3) |
| Default content language? | **Banglish** (Bangla + English mix) with user override |
| Auto-publish or approval? | **Always ask approval** in MVP and early phases |
| Automation approach? | **Playwright per platform** in rollout order; **YouTube API** in Phase 6; **Appium fallback** in Phase 8 |
| Posting goals? | **Dashboard** — set today/tomorrow/daily post targets per platform |
| Special days alerts? | **Day-before evening alert** — ask user if they want to post; AI generates ideas on yes |
| Occasion categories? | **BD national**, **international**, **religious**, **sports**, **personal custom** |
| Sports updates? | Pre/post-match alerts in MVP; **live score updates** in Phase 8 |
| Core content engine? | **One Idea → Multi-Platform Adapt** — Phase 2, highest priority, must-have |
| Mobile approval? | **Telegram/WhatsApp** — Phase 3 |
| Emergency controls? | **Emergency Pause Button** — Phase 3 |
| Content recycling? | Phase 4+ |
| Competitor watch & RSS? | Phase 8 |

### Still Open

- What niche or work topics should the research engine focus on first?
- Do you have a YouTube developer account / OAuth app set up?
- Preferred tech stack: Next.js/NestJS or Laravel?
- Real Android device or emulator for future Appium setup?

## 12. Immediate Next Steps

1. Decide tech stack (Next.js + NestJS recommended for Playwright integration).
2. Create detailed wireframe (Facebook-first UI).
3. Design database schema (include `social_accounts` automation fields).
4. **Phase 1:** Build app shell, onboarding, brand profile, calendar with special days overlay, **posting goals dashboard**.
5. **Phase 2:** Build **One Idea → Multi-Platform Adapt** engine + Inspiration Inbox + Voice/URL input + caption templates + occasion alerts.
6. **Phase 3 (MVP):** Facebook publish + Telegram approval + Emergency Pause + comment shield + quote cards.
7. Design `PublisherInterface` in Phase 2 so Instagram/LinkedIn/TikTok publishers plug in during Phases 4–7 without refactoring.
8. Do **not** start Instagram until Facebook MVP is stable and in daily use.
