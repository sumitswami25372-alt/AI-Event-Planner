from typing import Any

from app.schemas import AIPlanSchema, BudgetCategoryItem, ChecklistItem, TimelineItem


def generate_demo_plan(event_data: dict[str, Any]) -> AIPlanSchema:
    """
    Deterministic demo planner that generates a realistic, structurally valid
    plan tailored to the user's actual event inputs without calling external APIs.
    """
    name = event_data.get("name", "Celebration")
    category = (event_data.get("category") or "birthday").lower()
    budget = float(event_data.get("budget_amount", 50000))
    currency = event_data.get("currency", "INR")
    guests = int(event_data.get("guest_count", 50))
    location = event_data.get("location", "City Center")
    prefs = event_data.get("preferences") or {}

    style = (prefs.get("planning_style") or "balanced").lower()
    theme_colors = prefs.get("theme_colors") or "Warm Gold and Deep Burgundy"
    dietary = prefs.get("dietary") or "Diverse vegetarian and non-vegetarian selections"
    indoor_outdoor = prefs.get("indoor_outdoor") or "Indoor with outdoor garden terrace"

    # Category-specific concepts and palettes
    category_configs = {
        "wedding": {
            "concept": f"A regal and romantic wedding celebration at {location} balancing cultural heritage with modern refinement for {guests} esteemed guests.",
            "theme": f"Royal Elegance with {theme_colors}",
            "palette": ["#4A154B", "#D4AF37", "#F5EBE6", "#2D4B3E", "#FAF7F2"],
            "decorations": [
                "Grand floral mandap/archway featuring fresh seasonal blooms and hanging crystals",
                "Warm ambient fairy-light canopy and Edison bulb chandelier focal points",
                "Monogrammed aisle runner with brass urns and floating candle lanterns",
                "Bespoke tablescapes with gold-rimmed charger plates and velvet napkin rings"
            ],
            "venue_guidance": [
                f"Select an accessible venue in {location} with separate bridal prep suites and dedicated banquet lawn",
                "Ensure acoustic license until 10:30 PM and generator backup for audio-visual rigs",
                f"Verify guest parking capacity for at least {max(20, guests // 3)} vehicles"
            ],
            "food_and_drinks": [
                "Welcome drinks: Rose-infused saffron sherbet and sparkling elderflower cooler",
                f"Cocktail hour: 6 passed hors d'oeuvres accommodating {dietary}",
                "Main banquet: Curated multi-station buffet featuring regional specialties and live flatbread counter",
                "Dessert lounge: Artisanal pistachio kulfi, hot gulab jamun with rabdi, and tiered celebratory cake"
            ],
            "entertainment": [
                "Live instrumental welcome ensemble (flute & santoor / acoustic strings)",
                "Choreographed couple and family entry with cold-sparkulars",
                "Professional DJ set with intelligent moving-head light choreography"
            ],
            "ratios": {
                "Venue & Rentals": 0.28,
                "Catering & Bar Service": 0.34,
                "Floral & Scenic Decor": 0.14,
                "Photography & Cinema": 0.10,
                "Sound, Light & Entertainment": 0.08,
                "Stationery & Welcome Favors": 0.03,
                "Contingency Reserve": 0.03
            }
        },
        "birthday": {
            "concept": f"An energetic and joyous milestone birthday celebration for {guests} guests at {location} infused with dynamic music, interactive games, and delightful dining.",
            "theme": f"Modern Glow & Chic Celebration featuring {theme_colors}",
            "palette": ["#5C1D5E", "#EC4899", "#F59E0B", "#1E293B", "#FFFFFF"],
            "decorations": [
                "Custom LED neon sign backdrop with milestone year and metallic shimmer wall",
                "Organic chrome and matte balloon archway framing the VIP cake table",
                "Floating ambient helium table clusters with warm mini LED spotlights",
                "Interactive Polaroid memory guestbook table with metallic calligraphy markers"
            ],
            "venue_guidance": [
                f"Private rooftop terrace or trendy lounge in {location} with ambient sound zoning",
                f"Comfortable seating ratio for {guests} guests (mix of cocktail high-tops and lounge sofas)",
                "Clear loading bay access for cake and DJ sound equipment"
            ],
            "food_and_drinks": [
                "Signature welcome mocktails/cocktails: Twilight Berry Fizz and Spiced Citrus Sparkler",
                "Gourmet slider & mini taco grazing stations with artisanal dip platters",
                "Chef-curated live pasta or street food cart with hot savory bites",
                "Custom designer birthday cake paired with warm churros and brownie bites"
            ],
            "entertainment": [
                "Interactive celebrity/friends trivia and humorous roast & toast session",
                "360-degree rotating slow-motion video booth with custom event overlay",
                "High-energy open-format DJ set playing hits and throwback party anthems"
            ],
            "ratios": {
                "Venue Buyout / Lounge": 0.30,
                "Gourmet Catering & Grazing": 0.32,
                "Custom Cake & Beverage Service": 0.15,
                "DJ & Sound/Lighting Rig": 0.10,
                "Neon Decor & Photo Wall": 0.08,
                "Contingency Reserve": 0.05
            }
        },
        "anniversary": {
            "concept": f"A timeless, candlelit anniversary soirée honoring milestones in love and companionship with {guests} close family and friends in {location}.",
            "theme": f"Vintage Romance & Golden Memories with {theme_colors}",
            "palette": ["#581C87", "#D97706", "#FDE68A", "#4B5563", "#FFFBEB"],
            "decorations": [
                "Retrospective photographic timeline corridor featuring cherished life moments",
                "Lush botanical table garlands adorned with soft ivory roses and floating tapers",
                "Warm gilded arch framing the celebratory toast podium"
            ],
            "venue_guidance": [
                f"Intimate boutique heritage property or garden pavilion in {location}",
                "High acoustic intimacy for heartfelt speeches and acoustic music",
                "Wheelchair accessibility and shaded comfortable seating for elders"
            ],
            "food_and_drinks": [
                "Champagne/Sparkling cider welcome toast upon arrival",
                "4-course sit-down or premium family-style dining highlighting seasonal farm produce",
                "Classic multi-tier celebration cake with edible gold foil accents"
            ],
            "entertainment": [
                "Acoustic duo performing couple's nostalgic songs across the decades",
                "Surprise video message reel compiled from friends across the globe",
                "Slow dance opening followed by family celebration"
            ],
            "ratios": {
                "Venue Hire": 0.28,
                "Fine Dining & Wine/Beverages": 0.38,
                "Floral Sculptures & Lighting": 0.14,
                "Photography & Keepsake Album": 0.10,
                "Live Acoustic Music": 0.06,
                "Contingency Reserve": 0.04
            }
        },
        "corporate": {
            "concept": f"A sleek, impactful corporate summit and networking celebration in {location} providing seamless hospitality and technology for {guests} professionals.",
            "theme": f"Innovate & Elevate with {theme_colors}",
            "palette": ["#1E1B4B", "#3B82F6", "#10B981", "#64748B", "#F8FAFC"],
            "decorations": [
                "Branded architectural backdrop with dual high-lumens LED presentation screens",
                "Sleek minimalist podium with digital branding display and gobo projection",
                "Modern modular seating with branded charging stations and notebook amenities"
            ],
            "venue_guidance": [
                f"Auditorium or premium hotel ballroom in {location} with gigabit WiFi connectivity",
                "Dual microphone and lavalier wireless audio system with on-site technician",
                "Pre-function foyer for registration desks, sponsor banners, and networking"
            ],
            "food_and_drinks": [
                "Barista-curated espresso bar and gourmet breakfast pastries during registration",
                "Light, energizing business buffet luncheon designed for active networking",
                "Evening networking mixer with artisan canapés and craft beverages"
            ],
            "entertainment": [
                "Keynote address and interactive live audience polling presentation",
                "Excellence awards ceremony with custom trophies and fanfare stings",
                "Lounge jazz or indie instrumental trio during evening cocktail networking"
            ],
            "ratios": {
                "Ballroom & Audio/Visual Rigging": 0.35,
                "All-Day Delegate Catering": 0.32,
                "Keynote Audio/Stage Production": 0.15,
                "Branded Signage & Lanyards": 0.08,
                "Photography & Event Sizzle Reel": 0.06,
                "Contingency Reserve": 0.04
            }
        },
        "college": {
            "concept": f"A vibrant and unforgettable college fest / farewell celebration for {guests} students in {location} packed with music, street food, and electric memories.",
            "theme": f"Neon Odyssey with {theme_colors}",
            "palette": ["#4C1D95", "#06B6D4", "#F43F5E", "#111827", "#F3F4F6"],
            "decorations": [
                "Massive festival concert stage with laser mapping and LED video wall",
                "Glow-in-the-dark photo booth with oversized props and funny cutout frames",
                "Colorful fabric canopies and festoon festival lights across open courtyards"
            ],
            "venue_guidance": [
                f"Campus open amphitheater or spacious grounds in {location} with barricaded crowd zones",
                "Emergency first-aid medical desk and security checkpoints at all gate entries",
                "Multiple water refill points and clearly designated green waste bins"
            ],
            "food_and_drinks": [
                "Food truck alley featuring burgers, noodles, momos, pizzas, and mocktail popsicles",
                "Chilled fruit coolers, iced teas, and fizzy mocktail dispensers",
                "Late evening dessert cart with waffles and hot churros"
            ],
            "entertainment": [
                "Inter-college dance crew battle and battle of the bands showcase",
                "Celebrity DJ set with confetti cannons and crowd sing-alongs",
                "Student awards ceremony with hilarious superlative titles"
            ],
            "ratios": {
                "Stage, Sound Line-Array & Lighting": 0.38,
                "Food Stalls & Refreshments": 0.30,
                "Celebrity DJ / Artists": 0.16,
                "Security, First Aid & Sanitation": 0.08,
                "Wristbands, Posters & Medals": 0.05,
                "Contingency Reserve": 0.03
            }
        }
    }

    # Fallback default configuration
    cfg = category_configs.get(category, category_configs["birthday"])

    # Adjust budget allocations
    ratios = cfg["ratios"]
    budget_items: list[BudgetCategoryItem] = []
    for cat_name, ratio in ratios.items():
        est = round(budget * ratio, 2)
        budget_items.append(
            BudgetCategoryItem(
                name=cat_name,
                estimated_cost=est,
                notes=f"Allocated {int(ratio*100)}% of total budget based on {style} planning profile"
            )
        )

    # Standard timeline
    timeline: list[TimelineItem] = [
        TimelineItem(time="02:00 PM", activity="Production, floral load-in, and sound check at venue", duration_minutes=90),
        TimelineItem(time="04:00 PM", activity="Final walkthrough, staff briefing, and photo-booth readiness", duration_minutes=45),
        TimelineItem(time="05:30 PM", activity="Doors open: Guest welcome, signature refreshment & background music", duration_minutes=60),
        TimelineItem(time="06:30 PM", activity="Opening remarks, ceremonial highlights, and celebration moment", duration_minutes=45),
        TimelineItem(time="07:15 PM", activity="Interactive guest activities, photo sessions & cocktail grazing", duration_minutes=60),
        TimelineItem(time="08:15 PM", activity="Main dining buffet / gourmet dinner service open", duration_minutes=75),
        TimelineItem(time="09:30 PM", activity="Dance floor celebration, DJ showcase & midnight surprises", duration_minutes=90),
        TimelineItem(time="11:00 PM", activity="Event conclusion, guest departure with keepsake favors & site teardown", duration_minutes=45)
    ]

    # Standard checklist
    checklist: list[ChecklistItem] = [
        ChecklistItem(title=f"Finalize contract & deposit for venue in {location}", category="Venue", priority="high", days_before_event=45),
        ChecklistItem(title=f"Confirm catering menu respecting dietary ({dietary})", category="Catering", priority="high", days_before_event=30),
        ChecklistItem(title="Lock in DJ, sound line-array, and lighting equipment contract", category="Entertainment", priority="high", days_before_event=25),
        ChecklistItem(title=f"Review floral design and setup plan matching {theme_colors}", category="Decor", priority="medium", days_before_event=20),
        ChecklistItem(title="Design and distribute digital invitations with RSVP tracking link", category="Stationery", priority="medium", days_before_event=18),
        ChecklistItem(title=f"Confirm final headcount ({guests} pax) with venue and kitchen manager", category="Catering", priority="high", days_before_event=7),
        ChecklistItem(title="Prepare day-of run-of-show printouts and vendor emergency contact sheet", category="Operations", priority="medium", days_before_event=2),
        ChecklistItem(title="Pack ceremonial items, emergency kit (tape, pins, medicines) and guest favors", category="Operations", priority="low", days_before_event=1)
    ]

    recommendations: list[str] = [
        f"Keep a 3-5% emergency buffer ({round(budget * 0.04, 2)} {currency}) for unexpected overtime or guest additions.",
        "Establish a firm dietary count cutoff 5 days prior to prevent excess kitchen wastage.",
        "Ensure venue power lines can support simultaneous audio amplifiers, catering warmers, and lighting setups.",
        "Designate one trustworthy friend or assistant as the day-of vendor point person so the host remains relaxed."
    ]

    return AIPlanSchema(
        event_concept=cfg["concept"],
        theme=cfg["theme"],
        color_palette=cfg["palette"],
        decorations=cfg["decorations"],
        venue_guidance=cfg["venue_guidance"],
        food_and_drinks=cfg["food_and_drinks"],
        entertainment=cfg["entertainment"],
        timeline=timeline,
        budget_categories=budget_items,
        checklist=checklist,
        recommendations=recommendations
    )
