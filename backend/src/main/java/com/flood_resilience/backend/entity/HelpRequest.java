package com.flood_resilience.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "help_requests",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_client_request_id",
                        columnNames = "client_request_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class HelpRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "client_request_id",
            nullable = false,
            unique = true,
            length = 100
    )
    private String clientRequestId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 500)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RequestCategory category;

    @Column(nullable = false)
    private Integer dangerScore;

    @Column(nullable = false)
    private Integer vulnerabilityScore;

    @Column(nullable = false)
    private Integer peopleCount;

    @Column(nullable = false, length = 20)
    private String detectedLanguage;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "help_request_needs",
            joinColumns = @JoinColumn(name = "help_request_id")
    )
    @Column(name = "need", length = 200, nullable = false)
    private List<String> needs = new ArrayList<>();

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer locationRisk;

    @Column(nullable = false)
    private Double urgencyScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UrgencyLevel urgencyLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RequestStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {

        Instant now = Instant.now();

        this.createdAt = now;
        this.updatedAt = now;

        if (this.status == null) {
            this.status = RequestStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}