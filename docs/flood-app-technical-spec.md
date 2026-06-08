# 🛠️ TECHNICAL SPEC — Flood Resilience App
**Stack:** Spring Boot + JPA · MySQL/PostgreSQL · Expo (react-native-maps) · AI text→triage
**Three map layers:** 🔴 Help Needed · 🟢 Help Available · 🛣️ Safe/Danger Routes

> The heart of your demo is the AI extraction endpoint (§4). Get that airtight and the rest is CRUD you already know how to write.

---

## 1. DATA MODEL (JPA entities — lean, Lombok)

### `User`
```java
@Entity @Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String phone;            // identity for a kampung context
    @Enumerated(EnumType.STRING)
    private UserRole role;           // RESIDENT, VOLUNTEER, COORDINATOR
    private Double lastLat;          // for live location (volunteers)
    private Double lastLng;
    private Instant lastSeen;
}
```

### `HelpRequest`  ← the 🔴 need pins (the star of the show)
```java
@Entity @Getter @Setter @NoArgsConstructor
public class HelpRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- raw input from the user ---
    private String rawText;          // what they typed/spoke, in their language
    private Double lat;
    private Double lng;
    private Instant createdAt;

    // --- AI-extracted structured fields (from §4) ---
    private String summary;          // clean, formal one-line summary (EN)
    @Enumerated(EnumType.STRING)
    private RequestCategory category; // MEDICAL, RESCUE, SUPPLIES, SHELTER, OTHER
    private Integer dangerScore;     // 0–10, from content (AI)
    private Integer vulnerabilityScore; // 0–10, who they are (AI)
    private Integer peopleCount;     // how many affected
    private String detectedLanguage; // "ms", "en", "ta", ...
    @ElementCollection
    private List<String> needs;      // ["insulin", "boat", "drinking water"]

    // --- server-computed ---
    private Integer locationRisk;    // 0–10, from DangerZone overlap (NOT from AI)
    private Double urgencyScore;     // final weighted score (§3)
    @Enumerated(EnumType.STRING)
    private UrgencyLevel urgencyLevel; // CRITICAL/HIGH/MODERATE/LOW → pin colour

    // --- lifecycle ---
    @Enumerated(EnumType.STRING)
    private RequestStatus status;    // OPEN, CLAIMED, RESOLVED
    private Long claimedByUserId;    // which volunteer took it
}
```

### `Resource`  ← the 🟢 available pins
```java
@Entity @Getter @Setter @NoArgsConstructor
public class Resource {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private ResourceType type;       // BOAT, VOLUNTEER, SHELTER, MEDICAL_SUPPLY, FOOD
    private String label;            // "Faiz's boat (4 seats)"
    private Double lat;
    private Double lng;
    private Boolean liveLocation;    // true = follows the owner's User.lastLat/lng
    private Integer capacity;        // shelter beds, boat seats, etc.
    private Boolean available;       // toggle off when full/busy
    private Long ownerUserId;
    private Instant updatedAt;
}
```

### `DangerZone`  ← powers LocationRisk + the route feature
```java
@Entity @Getter @Setter @NoArgsConstructor
public class DangerZone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;             // "Sungai Terengganu floodplain"
    private Double centerLat;
    private Double centerLng;
    private Double radiusMeters;     // simple circle zone (easy intersection test)
    private Integer riskWeight;      // 0–10 → contributes to LocationRisk
    @Enumerated(EnumType.STRING)
    private ZoneCause cause;         // NEAR_RIVER, LOW_GROUND, KNOWN_FLOOD
}
```
> Seed 4–6 of these by hand for your demo area. They do double duty: (a) compute each pin's LocationRisk, (b) render as red overlays for the route feature.

### `InfoReport`  ← OPTIONAL feed (build last, or cut)
```java
@Entity @Getter @Setter @NoArgsConstructor
public class InfoReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String rawText;
    private String imageUrl;         // optional
    private Double lat;
    private Double lng;
    private Instant createdAt;
    private Boolean aiApproved;      // AI relevance check passed
    private String aiReason;         // why approved/rejected
    private String cleanSummary;     // AI-formatted info card text
}
```

