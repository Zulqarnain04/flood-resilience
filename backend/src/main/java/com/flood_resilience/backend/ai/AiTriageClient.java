package com.flood_resilience.backend.ai;

import com.flood_resilience.backend.dto.response.TriageResult;

public interface AiTriageClient {

    TriageResult triage(
            String residentMessage
    );

}