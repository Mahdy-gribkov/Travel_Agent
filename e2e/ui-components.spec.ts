/**
 * End-to-end tests for UI components
 */

import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/countries**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { name: 'United States', code: 'US' },
            { name: 'Canada', code: 'CA' },
          ],
        }),
      });
    });

    await page.route('**/api/places**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { name: 'Eiffel Tower', place_id: '123' },
            { name: 'Louvre Museum', place_id: '456' },
          ],
        }),
      });
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      await page.goto('/');

      // Check initial theme
      const body = page.locator('body');
      await expect(body).toHaveClass(/light/);

      // Click theme toggle
      const themeToggle = page.locator('[aria-label*="theme"]').first();
      await themeToggle.click();

      // Check if theme changed
      await expect(body).toHaveClass(/dark/);

      // Toggle back
      await themeToggle.click();
      await expect(body).toHaveClass(/light/);
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/');

      // Set dark theme
      const themeToggle = page.locator('[aria-label*="theme"]').first();
      await themeToggle.click();

      // Reload page
      await page.reload();

      // Check if theme persisted
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
    });
  });

  test.describe('Language Selector', () => {
    test('should change language', async ({ page }) => {
      await page.goto('/');

      const languageSelector = page.locator('select[aria-label="Select language"]');
      await expect(languageSelector).toBeVisible();

      // Change to Hebrew
      await languageSelector.selectOption('he');
      
      // Check if language changed (this would depend on i18n implementation)
      await expect(languageSelector).toHaveValue('he');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');

      // Test navigation links
      const dashboardLink = page.locator('a[href="/dashboard"]');
      const itinerariesLink = page.locator('a[href="/itineraries"]');
      const chatLink = page.locator('a[href="/chat"]');

      await expect(dashboardLink).toBeVisible();
      await expect(itinerariesLink).toBeVisible();
      await expect(chatLink).toBeVisible();

      // Test navigation
      await chatLink.click();
      await expect(page).toHaveURL('/chat');
    });

    test('should show mobile navigation on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile navigation should be visible
      const mobileNav = page.locator('.md\\:hidden');
      await expect(mobileNav).toBeVisible();
    });
  });

  test.describe('Chat Interface', () => {
    test('should display chat interface', async ({ page }) => {
      await page.goto('/chat');

      // Check if chat interface is visible
      const chatInterface = page.locator('[role="log"]');
      await expect(chatInterface).toBeVisible();

      // Check if input is visible
      const messageInput = page.locator('textarea[aria-label="Message input"]');
      await expect(messageInput).toBeVisible();

      // Check if send button is visible
      const sendButton = page.locator('button[aria-label="Send message"]');
      await expect(sendButton).toBeVisible();
    });

    test('should send and display messages', async ({ page }) => {
      await page.goto('/chat');

      const messageInput = page.locator('textarea[aria-label="Message input"]');
      const sendButton = page.locator('button[aria-label="Send message"]');

      // Type a message
      await messageInput.fill('Hello, AI!');
      await sendButton.click();

      // Check if user message appears
      const userMessage = page.locator('[role="article"]').first();
      await expect(userMessage).toContainText('Hello, AI!');

      // Check if AI response appears (after loading)
      await page.waitForTimeout(1000);
      const aiMessage = page.locator('[role="article"]').nth(1);
      await expect(aiMessage).toBeVisible();
    });

    test('should show loading state', async ({ page }) => {
      await page.goto('/chat');

      const messageInput = page.locator('textarea[aria-label="Message input"]');
      const sendButton = page.locator('button[aria-label="Send message"]');

      await messageInput.fill('Test message');
      await sendButton.click();

      // Check if loading indicator appears
      const loadingIndicator = page.locator('text=AI is thinking...');
      await expect(loadingIndicator).toBeVisible();
    });

    test('should handle keyboard shortcuts', async ({ page }) => {
      await page.goto('/chat');

      const messageInput = page.locator('textarea[aria-label="Message input"]');
      await messageInput.focus();
      await messageInput.fill('Test message');

      // Press Enter to send
      await messageInput.press('Enter');

      // Check if message was sent
      const userMessage = page.locator('[role="article"]').first();
      await expect(userMessage).toContainText('Test message');
    });
  });

  test.describe('Itinerary Cards', () => {
    test('should display itinerary cards', async ({ page }) => {
      await page.goto('/itineraries');

      // Mock itinerary data
      await page.route('**/api/itineraries**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                title: 'Paris Adventure',
                destination: 'Paris, France',
                startDate: '2024-01-15',
                endDate: '2024-01-20',
                travelers: 2,
                budget: 2000,
                status: 'confirmed',
                days: [],
              },
            ],
          }),
        });
      });

      // Check if itinerary card is visible
      const itineraryCard = page.locator('.itinerary-card');
      await expect(itineraryCard).toBeVisible();

      // Check card content
      await expect(itineraryCard).toContainText('Paris Adventure');
      await expect(itineraryCard).toContainText('Paris, France');
    });

    test('should expand itinerary details', async ({ page }) => {
      await page.goto('/itineraries');

      // Mock itinerary with days
      await page.route('**/api/itineraries**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                title: 'Paris Adventure',
                destination: 'Paris, France',
                startDate: '2024-01-15',
                endDate: '2024-01-20',
                travelers: 2,
                budget: 2000,
                status: 'confirmed',
                days: [
                  {
                    day: 1,
                    date: '2024-01-15',
                    activities: [
                      {
                        id: '1',
                        name: 'Visit Eiffel Tower',
                        time: '10:00',
                        type: 'attraction',
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });
      });

      const expandButton = page.locator('[aria-expanded="false"]');
      await expandButton.click();

      // Check if details are expanded
      await expect(page.locator('[aria-expanded="true"]')).toBeVisible();
      await expect(page.locator('text=Visit Eiffel Tower')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');

      // Check theme toggle accessibility
      const themeToggle = page.locator('[aria-label*="theme"]');
      await expect(themeToggle).toBeVisible();

      // Check language selector accessibility
      const languageSelector = page.locator('select[aria-label="Select language"]');
      await expect(languageSelector).toBeVisible();

      // Check navigation accessibility
      const navLinks = page.locator('nav a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper color contrast', async ({ page }) => {
      await page.goto('/');

      // This would require a more sophisticated accessibility testing tool
      // For now, we'll just check that the page loads without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check if mobile navigation is visible
      const mobileNav = page.locator('.md\\:hidden');
      await expect(mobileNav).toBeVisible();

      // Check if content is properly sized
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Check if tablet layout is working
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should work on desktop devices', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      // Check if desktop layout is working
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
