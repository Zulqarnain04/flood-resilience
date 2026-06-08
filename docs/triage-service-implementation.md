# ⚙️ TriageService — The Critical Path (locked, Ollama edition)

The riskiest 60 lines of your whole build: messy text → local AI (Ollama) → parsed JSON → urgency score → saved pin. Written defensively so a bad AI response **never crashes your demo** — it degrades to a safe default and the pin still drops.

> **Primary: Ollama (local, free, offline).** The AI client is an interface, so swapping to Claude/OpenAI is a one-file change — the Anthropic version is kept in the appendix (§9) in case the event hands you credits.

---

## 0. Ollama setup (do this WEEK ONE, not at the event)
```bash
# install from ollama.com, then:
ollama pull llama3.2:3b      # small + fast; use qwen2.5:7b if you have ~16GB RAM (better at Malay + JSON)
ollama serve                 # serves the API at http://localhost:11434
```
> Topology note: Ollama runs on **your laptop**, so your backend must run locally too during the demo (a remote Render backend can't reach your laptop). Your phone connects to the laptop's local IP over wifi/hotspot. Lock this before the event — see §8.

---

## 1. `application.properties`
```properties
ollama.api.url=http://localhost:11434/api/chat
ollama.model=llama3.2:3b
```
> No API key, no secret to leak. Still keep `.env` and secrets out of the public repo as a habit.

---

## 2. `AiTriageClient` (interface — keeps you provider-agnostic)
```java
public interface AiTriageClient {
    /** Raw resident message -> structured triage. Must never throw; returns a safe default on failure. */
    AiTriageResult triage(String rawText);
}
```

---

## 3. `OllamaTriageClient` (implementation — your default)
```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.List;

@Component
public class OllamaTriageClient implements AiTriageClient {

    private final RestClient http;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String model;

    private static final String SYSTEM_PROMPT = """
        You are an emergency dispatch triage assistant for a flood-response app in Malaysia.
        A distressed resident has sent a message in their own language (Malay, English, Tamil,
        a mix, or dialect). It may be panicked, incomplete, or informal.

        Extract a structured assessment. Respond with ONLY a valid JSON object matching:
        {
          "summary": string,            // ONE clear English sentence, formal dispatch style
          "category": string,           // one of: MEDICAL, RESCUE, SUPPLIES, SHELTER, OTHER
          "dangerScore": integer,       // 0-10, threat to life from the SITUATION
          "vulnerabilityScore": integer,// 0-10, based on WHO is affected
          "peopleCount": integer,       // affected people; default 1 if unclear
          "detectedLanguage": string,   // "ms","en","ta","zh","mixed"
          "needs": [string]             // concrete items, lowercase English
        }
        Rules: if life is at immediate risk, dangerScore >= 8. If unsure about vulnerability,
        score slightly higher. Never invent details. Output ONLY the JSON object.
        """;

    public OllamaTriageClient(
            @Value("${ollama.api.url}") String url,
            @Value("${ollama.model}") String model) {
        this.model = model;
        this.http = RestClient.builder().baseUrl(url).build();
    }

    @Override
    public AiTriageResult triage(String rawText) {
        try {
            Map<String, Object> body = Map.of(
                "model", model,
                "format", "json",     // ← CRITICAL: forces a small model to emit valid JSON
                "stream", false,
                "messages", List.of(
                    Map.of("role", "system", "content", SYSTEM_PROMPT),
                    Map.of("role", "user", "content", "Resident message: \"" + rawText + "\"")
                )
            );

            String json = http.post()
                .header("content-type", "application/json")
                .body(body)
                .retrieve()
                .body(String.class);

            // Ollama returns { "message": { "role":"assistant", "content":"...JSON..." } }
            JsonNode root = mapper.readTree(json);
            String text = root.path("message").path("content").asText();

            return parse(text);

        } catch (Exception e) {
            // Ollama down, model not pulled, malformed output — demo must survive.
            System.err.println("AI triage failed, using fallback: " + e.getMessage());
            return AiTriageResult.fallback(rawText);
        }
    }

    /** Strip code fences, parse, clamp scores. Falls back if the model returned junk. */
    private AiTriageResult parse(String text) {
        try {
            String cleaned = text.replaceAll("```json", "").replaceAll("```", "").trim();
            int s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
            if (s >= 0 && e > s) cleaned = cleaned.substring(s, e + 1);

            JsonNode n = mapper.readTree(cleaned);
            List<String> needs = new java.util.ArrayList<>();
            if (n.has("needs") && n.get("needs").isArray())
                n.get("needs").forEach(x -> needs.add(x.asText()));

            return new AiTriageResult(
                n.path("summary").asText("Unstructured request — review manually."),
                normaliseCategory(n.path("category").asText("OTHER")),
                clamp(n.path("dangerScore").asInt(5)),
                clamp(n.path("vulnerabilityScore").asInt(5)),
                Math.max(1, n.path("peopleCount").asInt(1)),
                n.path("detectedLanguage").asText("unknown"),
                needs
            );
        } catch (Exception ex) {
            return AiTriageResult.fallback(text);
        }
    }

    private int clamp(int v) { return Math.max(0, Math.min(10, v)); }

    private String normaliseCategory(String c) {
        String u = c == null ? "" : c.trim().toUpperCase();
        return switch (u) {
            case "MEDICAL", "RESCUE", "SUPPLIES", "SHELTER" -> u;
            default -> "OTHER";
        };
    }
}
```

---

## 4. `AiTriageResult` (with the safe fallback baked in)
```java
import java.util.List;

public record AiTriageResult(
    String summary,
    String category,
    int dangerScore,
    int vulnerabilityScore,
    int peopleCount,
    String detectedLanguage,
    List<String> needs
) {
    /** Conservative default so an unparseable message still becomes a visible, mid-urgency pin. */
    public static AiTriageResult fallback(String rawText) {
        return new AiTriageResult(
            "Unverified request: " + (rawText == null ? "" :
                rawText.substring(0, Math.min(rawText.length(), 80))),
            "OTHER", 5, 5, 1, "unknown", List.of()
        );
    }
}
```

---

## 5. `TriageService` (orchestrates the whole chain — UNCHANGED across providers)
```java
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
public class TriageService {

    private final AiTriageClient ai;
    private final UrgencyService urgency;
    private final HelpRequestRepository requests;
    private final DangerZoneRepository zones;

    public TriageService(AiTriageClient ai, UrgencyService urgency,
                         HelpRequestRepository requests, DangerZoneRepository zones) {
        this.ai = ai;
        this.urgency = urgency;
        this.requests = requests;
        this.zones = zones;
    }

    public HelpRequestPin submit(HelpRequestInput in) {
        // 1. AI: messy text -> structured (never throws)
        AiTriageResult t = ai.triage(in.rawText());

        // 2. Server computes location risk from geography — NOT the AI
        List<DangerZone> allZones = zones.findAll();
        double locationRisk = urgency.computeLocationRisk(in.lat(), in.lng(), allZones);

        // 3. Weighted urgency + bucket
        double score = urgency.computeUrgency(t.dangerScore(), locationRisk, t.vulnerabilityScore());
        UrgencyLevel level = urgency.toLevel(score);

        // 4. Persist
        HelpRequest r = new HelpRequest();
        r.setRawText(in.rawText());
        r.setLat(in.lat());
        r.setLng(in.lng());
        r.setCreatedAt(Instant.now());
        r.setSummary(t.summary());
        r.setCategory(RequestCategory.valueOf(t.category()));
        r.setDangerScore(t.dangerScore());
        r.setVulnerabilityScore(t.vulnerabilityScore());
        r.setPeopleCount(t.peopleCount());
        r.setDetectedLanguage(t.detectedLanguage());
        r.setNeeds(t.needs());
        r.setLocationRisk((int) Math.round(locationRisk));
        r.setUrgencyScore(score);
        r.setUrgencyLevel(level);
        r.setStatus(RequestStatus.OPEN);
        requests.save(r);

        // 5. Hand the map a ready-to-render pin
        return new HelpRequestPin(
            r.getId(), r.getLat(), r.getLng(),
            r.getSummary(), r.getCategory().name(),
            r.getUrgencyScore(), r.getUrgencyLevel().name(),
            r.getPeopleCount(), r.getNeeds(),
            r.getStatus().name(), r.getCreatedAt()
        );
    }
}
```

---

## 6. `HelpRequestController` (the one endpoint your demo hits)
```java
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin // "*" is fine for the demo; lock to your app origin if you have time
public class HelpRequestController {

    private final TriageService triage;
    private final HelpRequestRepository requests;

    public HelpRequestController(TriageService triage, HelpRequestRepository requests) {
        this.triage = triage;
        this.requests = requests;
    }

    @PostMapping
    public HelpRequestPin create(@RequestBody HelpRequestInput in) {
        return triage.submit(in);   // ← THE demo call
    }

    @GetMapping
    public List<HelpRequest> open(@RequestParam(defaultValue = "OPEN") RequestStatus status) {
        return requests.findByStatusOrderByUrgencyScoreDesc(status); // ranked, CRITICAL first
    }

    @PutMapping("/{id}/claim")
    public void claim(@PathVariable Long id, @RequestParam Long userId) { /* set CLAIMED */ }

    @PutMapping("/{id}/resolve")
    public void resolve(@PathVariable Long id) { /* set RESOLVED */ }
}
```
> Add to `HelpRequestRepository`:
> `List<HelpRequest> findByStatusOrderByUrgencyScoreDesc(RequestStatus status);`
> That `OrderBy...Desc` is what makes CRITICAL pins surface to the top — the visual punch of your demo.

---

## 7. Pre-event smoke test (run this in your dress rehearsal)
With `ollama serve` running and your backend up locally:
```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{"rawText":"tolong air dah masuk rumah mak saya umur 70 dia kencing manis insulin dah habis kami dekat sungai","lat":5.33,"lng":103.14}'
```
Expect a `CRITICAL` pin with category `MEDICAL`, danger ~9, needs including `insulin`. If you get a **fallback** pin instead (category OTHER, danger 5), the model botched the Malay or isn't pulled — switch to `qwen2.5:7b` and re-test. **Find this out this week, not on stage.**

You can also test Ollama directly, bypassing your backend:
```bash
curl http://localhost:11434/api/chat -d '{
  "model":"llama3.2:3b","format":"json","stream":false,
  "messages":[{"role":"user","content":"Return JSON {\"ok\":true}"}]
}'
```

---

## 8. Demo topology (the NEW risk Ollama introduces)
Your backend + Ollama both run on your laptop. Your phone must reach the laptop:
1. Put laptop and phone on the **same wifi**, or use your **phone's hotspot** (more reliable; venue wifi often blocks device-to-device).
2. Find your laptop's local IP (`ipconfig` on Windows → IPv4, e.g. `192.168.x.x`).
3. In `mobile/lib/api.js`, set the base URL to `http://192.168.x.x:8080` (NOT `localhost` — that means the phone itself).
4. Warm up the model right before presenting (run one triage) so the on-stage call isn't cold.
5. **Record a backup screen-capture** of the working flow — a local model on a tired laptop can stall; the video is your parachute.

---

## 9. APPENDIX — Anthropic swap (only if the event gives credits)
Cloud is faster and more reliable at JSON, and keeps a Render deployment story. To switch, replace the client with this and delete/disable `OllamaTriageClient` (keep only ONE `@Component` implementing `AiTriageClient`). Everything in §4–§6 stays identical.

`application.properties`:
```properties
anthropic.api.key=${ANTHROPIC_API_KEY}
anthropic.api.url=https://api.anthropic.com/v1/messages
anthropic.model=claude-sonnet-4-20250514
```
```java
@Component
public class AnthropicTriageClient implements AiTriageClient {
    // same SYSTEM_PROMPT, same parse()/clamp()/normaliseCategory() as §3
    // body: { "model", "max_tokens":400, "system":SYSTEM_PROMPT, "messages":[{role:user, content}] }
    // headers: x-api-key, anthropic-version: 2023-06-01, content-type
    // response text is at: root.path("content").path(0).path("text")
}
```
> Only one bean may implement `AiTriageClient`, or Spring won't know which to inject. Swap, don't run both.

---

## Three things that make this demo-proof
1. **`triage()` never throws** — every failure returns `fallback()`, so the pin always drops. No blank screen, ever.
2. **Location risk is computed server-side from zones**, never trusted to the AI — geography stays accurate.
3. **`"format":"json"` is non-negotiable with a small local model** — it's the single setting that stops a 3B model from emitting garbage.
