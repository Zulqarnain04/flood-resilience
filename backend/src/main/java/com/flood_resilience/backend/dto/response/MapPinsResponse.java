package com.flood_resilience.backend.dto.response;

import java.util.List;

public record MapPinsResponse(

        List<MapPinResponse> requests,

        List<MapPinResponse> resources

) {
}