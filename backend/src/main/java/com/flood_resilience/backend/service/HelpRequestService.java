package com.flood_resilience.backend.service;

import com.flood_resilience.backend.common.exception.NotFoundException;
import com.flood_resilience.backend.dto.response.TriageResult;
import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.entity.RequestCategory;
import com.flood_resilience.backend.entity.RequestStatus;
import com.flood_resilience.backend.entity.UrgencyLevel;
import com.flood_resilience.backend.repository.DangerZoneRepository;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class HelpRequestService {

    private static final Logger log =
            LoggerFactory.getLogger(HelpRequestService.class);

    private final HelpRequestRepository repository;
    private final DangerZoneRepository dangerZoneRepository;
    private final UrgencyService urgencyService;
    private final RealtimeEventService realtimeEventService;

    public HelpRequestService(
            HelpRequestRepository repository,
            DangerZoneRepository dangerZoneRepository,
            UrgencyService urgencyService,
            RealtimeEventService realtimeEventService
    ) {
        this.repository = repository;
        this.dangerZoneRepository = dangerZoneRepository;
        this.urgencyService = urgencyService;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional
    public HelpRequest save(
            String clientRequestId,
            String message,
            Double latitude,
            Double longitude,
            TriageResult triageResult
    ) {

        return repository.findByClientRequestId(
                        clientRequestId
                )
                .orElseGet(() -> {

                    HelpRequest request =
                            new HelpRequest();

                    request.setClientRequestId(
                            clientRequestId
                    );

                    request.setMessage(
                            message
                    );

                    request.setSummary(
                            triageResult.summary()
                    );

                    request.setCategory(
                            parseCategory(triageResult.category())
                    );

                    request.setDangerScore(
                            triageResult.dangerScore()
                    );

                    request.setVulnerabilityScore(
                            triageResult.vulnerabilityScore()
                    );

                    request.setPeopleCount(
                            triageResult.peopleCount()
                    );

                    request.setDetectedLanguage(
                            triageResult.detectedLanguage()
                    );

                    request.setNeeds(
                            triageResult.needs() == null
                                    ? java.util.List.of()
                                    : triageResult.needs()
                    );

                    request.setLatitude(
                            latitude
                    );

                    request.setLongitude(
                            longitude
                    );

                    int locationRisk =
                            urgencyService.computeLocationRisk(
                                    latitude,
                                    longitude,
                                    dangerZoneRepository.findAll()
                            );

                    double urgencyScore =
                            urgencyService.computeUrgency(
                                    triageResult.dangerScore(),
                                    locationRisk,
                                    triageResult.vulnerabilityScore()
                            );

                    UrgencyLevel urgencyLevel =
                            urgencyService.toLevel(urgencyScore);

                    request.setLocationRisk(locationRisk);
                    request.setUrgencyScore(urgencyScore);
                    request.setUrgencyLevel(urgencyLevel);

                    request.setStatus(
                            RequestStatus.PENDING
                    );

                    HelpRequest saved =
                            repository.save(
                                    request
                            );

                    realtimeEventService.publish(
                            "REQUEST_CREATED",
                            "New help request received"
                    );

                    return saved;
                });
    }

    public Optional<HelpRequest> findByClientRequestId(
            String clientRequestId
    ) {
        return repository.findByClientRequestId(clientRequestId);
    }

    private RequestCategory parseCategory(String raw) {

        if (raw == null) {
            log.warn("Triage returned null category, defaulting to OTHER");
            return RequestCategory.OTHER;
        }

        try {
            return RequestCategory.valueOf(
                    raw.trim().toUpperCase()
            );
        } catch (IllegalArgumentException ex) {
            log.warn(
                    "Triage returned unknown category '{}', defaulting to OTHER",
                    raw
            );
            return RequestCategory.OTHER;
        }
    }

    public Page<HelpRequest> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public HelpRequest findById(
            Long id
    ) {

        return repository.findById(id)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Help request not found: " + id
                        )
                );
    }
}
