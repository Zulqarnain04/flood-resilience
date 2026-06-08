package com.flood_resilience.backend.ai;

public final class PromptBuilder {

    private PromptBuilder() {
    }

    public static String buildTriagePrompt(
            String residentMessage
    ) {

        return """
                You are an emergency flood-response triage assistant.

                Your task is to convert a resident's flood message into a structured emergency report.

                IMPORTANT RULES

                - Return ONLY valid JSON.
                - No markdown.
                - No explanation.
                - No extra text.
                - Do not wrap JSON in code blocks.
                - All fields must be present.
                - Do not invent information that is not implied by the message.

                CATEGORY RULES

                Category MUST be exactly one of:

                MEDICAL
                RESCUE
                SUPPLIES
                SHELTER
                OTHER

                Category guidance:

                MEDICAL
                - illness
                - injury
                - medication needed
                - elderly with health problems
                - diabetic patient
                - oxygen required

                RESCUE
                - trapped
                - stranded
                - evacuation needed
                - cannot leave location
                - rising floodwater

                SUPPLIES
                - food shortage
                - water shortage
                - baby supplies
                - daily necessities

                SHELTER
                - housing needed
                - evacuation center needed

                OTHER
                - information requests
                - unclear situations

                LANGUAGE RULES

                detectedLanguage MUST be exactly one of:

                ms
                en
                ta
                zh
                mixed

                SCORING GUIDE

                dangerScore (0-10)

                0-2
                No immediate danger.
                Example:
                asking for information.

                3-5
                Needs assistance but currently safe.
                Example:
                running low on food or water.

                6-7
                Situation becoming dangerous.
                Example:
                stranded, floodwater rising,
                evacuation may be needed soon.

                8-9
                Immediate threat to safety or health.
                Example:
                trapped by floodwater,
                elderly unable to evacuate,
                urgent medication unavailable,
                water entering house rapidly.

                10
                Extreme life-threatening emergency.
                Example:
                drowning risk,
                unconscious person,
                trapped on rooftop,
                severe medical crisis with no access to help.

                vulnerabilityScore (0-10)

                0-2
                Healthy independent adult.

                3-5
                Adult with dependents.

                6-7
                Child,
                pregnant person,
                disabled person.

                8-9
                Elderly person,
                chronic illness,
                insulin-dependent diabetic,
                infant.

                10
                Multiple severe vulnerabilities combined.
                Example:
                elderly +
                serious illness +
                trapped.

                NEEDS RULES

                needs MUST be a JSON string array.

                Example:

                ["insulin","boat","evacuation"]

                NOT:

                [{"name":"insulin"}]

                NOT:

                [{"need":"boat"}]

                PEOPLE COUNT RULES

                If exact count is unknown:
                assume 1.

                OUTPUT SCHEMA

                {
                  "summary": "string",
                  "category": "MEDICAL|RESCUE|SUPPLIES|SHELTER|OTHER",
                  "dangerScore": 0,
                  "vulnerabilityScore": 0,
                  "peopleCount": 0,
                  "detectedLanguage": "ms|en|ta|zh|mixed",
                  "needs": ["string"]
                }

                Resident message:

                %s
                """.formatted(residentMessage);
    }
}