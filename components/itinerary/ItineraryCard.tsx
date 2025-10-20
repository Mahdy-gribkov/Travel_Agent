'use client';

import React, { useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { designTokens } from '@/lib/design-tokens';

interface ItineraryDay {
  day: number;
  date: string;
  activities: Array<{
    id: string;
    name: string;
    description?: string;
    time: string;
    location?: string;
    duration?: string;
    cost?: number;
    type: 'attraction' | 'restaurant' | 'transport' | 'accommodation' | 'activity';
  }>;
}

interface Itinerary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  days: ItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

interface ItineraryCardProps {
  itinerary: Itinerary;
  onEdit?: (itinerary: Itinerary) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

export function ItineraryCard({
  itinerary,
  onEdit,
  onDelete,
  onView,
  className = '',
  compact = false,
}: ItineraryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'draft':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'completed':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'cancelled':
        return 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
    }
  };

  const getActivityIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case 'attraction':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'restaurant':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
        );
      case 'transport':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'accommodation':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
    }
  };

  const totalDays = itinerary.days.length;
  const totalActivities = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);

  if (compact) {
    return (
      <div
        className={`
          itinerary-card p-4 cursor-pointer transition-all duration-200
          hover:shadow-lg hover:scale-[1.02]
          ${className}
        `}
        onClick={() => onView?.(itinerary.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView?.(itinerary.id);
          }
        }}
        aria-label={`View itinerary: ${itinerary.title}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-text-primary mb-1">
              {itinerary.title}
            </h3>
            <p className="text-text-secondary text-sm">
              {itinerary.destination} • {totalDays} days • {totalActivities} activities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(itinerary.status)}`}>
              {itinerary.status}
            </span>
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`itinerary-card ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-text-primary">
                {itinerary.title}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(itinerary.status)}`}>
                {itinerary.status}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{itinerary.destination}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>{itinerary.travelers} traveler{itinerary.travelers !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="text-text-tertiary">Budget:</span>
                <span className="ml-1 font-medium text-text-primary">
                  {formatCurrency(itinerary.budget)}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Duration:</span>
                <span className="ml-1 font-medium text-text-primary">
                  {totalDays} days
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Activities:</span>
                <span className="ml-1 font-medium text-text-primary">
                  {totalActivities}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView?.(itinerary.id)}
              className="btn btn-primary px-3 py-2 text-sm"
              aria-label="View itinerary details"
            >
              View
            </button>
            <button
              onClick={() => onEdit?.(itinerary)}
              className="btn btn-secondary px-3 py-2 text-sm"
              aria-label="Edit itinerary"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(itinerary.id)}
              className="btn btn-secondary px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900"
              aria-label="Delete itinerary"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Days preview */}
      {itinerary.days.length > 0 && (
        <div className="p-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={isExpanded}
            aria-controls={`itinerary-days-${itinerary.id}`}
          >
            <h4 className="font-semibold text-text-primary">
              Itinerary Details ({totalDays} days)
            </h4>
            <svg
              className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div
              id={`itinerary-days-${itinerary.id}`}
              className="mt-4 space-y-4"
            >
              {itinerary.days.map((day) => (
                <div
                  key={day.day}
                  className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-sm">
                      {day.day}
                    </div>
                    <div>
                      <h5 className="font-medium text-text-primary">Day {day.day}</h5>
                      <p className="text-sm text-text-secondary">{formatDate(day.date)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {day.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h6 className="font-medium text-text-primary truncate">
                              {activity.name}
                            </h6>
                            <span className="text-xs text-text-tertiary bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded">
                              {activity.time}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-text-secondary mb-1">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                            {activity.location && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{activity.location}</span>
                              </span>
                            )}
                            {activity.duration && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{activity.duration}</span>
                              </span>
                            )}
                            {activity.cost && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span>{formatCurrency(activity.cost)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ItineraryCard;
