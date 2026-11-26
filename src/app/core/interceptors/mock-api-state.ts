import { MerchantApplication } from '../models/application.model';
import { INITIAL_MOCK_APPLICATIONS } from '../services/mock-data';

export const mockApiState = {
  applications: JSON.parse(JSON.stringify(INITIAL_MOCK_APPLICATIONS)) as MerchantApplication[],
  tokenExpired: false,
};

/** Restores the in-memory mock database and token state to their initial values. */
export function resetMockBackendState(): void {
  mockApiState.applications = JSON.parse(JSON.stringify(INITIAL_MOCK_APPLICATIONS));
  mockApiState.tokenExpired = false;
}

/** Sets the mock backend's token-expiration state for authentication tests. */
export function setMockBackendTokenExpired(expired: boolean): void {
  mockApiState.tokenExpired = expired;
}

/** Returns the number of records currently held by the mock backend. */
export function getMockApplicationsCount(): number {
  return mockApiState.applications.length;
}
