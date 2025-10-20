'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock data for destinations
const mockDestinations = [
  {
    id: '1',
    name: 'Paris, France',
    image: '/api/placeholder/400/300',
    description: 'The City of Light, known for its art, fashion, and cuisine.',
    rating: 4.8,
    price: '$$$',
    tags: ['Culture', 'Food', 'Art'],
    duration: '3-5 days'
  },
  {
    id: '2',
    name: 'Tokyo, Japan',
    image: '/api/placeholder/400/300',
    description: 'A vibrant metropolis blending tradition and modernity.',
    rating: 4.9,
    price: '$$$$',
    tags: ['Culture', 'Technology', 'Food'],
    duration: '5-7 days'
  },
  {
    id: '3',
    name: 'New York, USA',
    image: '/api/placeholder/400/300',
    description: 'The city that never sleeps, full of iconic landmarks.',
    rating: 4.7,
    price: '$$$$',
    tags: ['Culture', 'Entertainment', 'Shopping'],
    duration: '4-6 days'
  },
  {
    id: '4',
    name: 'Barcelona, Spain',
    image: '/api/placeholder/400/300',
    description: 'Architecture, beaches, and vibrant street life.',
    rating: 4.6,
    price: '$$',
    tags: ['Architecture', 'Beach', 'Food'],
    duration: '3-4 days'
  },
  {
    id: '5',
    name: 'Bali, Indonesia',
    image: '/api/placeholder/400/300',
    description: 'Tropical paradise with rich culture and stunning landscapes.',
    rating: 4.8,
    price: '$',
    tags: ['Beach', 'Nature', 'Culture'],
    duration: '7-10 days'
  },
  {
    id: '6',
    name: 'London, UK',
    image: '/api/placeholder/400/300',
    description: 'Historic capital with world-class museums and culture.',
    rating: 4.5,
    price: '$$$',
    tags: ['History', 'Culture', 'Museums'],
    duration: '4-5 days'
  }
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = ['Culture', 'Food', 'Art', 'Technology', 'Entertainment', 'Shopping', 'Architecture', 'Beach', 'Nature', 'History', 'Museums'];

  const filteredDestinations = mockDestinations.filter(destination => {
    const matchesSearch = destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         destination.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => destination.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Destinations</h1>
        <p className="text-gray-600">Discover amazing places around the world</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.map(destination => (
          <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{destination.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">{destination.rating}</span>
                </div>
              </div>
              <CardDescription>{destination.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Duration: {destination.duration}</span>
                  <span className="font-medium">{destination.price}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {destination.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Button className="w-full" variant="outline">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDestinations.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No destinations found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
