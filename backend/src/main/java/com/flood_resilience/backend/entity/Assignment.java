package com.flood_resilience.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "help_request_id")
    private HelpRequest helpRequest;

    @ManyToOne(optional = false)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Column(nullable = false, updatable = false)
    private Instant assignedAt;

    private Instant acceptedAt;

    private Instant completedAt;

    @PrePersist
    public void prePersist() {

        assignedAt = Instant.now();

        if (status == null) {
            status = AssignmentStatus.PENDING;
        }
    }
}