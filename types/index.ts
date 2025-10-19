// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'agent' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: 'en' | 'he';
  timezone: string;
  currency: string;
  travelStyle: TravelStyle;
  interests: string[];
  accessibility: AccessibilityPreferences;
  dietary: DietaryPreferences;
}

export interface TravelStyle {
  budget: 'budget' | 'mid-range' | 'luxury';
  pace: 'relaxed' | 'moderate' | 'fast-paced';
  accommodation: 'hostel' | 'hotel' | 'airbnb' | 'luxury';
  transportation: 'public' | 'rental' | 'private';
  groupSize: 'solo' | 'couple' | 'family' | 'group';
}

export interface AccessibilityPreferences {
  mobility: boolean;
  visual: boolean;
  hearing: boolean;
  cognitive: boolean;
  notes?: string;
}

export interface DietaryPreferences {
  restrictions: string[];
  allergies: string[];
  preferences: string[];
}

// Itinerary Types
export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget: number;
  status: 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';
  days: ItineraryDay[];
  metadata: ItineraryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDay {
  day: number;
  date: Date;
  activities: Activity[];
  accommodation?: Accommodation;
  transportation?: Transportation;
  estimatedCost: number;
  notes?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'entertainment' | 'shopping' | 'other';
  description: string;
  location: Location;
  duration: number; // in minutes
  cost: number;
  rating?: number;
  bookingRequired: boolean;
  accessibility: AccessibilityInfo;
  sustainability: SustainabilityInfo;
  timeSlot: TimeSlot;
}

export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  country: string;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  flexible: boolean;
}

export interface Accommodation {
  name: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'resort' | 'other';
  location: Location;
  checkIn: Date;
  checkOut: Date;
  cost: number;
  rating?: number;
  amenities: string[];
}

export interface Transportation {
  type: 'flight' | 'train' | 'bus' | 'car' | 'walking' | 'other';
  from: Location;
  to: Location;
  departure: Date;
  arrival: Date;
  cost: number;
  bookingReference?: string;
}

export interface ItineraryMetadata {
  totalCost: number;
  sustainabilityScore: number;
  accessibilityScore: number;
  tags: string[];
  source: 'ai-generated' | 'user-created' | 'imported';
  aiPrompt?: string;
  version: number;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  visualAccessibility: boolean;
  hearingAccessibility: boolean;
  cognitiveAccessibility: boolean;
  notes?: string;
}

export interface SustainabilityInfo {
  ecoFriendly: boolean;
  carbonFootprint: number;
  localBusiness: boolean;
  sustainableTransport: boolean;
  notes?: string;
}

// Chat Types
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  context: ChatContext;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  tokens?: number;
  model?: string;
  tools?: string[];
  attachments?: Attachment[];
  actions?: AgentActionMetadata[];
}

export interface Attachment {
  type: 'image' | 'link' | 'pdf' | 'location';
  url: string;
  metadata?: any;
}

export interface ChatContext {
  currentItinerary?: string;
  userPreferences?: UserPreferences;
  conversationMemory: string[];
  activeTools: string[];
  lastAgentActions?: AgentActionMetadata[];
}

export interface AgentActionMetadata {
  tool: string;
  success: boolean;
  timestamp: Date;
  error?: string;
}

// Price Alert Types
export interface PriceAlert {
  id: string;
  userId: string;
  type: 'flight' | 'hotel' | 'activity';
  destination: string;
  targetPrice: number;
  currentPrice: number;
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
  notifications: Notification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: 'email' | 'push' | 'sms';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  content: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
