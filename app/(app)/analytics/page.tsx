'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock analytics data
const mockStats = [
  { label: 'Total Trips', value: '12', change: '+2 this month', color: 'text-blue-600' },
  { label: 'Countries Visited', value: '8', change: '+1 this month', color: 'text-green-600' },
  { label: 'Days Traveled', value: '47', change: '+5 this month', color: 'text-purple-600' },
  { label: 'Total Spent', value: '$3,240', change: '+$400 this month', color: 'text-orange-600' },
];

const mockDestinations = [
  { name: 'Paris, France', visits: 3, lastVisit: 'Feb 2024' },
  { name: 'Tokyo, Japan', visits: 2, lastVisit: 'Mar 2024' },
  { name: 'New York, USA', visits: 2, lastVisit: 'Jan 2024' },
  { name: 'Barcelona, Spain', visits: 1, lastVisit: 'Dec 2023' },
  { name: 'London, UK', visits: 1, lastVisit: 'Nov 2023' },
];

const mockMonthlyData = [
  { month: 'Jan', trips: 1, spending: 800 },
  { month: 'Feb', trips: 2, spending: 1200 },
  { month: 'Mar', trips: 1, spending: 600 },
  { month: 'Apr', trips: 0, spending: 0 },
  { month: 'May', trips: 1, spending: 400 },
  { month: 'Jun', trips: 2, spending: 1000 },
];

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Analytics</h1>
        <p className="text-gray-600">Insights into your travel patterns and spending</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mockStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
            <CardDescription>Your most visited places</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDestinations.map((destination, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{destination.name}</p>
                      <p className="text-sm text-gray-500">Last visit: {destination.lastVisit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{destination.visits} visits</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Trips and spending by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMonthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(month.trips / 2) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{month.trips} trips</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${month.spending}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Travel Trends</CardTitle>
            <CardDescription>Visual insights into your travel patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Interactive Charts</h3>
              <p className="mt-1 text-sm text-gray-500">Detailed charts and graphs will be available soon.</p>
              <Button className="mt-4" variant="outline">
                Enable Advanced Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
