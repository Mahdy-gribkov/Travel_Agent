/**
 * Tests for dashboard routing after auth removal
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the DashboardPage component
jest.mock('@/components/pages/DashboardPage', () => {
  return function MockDashboardPage() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  };
});

describe('Dashboard Routing Tests', () => {
  it('should render DashboardPage component on root route', () => {
    // Test that the root page renders the DashboardPage component
    render(<HomePage />);
    
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('should not render LandingPage component', () => {
    // Test that the LandingPage component is not rendered
    render(<HomePage />);
    
    expect(screen.queryByText('Your Intelligent Travel Companion')).not.toBeInTheDocument();
    expect(screen.queryByText('Start Planning')).not.toBeInTheDocument();
  });

  it('should not have authentication redirects', () => {
    // Test that there are no authentication-related redirects
    render(<HomePage />);
    
    // The component should render directly without any auth checks
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});
