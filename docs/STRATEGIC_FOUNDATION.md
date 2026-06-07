
## 1.4 User Journey Architecture (The Golden Path)

This journey must feel inevitable—each step naturally leads to the next.

STEP 1: OPEN APP
  ↓
  Sees: fashion inspiration, creators, outfits, trends
  Emotional state: DISCOVERY
  (NOT products. Never products first.)

STEP 2: DISCOVER OUTFIT
  ↓
  Taps: "Recreate This Look"
  Emotional state: ASPIRATION

STEP 3: PLATFORM RESPONDS
  ↓
  Shows: products, designers, tailoring options
  Emotional state: EMPOWERMENT

STEP 4: SHOP
  ↓
  Commerce feels natural. Not forced.
  Emotional state: SATISFACTION

STEP 5: SAVE TO WARDROBE
  ↓
  Emotional state: BELONGING

STEP 6: AI SUGGESTS
  ↓
  "You already own 2 items needed for this outfit."
  Emotional state: DELIGHT (This is where magic happens.)

Design Principle: The feed is the product. Commerce is the outcome. Wardrobe is the moat. AI is the accelerator.

---

## 1.5 Navigation Architecture (Immutable)

Bottom navigation must remain these five tabs across all phases:

Tab | Icon | Purpose | Emotional Goal
---|---:|---|---
Home | 🏠 | AI-personalized feed, trending, challenges | Discovery + Aspiration
Discover | 👗 | Explore creators, designers, categories | Exploration + Pride
Wardrobe | 🧥 | Personal wardrobe, outfits, AI styling | Empowerment + Belonging
Shop | 🛍 | Marketplace, storefronts, checkout | Satisfaction
Profile | 👤 | Identity, followers, settings, DNA badge | Identity + Pride

Rule: No tab ever gets added, removed, or renamed. Feature discovery happens within tabs, not through navigation changes.

---

## 1.6 Role-Based Access Control (Day One Architecture)

Seven roles must be implemented from Phase 0 schema design, even if dashboards come later:

Role | Primary Dashboard Value
---|---
Consumer | Standard app: Discovery, wardrobe, shopping
Vendor | Vendor dashboard: Inventory, orders, analytics
Designer | Designer studio: Brand profile, collections, direct sales
Tailor | Tailor dashboard: Custom orders, measurements, client chat
Creator | Creator studio: Content, affiliate links, earnings
Event Organizer | Event dashboard: Event creation, ticket sales, streaming
Sustainable Partner | Sustainability portal: Impact tracking, certification display

Each role gets distinct permissions, UI elements, and monetization paths from the moment they're activated.

---

# PART II: PHASED EXECUTION ROADMAP (ADDITIONAL DETAIL)

(Phase breakdowns, success gates, and timelines are documented in the body of this file. See Tiered Build Order for high-level staging.)

## Phase 0: Foundation (Weeks 1–8) — Expanded Tasks

Goal: Establish the technical spine, design system, authentication, and Style DNA onboarding. Seed database with initial content.

0.1 Technical Foundation (high level)
- Monorepo structure (expo app, server, shared design tokens)
- Expo SDK and Nativewind/Tailwind config
- Font loading for Playfair Display & Work Sans
- Tailwind gold palette as constants

0.2 Style DNA Onboarding (Critical Path)
- 6-step onboarding flow (Welcome, Archetype, Body & Fit, Lifestyle, Wardrobe Snapshot, Preview)
- Transient state in Zustand, animated transitions, Cloudinary uploads
- POST to /api/style-profile on completion; generate initial feed

0.3 Content Seeding
- Seed 50–100 product images, 20–30 creator posts, 10–15 designer profiles

0.4 Pre-Launch Marketing
- Waitlist landing page (target 500+ signups)
- Teaser videos, creator early access, countdown campaign

Phase 0 Success Gates
- Auth flow complete with <2% error rate
- Style DNA completion rate >70% in internal testing (50 users)
- 50+ products seeded with images
- 500+ waitlist sign-ups
- All 5 navigation tabs functional (even if minimal)

---

# Implementation notes & next steps

- Wardrobe data is first-class; design data models to keep wardrobe items small and composable.
- Each issue created from the Roadmap should include measurable success metrics and acceptance criteria.
- Use the scripts/create_issues_and_project.sh to materialize issues and the Roadmap project board from the markdown drafts in .github/ISSUES.

