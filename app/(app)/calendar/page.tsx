'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock calendar data
const mockEvents = [
  {
    id: '1',
    title: 'Paris Trip',
    date: '2024-02-15',
    time: '09:00',
    type: 'trip',
    status: 'confirmed'
  },
  {
    id: '2',
    title: 'Flight to Tokyo',
    date: '2024-03-10',
    time: '14:30',
    type: 'flight',
    status: 'booked'
  },
  {
    id: '3',
    title: 'Hotel Check-in',
    date: '2024-03-11',
    time: '15:00',
    type: 'accommodation',
    status: 'confirmed'
  },
  {
    id: '4',
    title: 'Barcelona Adventure',
    date: '2024-04-05',
    time: '10:00',
    type: 'trip',
    status: 'planning'
  }
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'trip': return 'bg-blue-100 text-blue-800';
      case 'flight': return 'bg-green-100 text-green-800';
      case 'accommodation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Calendar</h1>
        <p className="text-gray-600">Manage your travel schedule and upcoming trips</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Your travel schedule at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Calendar Integration</h3>
                <p className="mt-1 text-sm text-gray-500">Calendar view will be available soon.</p>
                <Button className="mt-4" variant="outline">
                  Connect Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next travel activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                View All Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
