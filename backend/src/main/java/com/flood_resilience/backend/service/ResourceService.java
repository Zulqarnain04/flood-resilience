package com.flood_resilience.backend.service;

import com.flood_resilience.backend.dto.request.CreateResourceRequest;
import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.entity.ResourceStatus;
import com.flood_resilience.backend.repository.ResourceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ResourceService {

    private final ResourceRepository repository;

    public ResourceService(
            ResourceRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional
    public Resource create(
            CreateResourceRequest request
    ) {

        Resource resource = new Resource();

        resource.setName(request.name());
        resource.setType(request.type());
        resource.setLatitude(request.latitude());
        resource.setLongitude(request.longitude());
        resource.setMaxCapacity(request.maxCapacity());
        resource.setAvailableCapacity(request.maxCapacity());
        resource.setPhoneNumber(request.phoneNumber());
        resource.setStatus(ResourceStatus.AVAILABLE);

        return repository.save(resource);
    }

    public Page<Resource> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Resource> findAvailable(Pageable pageable) {
        return repository.findByStatus(ResourceStatus.AVAILABLE, pageable);
    }
}
