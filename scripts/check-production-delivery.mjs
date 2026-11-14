import { productionDeliveryEnabled } from '../src/lib/flags/production-delivery.ts';

if (!productionDeliveryEnabled(process.env.PRODUCTION_DELIVERY_ENABLED, new Date().toISOString().slice(0, 10))) {
  console.error('Production delivery is disabled or its rollout has expired.');
  process.exitCode = 1;
}
