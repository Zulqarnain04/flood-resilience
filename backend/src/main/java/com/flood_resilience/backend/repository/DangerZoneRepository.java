package com.flood_resilience.backend.repository;

import com.flood_resilience.backend.entity.DangerZone;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DangerZoneRepository
        extends JpaRepository<DangerZone, Long> {
}
