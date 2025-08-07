'use client';

import RealUserGuard from '@/components/RealUserGuard';
import DeliveryDashboard from '@/components/DeliveryDashboard';

export default function DeliveryPage() {
  return (
    <RealUserGuard requiredRoles={['delivery', 'admin']}>
      <DeliveryDashboard />
    </RealUserGuard>
  );
} 