package com.flood_resilience.backend.repository;

import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.entity.RequestCategory;
import com.flood_resilience.backend.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HelpRequestRepository
        extends JpaRepository<HelpRequest, Long> {

    List<HelpRequest> findByStatus(
            RequestStatus status
    );

    List<HelpRequest> findByCategory(
            RequestCategory category
    );

    List<HelpRequest> findAllByOrderByUrgencyScoreDescCreatedAtDesc();

    Optional<HelpRequest> findByClientRequestId(
            String clientRequestId
    );

    long countByStatus(
            RequestStatus status
    );

    long countByCategory(
            RequestCategory category
    );

    List<HelpRequest> findByDangerScoreGreaterThanEqual(
            Integer score
    );
}