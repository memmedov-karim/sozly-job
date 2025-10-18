import { GenderEnum, ChatTypeEnum } from '../enum/index';

export interface MatchSession {
  id: string;
  users: string[];
  status: 'waiting' | 'pending' | 'connected' | 'rejected' | 'ended';
  startedAt: string;
  chatType: 'voice' | 'text';
  endedAt?: string;
}

export interface CleanupStats {
  totalScanned: number;
  totalDeleted: number;
  rejectedDeleted: number;
  endedDeleted: number;
  lastCleanup: Date | null;
  errors: number;
  lastError: string | null;
}


export interface UserPreferences {
  gender: GenderEnum;
  preferredGender: GenderEnum | 'any';
  age: {
    min: number;
    max: number;
  };
  preferredAgeRange: {
    min: number;
    max: number;
  }[];
  topics: string[];
  language: string[];
  chatType: ChatTypeEnum;
}

export interface User {
  socketId: string;
  preferences: UserPreferences;
  isSearching: boolean;
  currentMatch?: string;
  joinedAt: Date;
  location?: {
    country: string;
    region: string;
  };
}


export interface OptionType {
  value: string;
  name: Record<string, string>;
}


export interface FindIpResponse {
  city: {
    geoname_id: number;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  continent: {
    code: string;
    geoname_id: number;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  country: {
    geoname_id: number;
    is_in_european_union: boolean;
    iso_code: string;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  location: {
    latitude: number;
    longitude: number;
    time_zone: string;
    weather_code: string;
  };
  subdivisions: Array<{
    geoname_id?: number;
    iso_code?: string;
    names: {
      en?: string;
      [key: string]: string | undefined;
    };
  }>;
  traits: {
    autonomous_system_number: number;
    autonomous_system_organization: string;
    connection_type: string;
    isp: string;
    user_type: string;
  };
}


export interface LocationData {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  connectionType: string;
}