package com.flood_resilience.backend.service;

import com.flood_resilience.backend.entity.*;
import com.flood_resilience.backend.repository.DangerZoneRepository;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import com.flood_resilience.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
public class DemoService {

    private final HelpRequestRepository helpRequestRepository;
    private final ResourceRepository resourceRepository;
    private final DangerZoneRepository dangerZoneRepository;
    private final UrgencyService urgencyService;

    public DemoService(
            HelpRequestRepository helpRequestRepository,
            ResourceRepository resourceRepository,
            DangerZoneRepository dangerZoneRepository,
            UrgencyService urgencyService
    ) {
        this.helpRequestRepository = helpRequestRepository;
        this.resourceRepository = resourceRepository;
        this.dangerZoneRepository = dangerZoneRepository;
        this.urgencyService = urgencyService;
    }

    public void generateDemoData() {

        createDangerZones();

        createResources();

        createRequests();
    }

    private void createDangerZones() {

        if (dangerZoneRepository.count() > 0) {
            return;
        }

        createDangerZone(
                "Sungai Skudai floodplain",
                1.4940,
                103.7420,
                900.0,
                9,
                ZoneCause.NEAR_RIVER
        );

        createDangerZone(
                "Senai low-ground basin",
                1.5050,
                103.7480,
                700.0,
                7,
                ZoneCause.LOW_GROUND
        );

        createDangerZone(
                "Kulai 2021 flood zone",
                1.5140,
                103.7540,
                600.0,
                8,
                ZoneCause.KNOWN_FLOOD
        );

        createDangerZone(
                "Riverside residential cluster",
                1.4985,
                103.7445,
                500.0,
                6,
                ZoneCause.NEAR_RIVER
        );
    }

    private void createDangerZone(
            String name,
            double centerLatitude,
            double centerLongitude,
            double radiusMeters,
            int riskWeight,
            ZoneCause cause
    ) {

        DangerZone zone = new DangerZone();

        zone.setName(name);
        zone.setCenterLatitude(centerLatitude);
        zone.setCenterLongitude(centerLongitude);
        zone.setRadiusMeters(radiusMeters);
        zone.setRiskWeight(riskWeight);
        zone.setCause(cause);

        dangerZoneRepository.save(zone);
    }

    private void createResources() {

        if (resourceRepository.count() > 0) {
            return;
        }

        createResource(
                "Boat Alpha",
                ResourceType.BOAT,
                1.4927,
                103.7414,
                8
        );

        createResource(
                "Boat Bravo",
                ResourceType.BOAT,
                1.4960,
                103.7440,
                6
        );

        createResource(
                "Volunteer Team A",
                ResourceType.VOLUNTEER,
                1.5000,
                103.7480,
                12
        );

        createResource(
                "Volunteer Team B",
                ResourceType.VOLUNTEER,
                1.5050,
                103.7500,
                10
        );

        createResource(
                "Shelter Senai",
                ResourceType.SHELTER,
                1.5100,
                103.7520,
                100
        );

        createResource(
                "Shelter Kulai",
                ResourceType.SHELTER,
                1.5150,
                103.7550,
                120
        );

        createResource(
                "Medical Unit A",
                ResourceType.MEDICAL_SUPPLY,
                1.4980,
                103.7460,
                50
        );

        createResource(
                "Medical Unit B",
                ResourceType.MEDICAL_SUPPLY,
                1.5030,
                103.7490,
                40
        );
    }

    private void createResource(
            String name,
            ResourceType type,
            double latitude,
            double longitude,
            int capacity
    ) {

        Resource resource =
                new Resource();

        resource.setName(name);
        resource.setType(type);

        resource.setLatitude(latitude);
        resource.setLongitude(longitude);

        resource.setMaxCapacity(capacity);
        resource.setAvailableCapacity(capacity);

        resource.setStatus(
                ResourceStatus.AVAILABLE
        );

        resource.setPhoneNumber(
                "0123456789"
        );

        resourceRepository.save(resource);
    }

    private void createRequests() {

        if (helpRequestRepository.count() > 0) {
            return;
        }

        RequestCategory[] categories = {
                RequestCategory.MEDICAL,
                RequestCategory.SUPPLIES,
                RequestCategory.RESCUE,
                RequestCategory.SHELTER
        };

        for (int i = 1; i <= 20; i++) {

            HelpRequest request =
                    new HelpRequest();

            request.setClientRequestId(
                    UUID.randomUUID().toString()
            );

            request.setMessage(
                    "Demo flood request #" + i
            );

            RequestCategory category =
                    categories[
                            ThreadLocalRandom.current()
                                    .nextInt(
                                            categories.length
                                    )
                            ];

            request.setCategory(category);

            request.setSummary(
                    "Demo generated request"
            );

            request.setDangerScore(
                    ThreadLocalRandom.current()
                            .nextInt(1, 11)
            );

            request.setVulnerabilityScore(
                    ThreadLocalRandom.current()
                            .nextInt(1, 11)
            );

            request.setPeopleCount(
                    ThreadLocalRandom.current()
                            .nextInt(1, 6)
            );

            request.setDetectedLanguage(
                    "en"
            );

            request.setNeeds(
                    java.util.List.of("water", "food")
            );

            request.setLatitude(
                    1.49 +
                            ThreadLocalRandom.current()
                                    .nextDouble(0.03)
            );

            request.setLongitude(
                    103.74 +
                            ThreadLocalRandom.current()
                                    .nextDouble(0.03)
            );

            int locationRisk =
                    urgencyService.computeLocationRisk(
                            request.getLatitude(),
                            request.getLongitude(),
                            dangerZoneRepository.findAll()
                    );

            double urgencyScore =
                    urgencyService.computeUrgency(
                            request.getDangerScore(),
                            locationRisk,
                            request.getVulnerabilityScore()
                    );

            request.setLocationRisk(locationRisk);
            request.setUrgencyScore(urgencyScore);
            request.setUrgencyLevel(
                    urgencyService.toLevel(urgencyScore)
            );

            request.setStatus(
                    RequestStatus.PENDING
            );

            helpRequestRepository.save(
                    request
            );
        }
    }
}