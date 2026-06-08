package com.flood_resilience.backend.repository;

import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.entity.ResourceStatus;
import com.flood_resilience.backend.entity.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository
        extends JpaRepository<Resource, Long> {

    List<Resource> findByStatus(
            ResourceStatus status
    );

    Page<Resource> findByStatus(
            ResourceStatus status,
            Pageable pageable
    );

    List<Resource> findByType(
            ResourceType type
    );

    long countByStatus(
            ResourceStatus status
    );
}