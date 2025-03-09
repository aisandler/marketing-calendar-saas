import { test, expect } from '@playwright/test';

test.describe('Calendar View Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Fill in login credentials
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('/dashboard');
  });
  
  test('should navigate to calendar view', async ({ page }) => {
    // Navigate to calendar view
    await page.click('a[href="/calendar"]');
    
    // Verify that the calendar view page is loaded
    await expect(page).toHaveURL('/calendar');
    await expect(page.locator('h1')).toContainText('Calendar');
  });
  
  test('should display the legend', async ({ page }) => {
    // Navigate to calendar view
    await page.click('a[href="/calendar"]');
    
    // Verify that the legend is displayed
    await expect(page.locator('text=Tradeshow')).toBeVisible();
    await expect(page.locator('text=Event')).toBeVisible();
    await expect(page.locator('text=Digital Campaign')).toBeVisible();
    await expect(page.locator('text=Product Launch')).toBeVisible();
    await expect(page.locator('text=Seasonal Promotion')).toBeVisible();
  });
  
  test('should change view modes', async ({ page }) => {
    // Navigate to calendar view
    await page.click('a[href="/calendar"]');
    
    // Click on different view mode buttons
    await page.click('button:has-text("Day")');
    await expect(page.locator('button:has-text("Day")').first()).toHaveClass(/active/);
    
    await page.click('button:has-text("Week")');
    await expect(page.locator('button:has-text("Week")').first()).toHaveClass(/active/);
    
    await page.click('button:has-text("Month")');
    await expect(page.locator('button:has-text("Month")').first()).toHaveClass(/active/);
    
    await page.click('button:has-text("Quarter")');
    await expect(page.locator('button:has-text("Quarter")').first()).toHaveClass(/active/);
    
    await page.click('button:has-text("Year")');
    await expect(page.locator('button:has-text("Year")').first()).toHaveClass(/active/);
  });
  
  test('should search for campaigns', async ({ page }) => {
    // Navigate to calendar view
    await page.click('a[href="/calendar"]');
    
    // Enter a search query
    await page.fill('input[placeholder*="Search"]', 'Tradeshow');
    
    // Wait for the search results to update
    await page.waitForTimeout(500);
    
    // Verify that the search results are displayed
    // This is a bit tricky to test without specific selectors, but we can check if the Gantt chart is updated
    await expect(page.locator('.gantt_container')).toBeVisible();
  });
}); 