package com.cbg.travel.repository;

import com.cbg.travel.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTravelRequestId(Long travelRequestId);
    List<Booking> findByTravelRequestIdIn(List<Long> travelRequestIds);
}
