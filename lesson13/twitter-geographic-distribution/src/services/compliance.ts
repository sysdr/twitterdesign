import { ComplianceRule } from '../types';

export class ComplianceService {
  private rules: ComplianceRule[] = [
    {
      region: 'eu-central',
      dataTypes: ['personal_data', 'user_profiles', 'direct_messages'],
      restrictions: ['no_us_transfer', 'encryption_required', 'audit_log'],
      allowedCrossRegion: false
    },
    {
      region: 'asia-pacific',
      dataTypes: ['personal_data', 'location_data'],
      restrictions: ['local_residency', 'government_access'],
      allowedCrossRegion: true
    },
    {
      region: 'us-east',
      dataTypes: ['all'],
      restrictions: ['ccpa_compliance'],
      allowedCrossRegion: true
    }
  ];

  canStoreData(dataType: string, region: string): boolean {
    const rule = this.rules.find(r => r.region === region);
    if (!rule) return true;

    return rule.dataTypes.includes('all') || rule.dataTypes.includes(dataType);
  }

  canTransferData(dataType: string, fromRegion: string, toRegion: string): boolean {
    const fromRule = this.rules.find(r => r.region === fromRegion);
    if (!fromRule || !fromRule.allowedCrossRegion) return false;

    return this.canStoreData(dataType, toRegion);
  }

  getDataResidencyRegion(userCountry: string): string {
    // EU countries must store personal data in EU
    const euCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'FI', 'NO'];
    if (euCountries.includes(userCountry)) {
      return 'eu-central';
    }

    // Asian countries prefer local storage
    const asianCountries = ['SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'IN', 'JP', 'KR'];
    if (asianCountries.includes(userCountry)) {
      return 'asia-pacific';
    }

    return 'us-east';
  }

  getComplianceRules(): ComplianceRule[] {
    return this.rules;
  }
}