### Enums
```java
enum UserRole { RESIDENT, VOLUNTEER, COORDINATOR }
enum RequestCategory { MEDICAL, RESCUE, SUPPLIES, SHELTER, OTHER }
enum UrgencyLevel { CRITICAL, HIGH, MODERATE, LOW }
enum RequestStatus { OPEN, CLAIMED, RESOLVED }
enum ResourceType { BOAT, VOLUNTEER, SHELTER, MEDICAL_SUPPLY, FOOD }
enum ZoneCause { NEAR_RIVER, LOW_GROUND, KNOWN_FLOOD }
```

---

## 2. DTOs (what crosses the wire)

```java
// Resident submits this — just text + where they are
record HelpRequestInput(String rawText, double lat, double lng) {}

// What the map renders (one per pin)
record HelpRequestPin(
    Long id, double lat, double lng,
    String summary, String category,
    double urgencyScore, String urgencyLevel,
    int peopleCount, List<String> needs,
    String status, Instant createdAt
) {}

// The AI's structured output (internal, §4)
record AiTriageResult(
    String summary, String category,
    int dangerScore, int vulnerabilityScore,
    int peopleCount, String detectedLanguage,
    List<String> needs
) {}
```

---

## 3. URGENCY SCORING (transparent, defensible, demoable)

This is what makes your AI "triage" real instead of hand-wavy. Three inputs, clear weights:

```
Urgency (0–10) = (Danger × 0.5) + (LocationRisk × 0.3) + (Vulnerability × 0.2)
```

- **Danger (0–10)** — from the *content*. AI extracts it. Trapped / water rising fast / medical emergency = high.
- **LocationRisk (0–10)** — **server-computed**, never trust AI for geography. Check which DangerZone(s) the pin falls in; take the max riskWeight.
- **Vulnerability (0–10)** — from *who they are*. AI extracts it. Elderly alone / infant / chronic illness / disabled / pregnant = high.

```java
public class UrgencyService {

    public double computeLocationRisk(double lat, double lng, List<DangerZone> zones) {
        int max = 0;
        for (DangerZone z : zones) {
            if (haversineMeters(lat, lng, z.getCenterLat(), z.getCenterLng()) <= z.getRadiusMeters()) {
                max = Math.max(max, z.getRiskWeight());
            }
        }
        return max; // 0–10
    }

    public double computeUrgency(int danger, double locationRisk, int vulnerability) {
        return (danger * 0.5) + (locationRisk * 0.3) + (vulnerability * 0.2);
    }

    public UrgencyLevel toLevel(double score) {
        if (score >= 8.0) return UrgencyLevel.CRITICAL; // red, pinned to top
        if (score >= 5.5) return UrgencyLevel.HIGH;     // orange
        if (score >= 3.0) return UrgencyLevel.MODERATE; // yellow
        return UrgencyLevel.LOW;                        // grey
    }
}
```

> **Pitch framing:** call it **"urgency triage,"** not "stress level." Show the formula on a slide — judges love a transparent, explainable AI decision (and it directly answers the "is your AI meaningful?" criterion, worth 20%).

---

## 4. THE AI EXTRACTION ENDPOINT (your #1 demo asset)

**Job:** messy text in any language → clean structured triage object. One call. This is the moment that wins the room.

### System prompt
```
You are an emergency dispatch triage assistant for a flood-response app in Malaysia.
A distressed resident has sent a message in their own language (Malay, English, Tamil,
a mix, or dialect). It may be panicked, incomplete, or informal.

Extract a structured assessment. Respond with ONLY a valid JSON object, no markdown,
no commentary, matching exactly this schema:

{
  "summary": string,          // ONE clear sentence in English, formal dispatch style
  "category": string,         // exactly one of: MEDICAL, RESCUE, SUPPLIES, SHELTER, OTHER
  "dangerScore": integer,     // 0-10. Immediate threat to life/safety from the SITUATION.
                              // 9-10: trapped, drowning risk, water rising fast, severe medical
                              // 6-8: stranded, needs evacuation soon, urgent medication
                              // 3-5: needs supplies, uncomfortable but safe for now
                              // 0-2: informational, low urgency
  "vulnerabilityScore": integer, // 0-10. Based on WHO is affected.
                              // 9-10: infant, unconscious person, severe chronic illness
                              // 6-8: elderly alone, pregnant, disabled, child
                              // 3-5: healthy adult with dependents
                              // 0-2: healthy adult, self-sufficient
  "peopleCount": integer,     // how many people affected; default 1 if unclear
  "detectedLanguage": string, // ISO code: "ms", "en", "ta", "zh", "mixed"
  "needs": [string]           // concrete items/actions, lowercase English,
                              // e.g. ["insulin","boat","drinking water"]
}

Rules:
- If life is at immediate risk, dangerScore must be >= 8.
- Be conservative: if unsure whether someone is vulnerable, score slightly higher, not lower.
- Never invent details not implied by the message.
- Output ONLY the JSON object.
```

