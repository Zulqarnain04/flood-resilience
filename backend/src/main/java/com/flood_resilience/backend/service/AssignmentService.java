package com.flood_resilience.backend.service;

import com.flood_resilience.backend.common.exception.BusinessRuleException;
import com.flood_resilience.backend.common.exception.NotFoundException;
import com.flood_resilience.backend.dto.request.CreateAssignmentRequest;
import com.flood_resilience.backend.entity.*;
import com.flood_resilience.backend.repository.AssignmentRepository;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import com.flood_resilience.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final HelpRequestRepository helpRequestRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            HelpRequestRepository helpRequestRepository,
            ResourceRepository resourceRepository,
            NotificationService notificationService
    ) {
        this.assignmentRepository = assignmentRepository;
        this.helpRequestRepository = helpRequestRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
    }

    public Assignment create(
            CreateAssignmentRequest request
    ) {

        HelpRequest helpRequest =
                helpRequestRepository.findById(
                        request.helpRequestId()
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Help request not found: " + request.helpRequestId()
                        )
                );

        Resource resource =
                resourceRepository.findById(
                        request.resourceId()
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Resource not found: " + request.resourceId()
                        )
                );

        Assignment assignment =
                new Assignment();

        assignment.setHelpRequest(
                helpRequest
        );

        assignment.setResource(
                resource
        );

        assignment.setStatus(
                AssignmentStatus.PENDING
        );

        helpRequest.setStatus(
                RequestStatus.ASSIGNED
        );

        helpRequestRepository.save(
                helpRequest
        );

        notificationService.create(
                "Assignment created for " +
                        resource.getName(),
                NotificationType.ASSIGNMENT_CREATED
        );

        return assignmentRepository.save(
                assignment
        );
    }

    public Assignment accept(
            Long assignmentId
    ) {

        Assignment assignment =
                assignmentRepository.findById(
                        assignmentId
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Assignment not found: " + assignmentId
                        )
                );

        HelpRequest request =
                assignment.getHelpRequest();

        Resource resource =
                assignment.getResource();

        if (
                resource.getAvailableCapacity()
                        < request.getPeopleCount()
        ) {
            throw new BusinessRuleException(
                    "Resource capacity insufficient"
            );
        }

        resource.setAvailableCapacity(
                resource.getAvailableCapacity()
                        - request.getPeopleCount()
        );

        if (resource.getAvailableCapacity() <= 0) {
            resource.setStatus(ResourceStatus.ASSIGNED);
        }

        resourceRepository.save(
                resource
        );

        assignment.setStatus(
                AssignmentStatus.ACCEPTED
        );

        assignment.setAcceptedAt(
                Instant.now()
        );

        request.setStatus(
                RequestStatus.IN_PROGRESS
        );

        helpRequestRepository.save(
                request
        );

        notificationService.create(
                resource.getName() +
                        " accepted assignment",
                NotificationType.ASSIGNMENT_ACCEPTED
        );

        return assignmentRepository.save(
                assignment
        );
    }

    public Assignment reject(
            Long assignmentId
    ) {

        Assignment assignment =
                assignmentRepository.findById(
                        assignmentId
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Assignment not found: " + assignmentId
                        )
                );

        assignment.setStatus(
                AssignmentStatus.REJECTED
        );

        notificationService.create(
                assignment.getResource().getName()
                        + " rejected assignment",
                NotificationType.ASSIGNMENT_REJECTED
        );

        return assignmentRepository.save(
                assignment
        );
    }

    public Assignment complete(
            Long assignmentId
    ) {

        Assignment assignment =
                assignmentRepository.findById(
                        assignmentId
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Assignment not found: " + assignmentId
                        )
                );

        HelpRequest request =
                assignment.getHelpRequest();

        Resource resource =
                assignment.getResource();

        resource.setAvailableCapacity(
                resource.getAvailableCapacity()
                        + request.getPeopleCount()
        );

        if (
                resource.getStatus() == ResourceStatus.ASSIGNED
                        && resource.getAvailableCapacity() > 0
        ) {
            resource.setStatus(ResourceStatus.AVAILABLE);
        }

        resourceRepository.save(
                resource
        );

        assignment.setStatus(
                AssignmentStatus.COMPLETED
        );

        assignment.setCompletedAt(
                Instant.now()
        );

        request.setStatus(
                RequestStatus.RESOLVED
        );

        helpRequestRepository.save(
                request
        );

        notificationService.create(
                "Assignment completed",
                NotificationType.ASSIGNMENT_COMPLETED
        );

        return assignmentRepository.save(
                assignment
        );
    }
}