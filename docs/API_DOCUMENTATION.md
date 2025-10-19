# vAI Travel Agent - API Documentation

## Overview

The vAI Travel Agent API provides comprehensive endpoints for travel planning, AI-powered assistance, and external service integration. All endpoints are RESTful and return JSON responses.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

The API uses API key authentication. Include your API key in the request headers:

```http
Authorization: Bearer your_api_key_here
```

Or as a query parameter:

```
?api_key=your_api_key_here
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "error": null
}
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code when limit exceeded

## Chat API

### Create Chat Session

Create a new chat session with the AI agent.

```http
POST /api/chat
```

**Request Body:**
```json
{
  "title": "Paris Travel Planning",
  "context": {
    "activeTools": ["search_travel_guides", "get_weather"],
    "userPreferences": {
      "budget": "mid-range",
      "travelStyle": "adventure"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat_123",
    "userId": "user_456",
    "title": "Paris Travel Planning",
    "messages": [],
    "context": {
      "conversationMemory": [],
      "activeTools": ["search_travel_guides", "get_weather"],
      "userPreferences": {
        "budget": "mid-range",
        "travelStyle": "adventure"
      }
    },
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "message": "Chat session created successfully"
}
```

### Get Chat Session

Retrieve a specific chat session.

```http
GET /api/chat/{sessionId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat_123",
    "userId": "user_456",
    "title": "Paris Travel Planning",
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "I want to visit Paris for 3 days",
        "timestamp": "2024-01-15T10:05:00Z",
        "metadata": {}
      },
      {
        "id": "msg_2",
        "role": "assistant",
        "content": "I'd be happy to help you plan your 3-day Paris trip!",
        "timestamp": "2024-01-15T10:05:30Z",
        "metadata": {
          "actions": [
            {
              "tool": "search_travel_guides",
              "success": true,
              "timestamp": "2024-01-15T10:05:15Z"
            }
          ]
        }
      }
    ],
    "context": {
      "conversationMemory": ["User wants 3-day Paris trip"],
      "activeTools": ["search_travel_guides", "get_weather"],
      "lastAgentActions": [
        {
          "tool": "search_travel_guides",
          "success": true,
          "timestamp": "2024-01-15T10:05:15Z"
        }
      ]
    },
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:05:30Z"
  }
}
```

### Send Message

Send a message to the AI agent and get a response.

```http
POST /api/chat/{sessionId}/messages
```

**Request Body:**
```json
{
  "content": "What are the must-see attractions in Paris?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "chat_123",
      "messages": [
        {
          "id": "msg_3",
          "role": "user",
          "content": "What are the must-see attractions in Paris?",
          "timestamp": "2024-01-15T10:10:00Z"
        },
        {
          "id": "msg_4",
          "role": "assistant",
          "content": "Here are the must-see attractions in Paris...",
          "timestamp": "2024-01-15T10:10:15Z",
          "metadata": {
            "actions": [
              {
                "tool": "search_travel_guides",
                "success": true,
                "timestamp": "2024-01-15T10:10:05Z"
              }
            ]
          }
        }
      ]
    },
    "aiResponse": "Here are the must-see attractions in Paris...",
    "actions": [
      {
        "tool": "search_travel_guides",
        "success": true,
        "timestamp": "2024-01-15T10:10:05Z"
      }
    ]
  },
  "message": "Message processed successfully"
}
```

### List User Chat Sessions

Get all chat sessions for a user.

```http
GET /api/chat?page=1&limit=10&status=active
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active, archived)
- `search` (optional): Search by title

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat_123",
      "title": "Paris Travel Planning",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:05:30Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "message": "Chat sessions fetched successfully"
}
```

## Itinerary API

### Create Itinerary

Create a new travel itinerary.

```http
POST /api/itineraries
```

**Request Body:**
```json
{
  "title": "Paris Adventure",
  "destination": "Paris, France",
  "startDate": "2024-02-15",
  "endDate": "2024-02-18",
  "travelers": 2,
  "budget": 2000,
  "preferences": {
    "interests": ["culture", "food", "history"],
    "accommodation": "hotel",
    "transportation": "public"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "itinerary_789",
    "userId": "user_456",
    "title": "Paris Adventure",
    "destination": "Paris, France",
    "startDate": "2024-02-15",
    "endDate": "2024-02-18",
    "travelers": 2,
    "budget": 2000,
    "status": "draft",
    "days": [],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "message": "Itinerary created successfully"
}
```

### Get Itinerary

Retrieve a specific itinerary.

```http
GET /api/itineraries/{itineraryId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "itinerary_789",
    "userId": "user_456",
    "title": "Paris Adventure",
    "destination": "Paris, France",
    "startDate": "2024-02-15",
    "endDate": "2024-02-18",
    "travelers": 2,
    "budget": 2000,
    "status": "confirmed",
    "days": [
      {
        "day": 1,
        "date": "2024-02-15",
        "activities": [
          {
            "id": "activity_1",
            "name": "Visit Eiffel Tower",
            "description": "Iconic iron tower with city views",
            "time": "10:00",
            "location": "Champ de Mars, 7th arrondissement",
            "duration": "2 hours",
            "cost": 25,
            "type": "attraction"
          }
        ]
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

### Update Itinerary

Update an existing itinerary.

```http
PUT /api/itineraries/{itineraryId}
```

**Request Body:**
```json
{
  "title": "Paris Adventure - Updated",
  "status": "confirmed",
  "budget": 2500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "itinerary_789",
    "title": "Paris Adventure - Updated",
    "status": "confirmed",
    "budget": 2500,
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "message": "Itinerary updated successfully"
}
```

### List User Itineraries

Get all itineraries for a user.

```http
GET /api/itineraries?page=1&limit=10&status=confirmed
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (draft, confirmed, completed, cancelled)
- `destination` (optional): Filter by destination
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "itinerary_789",
      "title": "Paris Adventure",
      "destination": "Paris, France",
      "startDate": "2024-02-15",
      "endDate": "2024-02-18",
      "status": "confirmed",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "message": "Itineraries fetched successfully"
}
```

### Delete Itinerary

Delete an itinerary.

```http
DELETE /api/itineraries/{itineraryId}
```

**Response:**
```json
{
  "success": true,
  "message": "Itinerary deleted successfully"
}
```

## AI Search API

### Search Travel Content

Search for travel-related content using AI-powered vector search.

```http
GET /api/ai/search?query=Paris attractions&location=Paris&type=attraction&topK=5
```

**Query Parameters:**
- `query` (required): Search query
- `location` (optional): Location filter
- `type` (optional): Content type filter (itinerary, guide, review, attraction, restaurant, other)
- `topK` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "Paris attractions",
    "location": "Paris",
    "type": "attraction",
    "results": [
      {
        "id": "attraction_1",
        "title": "Eiffel Tower",
        "content": "The Eiffel Tower is an iron lattice tower located on the Champ de Mars in Paris...",
        "type": "attraction",
        "location": "Paris, France",
        "tags": ["landmark", "architecture", "views"],
        "score": 0.95
      }
    ],
    "total": 1
  },
  "message": "Search completed successfully"
}
```

### AI Chat Endpoint

Direct AI chat endpoint for simple interactions.

```http
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "What's the weather like in Paris?",
  "context": {
    "userId": "user_456",
    "sessionId": "session_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "The current weather in Paris is 15°C with partly cloudy skies...",
    "actions": [
      {
        "tool": "get_weather",
        "success": true,
        "timestamp": "2024-01-15T10:15:00Z"
      }
    ]
  },
  "message": "AI response generated successfully"
}
```

### Generate Itinerary

Generate a complete itinerary using AI.

```http
POST /api/ai/itinerary
```

**Request Body:**
```json
{
  "destination": "Paris, France",
  "duration": 3,
  "travelers": 2,
  "budget": 2000,
  "interests": ["culture", "food", "history"],
  "preferences": {
    "accommodation": "hotel",
    "transportation": "public"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "itinerary": {
      "id": "generated_123",
      "title": "3-Day Paris Cultural Adventure",
      "destination": "Paris, France",
      "days": [
        {
          "day": 1,
          "activities": [
            {
              "name": "Visit Louvre Museum",
              "time": "10:00",
              "duration": "3 hours",
              "cost": 17,
              "type": "attraction"
            }
          ]
        }
      ],
      "totalCost": 1800,
      "budgetRemaining": 200
    }
  },
  "message": "Itinerary generated successfully"
}
```

## External APIs

### Countries API

Get country information and search countries.

```http
GET /api/countries?action=all
GET /api/countries?action=search&query=France
GET /api/countries?action=region&region=Europe
```

**Query Parameters:**
- `action` (required): Action type (all, search, region, subregion, capital, language, currency, popular, continent)
- `query` (optional): Search query
- `region` (optional): Region filter
- `subregion` (optional): Subregion filter
- `capital` (optional): Capital filter
- `language` (optional): Language filter
- `currency` (optional): Currency filter
- `continent` (optional): Continent filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "France",
      "code": "FR",
      "capital": "Paris",
      "region": "Europe",
      "subregion": "Western Europe",
      "population": 67000000,
      "area": 551695,
      "languages": ["French"],
      "currencies": ["EUR"]
    }
  ],
  "message": "Countries data fetched successfully"
}
```

### Places API

Search for places and get place information.

```http
GET /api/places?action=search&query=Eiffel Tower&location=48.8566,2.3522
GET /api/places?action=nearby&location=48.8566,2.3522&radius=1000&type=restaurant
GET /api/places?action=details&placeId=ChIJLU7jZClu5kcR4PcOOO6p3I0
```

**Query Parameters:**
- `action` (required): Action type (search, nearby, details)
- `query` (optional): Search query
- `location` (optional): Location coordinates (lat,lng)
- `radius` (optional): Search radius in meters
- `type` (optional): Place type filter
- `placeId` (optional): Google Place ID for details

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
      "name": "Eiffel Tower",
      "formatted_address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
      "geometry": {
        "location": {
          "lat": 48.8583701,
          "lng": 2.2944813
        }
      },
      "types": ["tourist_attraction", "point_of_interest", "establishment"],
      "rating": 4.6,
      "user_ratings_total": 1234567,
      "price_level": 2
    }
  ],
  "message": "Places data fetched successfully"
}
```

### Flights API

Search for flights.

```http
GET /api/flights?origin=LAX&destination=CDG&departureDate=2024-02-15&returnDate=2024-02-22&adults=2&travelClass=ECONOMY
```

**Query Parameters:**
- `origin` (required): Origin airport code (IATA)
- `destination` (required): Destination airport code (IATA)
- `departureDate` (required): Departure date (YYYY-MM-DD)
- `returnDate` (optional): Return date (YYYY-MM-DD)
- `adults` (optional): Number of adult passengers (default: 1)
- `children` (optional): Number of child passengers
- `infants` (optional): Number of infant passengers
- `travelClass` (optional): Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
- `nonStop` (optional): Non-stop flights only (default: false)
- `maxPrice` (optional): Maximum price filter
- `currency` (optional): Currency code (default: USD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "flight_123",
      "airline": "Air France",
      "flightNumber": "AF123",
      "departure": {
        "airport": "LAX",
        "time": "2024-02-15T14:30:00Z",
        "terminal": "2"
      },
      "arrival": {
        "airport": "CDG",
        "time": "2024-02-16T08:45:00Z",
        "terminal": "2E"
      },
      "duration": "11h 15m",
      "price": {
        "amount": 899,
        "currency": "USD"
      },
      "travelClass": "ECONOMY",
      "stops": 0
    }
  ],
  "message": "Flights fetched successfully"
}
```

