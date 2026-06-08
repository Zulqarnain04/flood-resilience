package com.flood_resilience.backend.repository;

import com.flood_resilience.backend.entity.Assignment;
import com.flood_resilience.backend.entity.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository
        extends JpaRepository<Assignment, Long> {

    long countByStatus(
            AssignmentStatus status
    );
}