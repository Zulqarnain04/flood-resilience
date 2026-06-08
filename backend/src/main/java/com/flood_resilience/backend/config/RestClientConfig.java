package com.flood_resilience.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {

        JacksonJsonHttpMessageConverter jsonConverter =
                new JacksonJsonHttpMessageConverter();

        jsonConverter.setSupportedMediaTypes(
                List.of(
                        MediaType.APPLICATION_JSON,
                        MediaType.APPLICATION_OCTET_STREAM,
                        MediaType.ALL
                )
        );

        return RestClient.builder()
                .messageConverters(converters -> {
                    converters.clear();
                    converters.add(jsonConverter);
                })
                .build();
    }

    @Bean(name = "ollamaRestClient")
    public RestClient ollamaRestClient(
            @Value("${ollama.timeout-seconds:30}") int timeoutSeconds
    ) {

        SimpleClientHttpRequestFactory requestFactory =
                new SimpleClientHttpRequestFactory();

        Duration timeout = Duration.ofSeconds(timeoutSeconds);

        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        JacksonJsonHttpMessageConverter jsonConverter =
                new JacksonJsonHttpMessageConverter();

        jsonConverter.setSupportedMediaTypes(
                List.of(
                        MediaType.APPLICATION_JSON,
                        MediaType.APPLICATION_OCTET_STREAM,
                        MediaType.ALL
                )
        );

        return RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .messageConverters(converters -> {
                    converters.clear();
                    converters.add(jsonConverter);
                })
                .build();
    }
}