### Directions API

Get directions between two points.

```http
GET /api/directions?origin=Paris&destination=Lyon&mode=driving
```

**Query Parameters:**
- `origin` (required): Origin location
- `destination` (required): Destination location
- `mode` (optional): Travel mode (driving, walking, bicycling, transit)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "distance": "463 km",
      "duration": "4h 32m",
      "mode": "driving",
      "steps": [
        {
          "instruction": "Head north on Avenue des Champs-Élysées",
          "distance": "1.2 km",
          "duration": "3 min"
        }
      ],
      "overview_polyline": "encoded_polyline_string"
    }
  ],
  "message": "Directions fetched successfully"
}
```

### Weather API

Get weather information for a location.

```http
GET /api/weather?location=Paris&units=metric
```

**Query Parameters:**
- `location` (required): Location name or coordinates
- `units` (optional): Temperature units (metric, imperial)
- `days` (optional): Number of forecast days (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "location": "Paris, France",
    "current": {
      "temperature": 15,
      "condition": "Partly Cloudy",
      "humidity": 65,
      "wind": {
        "speed": 10,
        "direction": "NW"
      },
      "visibility": 10
    },
    "forecast": [
      {
        "date": "2024-01-16",
        "high": 18,
        "low": 12,
        "condition": "Sunny",
        "precipitation": 0
      }
    ]
  },
  "message": "Weather data fetched successfully"
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Types

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND_ERROR` - Resource not found
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `EXTERNAL_API_ERROR` - External service error
- `INTERNAL_ERROR` - Internal server error

