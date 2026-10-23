const CURRENT_LOCATION_KEY = 'currentLocation';
export const LOCATION_UPDATED_EVENT = 'current-location-updated';

// Stored client-side (independent of sign-in state) so it shows in the
// navbar for both guests and signed-in users.
export const getCurrentLocation = (): string => {
  return localStorage.getItem(CURRENT_LOCATION_KEY) || '';
};

export const setCurrentLocation = (location: string) => {
  const trimmed = location.trim();
  if (trimmed) {
    localStorage.setItem(CURRENT_LOCATION_KEY, trimmed);
  } else {
    localStorage.removeItem(CURRENT_LOCATION_KEY);
  }
  window.dispatchEvent(new Event(LOCATION_UPDATED_EVENT));
};