### User message
```
Resident message: "{rawText}"
```

### Server flow (Spring Boot)
```
1. Receive HelpRequestInput(rawText, lat, lng)
2. Call AI with system prompt + rawText  → parse JSON → AiTriageResult
3. locationRisk = UrgencyService.computeLocationRisk(lat, lng, dangerZones)
4. urgency = computeUrgency(danger, locationRisk, vulnerability)
5. level = toLevel(urgency)
6. Save HelpRequest, return HelpRequestPin to the map
```

> **Robustness for live demo:** wrap the JSON parse in try/catch. If the model returns junk, fall back to a default (category=OTHER, danger=5, vuln=5) so the pin still drops and the demo never crashes. Strip ```json fences before parsing. Consider a 1-line "respond in JSON only" reminder if your model drifts.

---

## 5. WORKED EXAMPLES (rehearse these in your demo)

**Input (Malay, panicked):**
> "tolong air dah masuk rumah mak saya umur 70 dia kencing manis insulin dah habis kami dekat sungai"

**AI output:**
```json
{
  "summary": "Elderly diabetic woman (70) trapped by rising water, out of insulin, near river.",
  "category": "MEDICAL",
  "dangerScore": 9,
  "vulnerabilityScore": 9,
  "peopleCount": 2,
  "detectedLanguage": "ms",
  "needs": ["insulin", "boat", "evacuation"]
}
```
LocationRisk (near-river zone) = 9 → **Urgency = 9×0.5 + 9×0.3 + 9×0.2 = 9.0 → CRITICAL 🔴**

---

**Input (English, calmer):**
> "we're ok upstairs but running low on drinking water and bread, 4 of us, road outside flooded"

**AI output:**
```json
{
  "summary": "Family of 4 safe upstairs, low on drinking water and food, road flooded.",
  "category": "SUPPLIES",
  "dangerScore": 4,
  "vulnerabilityScore": 4,
  "peopleCount": 4,
  "detectedLanguage": "en",
  "needs": ["drinking water", "food"]
}
```
LocationRisk (low-ground zone) = 5 → **Urgency = 4×0.5 + 5×0.3 + 4×0.2 = 4.3 → MODERATE 🟡**

The CRITICAL insulin pin sorts above the MODERATE supplies pin. **That contrast IS your demo.** Show both messages going in, both pins dropping, the ranking happening live.

---

## 6. API ENDPOINTS (minimum set)

```
POST /api/requests          → submit HelpRequestInput, returns triaged pin   ← THE demo call
GET  /api/requests?status=OPEN → all need pins for the map
PUT  /api/requests/{id}/claim  → volunteer takes it (status→CLAIMED)
PUT  /api/requests/{id}/resolve→ mark done

POST /api/resources         → add boat/volunteer/shelter
GET  /api/resources?available=true → available pins
PUT  /api/resources/{id}    → toggle availability / update live location

GET  /api/zones             → danger zones (overlays + route check)
POST /api/route/check       → {origin, destination} → safe|unsafe + which zones crossed

POST /api/info              → (optional) submit report, returns aiApproved
GET  /api/info?approved=true→ (optional) the feed
```

---

## 7. BUILD ORDER (so you always have something demoable)

1. **Entities → repos → DTOs** (Spring Boot, your home turf). Seed DangerZones.
2. **`POST /api/requests` with the AI call + scoring** — get one triaged pin saving to DB. *This is the spike; do it first, hour 1–3.*
3. **Expo map + drop pins from `GET /api/requests`**, coloured by urgency. Now you have a demoable vertical slice.
4. **Resources layer** (🟢 pins + live-location toggle) — same pattern, fast.
5. **Route check** — danger-zone overlays + the intersect test.
6. **Info feed** — ONLY if time remains; scope to relevance-classification, not moderation.

Freeze features the night before. Polish the map and the two demo messages until they're flawless.
