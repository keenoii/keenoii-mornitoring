/**
 * Application Settings & Constants Configuration
 * Single Source of Truth for thresholds, statuses, colors, and timing.
 */

export interface HealthThresholdConfig {
  excellent: number; // >= 90
  healthy: number;   // >= 75
  attention: number; // >= 60
  risk: number;      // >= 40
  critical: number;  // < 40
}

export interface AppSettingsConfig {
  healthThresholds: HealthThresholdConfig;
  stalePolicy: {
    developmentMaxInactiveDays: number;
    testingMaxInactiveDays: number;
    maintenanceMaxInactiveDays: number;
  };
  statusColors: {
    healthy: string;
    attention: string;
    critical: string;
    dormant: string;
  };
  officeTour: {
    stepDurationMs: number;
    typingSpeedMs: number;
  };
  officeAutoRefreshIntervalMs: number;
}

export const APP_SETTINGS: AppSettingsConfig = {
  healthThresholds: {
    excellent: 90,
    healthy: 75,
    attention: 60,
    risk: 40,
    critical: 40,
  },
  stalePolicy: {
    developmentMaxInactiveDays: 14,
    testingMaxInactiveDays: 14,
    maintenanceMaxInactiveDays: 90,
  },
  statusColors: {
    healthy: '#10b981',
    attention: '#f59e0b',
    critical: '#f43f5e',
    dormant: '#64748b',
  },
  officeTour: {
    stepDurationMs: 6500,
    typingSpeedMs: 30,
  },
  officeAutoRefreshIntervalMs: 5 * 60 * 1000, // 5 minutes auto refresh
};
