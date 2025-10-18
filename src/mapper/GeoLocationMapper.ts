import { FindIpResponse, LocationData } from "../types";

export function mapToLocationData(response: FindIpResponse): LocationData {
  return {
    city: response.city.names.en || 'Unknown',
    country: response.country.names.en || 'Unknown',
    countryCode: response.country.iso_code,
    latitude: response.location.latitude,
    longitude: response.location.longitude,
    timezone: response.location.time_zone,
    isp: response.traits.isp,
    connectionType: response.traits.connection_type,
  };
}