## SDKs and Libraries

### JavaScript/TypeScript

```javascript
// Example usage with fetch
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_api_key'
  },
  body: JSON.stringify({
    title: 'My Travel Chat',
    context: {
      activeTools: ['search_travel_guides']
    }
  })
});

const data = await response.json();
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://your-domain.com/api/chat',
    headers=headers,
    json={
        'title': 'My Travel Chat',
        'context': {
            'activeTools': ['search_travel_guides']
        }
    }
)

data = response.json()
```

## Webhooks

### Chat Message Webhook

Receive notifications when new messages are added to chat sessions.

**Endpoint:** `POST /webhooks/chat-message`

**Payload:**
```json
{
  "event": "message.added",
  "data": {
    "sessionId": "chat_123",
    "messageId": "msg_456",
    "role": "user",
    "content": "Hello, AI!",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Itinerary Update Webhook

Receive notifications when itineraries are updated.

**Endpoint:** `POST /webhooks/itinerary-update`

**Payload:**
```json
{
  "event": "itinerary.updated",
  "data": {
    "itineraryId": "itinerary_789",
    "userId": "user_456",
    "changes": {
      "status": "confirmed",
      "budget": 2500
    },
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## Rate Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Chat API | 100 requests | 15 minutes |
| Itinerary API | 200 requests | 15 minutes |
| AI Search API | 50 requests | 15 minutes |
| External APIs | 1000 requests | 1 hour |

## Changelog

### Version 1.0.0
- Initial API release
- Chat and itinerary management
- AI-powered search and recommendations
- External API integrations
- Comprehensive error handling
- Rate limiting and security

## Support

For API support:
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review existing [Issues](https://github.com/your-username/Travel_Agent/issues)
- Contact support team

---

**API Version:** 1.0.0  
**Last Updated:** January 15, 2024