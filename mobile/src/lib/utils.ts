import { UrgencyLevel } from './api';
import { Colors } from '../constants/theme';

export function urgencyColor(level: UrgencyLevel | null | undefined): string {
  switch (level) {
    case 'CRITICAL': return Colors.urgencyCritical;
    case 'HIGH':     return Colors.urgencyHigh;
    case 'MODERATE': return Colors.urgencyModerate;
    case 'LOW':      return Colors.urgencyLow;
    default:         return Colors.urgencyLow;
  }
}

export function categoryIcon(category: string): string {
  // Returns a MaterialIcons icon name
  switch (category?.toUpperCase()) {
    case 'MEDICAL':  return 'medical-services';
    case 'RESCUE':   return 'directions-boat';
    case 'SUPPLIES': return 'inventory-2';
    case 'SHELTER':  return 'home';
    default:         return 'help-outline';
  }
}

export function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
