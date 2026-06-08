package com.flood_resilience.backend.service;

import com.flood_resilience.backend.dto.response.CategoryAnalyticsResponse;
import com.flood_resilience.backend.dto.response.DashboardSummaryResponse;
import com.flood_resilience.backend.entity.*;
import com.flood_resilience.backend.repository.AssignmentRepository;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import com.flood_resilience.backend.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardService {

    private final HelpRequestRepository helpRequestRepository;
    private final ResourceRepository resourceRepository;
    private final AssignmentRepository assignmentRepository;
    private final int highPriorityThreshold;

    public DashboardService(
            HelpRequestRepository helpRequestRepository,
            ResourceRepository resourceRepository,
            AssignmentRepository assignmentRepository,
            @Value("${app.dashboard.high-priority-threshold:8}") int highPriorityThreshold
    ) {
        this.helpRequestRepository =
                helpRequestRepository;

        this.resourceRepository =
                resourceRepository;

        this.assignmentRepository =
                assignmentRepository;

        this.highPriorityThreshold =
                highPriorityThreshold;
    }

    public DashboardSummaryResponse getSummary() {

        return new DashboardSummaryResponse(

                helpRequestRepository.count(),

                helpRequestRepository.countByStatus(
                        RequestStatus.PENDING
                ),

                helpRequestRepository.countByStatus(
                        RequestStatus.ASSIGNED
                ),

                helpRequestRepository.countByStatus(
                        RequestStatus.IN_PROGRESS
                ),

                helpRequestRepository.countByStatus(
                        RequestStatus.RESOLVED
                ),

                resourceRepository.count(),

                resourceRepository.countByStatus(
                        ResourceStatus.AVAILABLE
                ),

                resourceRepository.countByStatus(
                        ResourceStatus.ASSIGNED
                ),

                assignmentRepository.count(),

                assignmentRepository.countByStatus(
                        AssignmentStatus.ACCEPTED
                )
        );
    }

    public CategoryAnalyticsResponse getCategories() {

        return new CategoryAnalyticsResponse(

                helpRequestRepository.countByCategory(
                        RequestCategory.MEDICAL
                ),

                helpRequestRepository.countByCategory(
                        RequestCategory.RESCUE
                ),

                helpRequestRepository.countByCategory(
                        RequestCategory.SUPPLIES
                ),

                helpRequestRepository.countByCategory(
                        RequestCategory.SHELTER
                ),

                helpRequestRepository.countByCategory(
                        RequestCategory.OTHER
                )
        );
    }

    public List<HelpRequest> getHighPriorityRequests() {

        return helpRequestRepository
                .findByDangerScoreGreaterThanEqual(
                        highPriorityThreshold
                );
    }
}