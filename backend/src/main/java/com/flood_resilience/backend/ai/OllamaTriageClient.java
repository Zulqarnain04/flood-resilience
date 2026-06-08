package com.flood_resilience.backend.ai;

import tools.jackson.databind.ObjectMapper;
import com.flood_resilience.backend.ai.dto.OllamaChatRequest;
import com.flood_resilience.backend.ai.dto.OllamaChatResponse;
import com.flood_resilience.backend.ai.dto.OllamaMessage;
import com.flood_resilience.backend.common.exception.TriageUnavailableException;
import com.flood_resilience.backend.dto.response.TriageResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class OllamaTriageClient implements AiTriageClient {

    private static final Logger log =
            LoggerFactory.getLogger(
                    OllamaTriageClient.class
            );

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private final String apiUrl;
    private final String model;

    public OllamaTriageClient(
            @Qualifier("ollamaRestClient") RestClient restClient,
            ObjectMapper objectMapper,
            @Value("${ollama.api-url}") String apiUrl,
            @Value("${ollama.model}") String model
    ) {

        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl;
        this.model = model;
    }

    @Override
    public TriageResult triage(
            String residentMessage
    ) {

        String prompt =
                PromptBuilder.buildTriagePrompt(
                        residentMessage
                );

        OllamaChatRequest request =
                new OllamaChatRequest(
                        model,
                        false,
                        "json",
                        List.of(
                                new OllamaMessage(
                                        "user",
                                        prompt
                                )
                        )
                );

        try {

            byte[] rawBody =
                    restClient.post()
                            .uri(apiUrl)
                            .contentType(MediaType.APPLICATION_JSON)
                            .accept(MediaType.APPLICATION_JSON, MediaType.ALL)
                            .body(request)
                            .exchange(
                                    (req, resp) ->
                                            resp.getBody().readAllBytes(),
                                    false
                            );

            if (rawBody == null || rawBody.length == 0) {
                throw new IllegalStateException(
                        "Empty Ollama response"
                );
            }

            OllamaChatResponse response =
                    objectMapper.readValue(
                            new String(rawBody, StandardCharsets.UTF_8),
                            OllamaChatResponse.class
                    );

            if (response.message() == null) {
                throw new IllegalStateException(
                        "Ollama response missing message"
                );
            }

            return objectMapper.readValue(
                    response.message().content(),
                    TriageResult.class
            );

        } catch (TriageUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {

            log.error(
                    "Ollama request failed",
                    ex
            );

            throw new TriageUnavailableException(
                    "AI triage service is unavailable",
                    ex
            );
        }
    }
}