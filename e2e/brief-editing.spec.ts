import { test, expect } from '@playwright/test';

test.describe('Brief Editing Functionality', () => {
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
  
  test('should navigate to briefs list', async ({ page }) => {
    // Navigate to briefs list
    await page.click('a[href="/briefs"]');
    
    // Verify that the briefs list page is loaded
    await expect(page).toHaveURL('/briefs');
    await expect(page.locator('h1')).toContainText('Briefs');
  });
  
  test('should view brief details', async ({ page }) => {
    // Navigate to briefs list
    await page.click('a[href="/briefs"]');
    
    // Click on the first brief in the list
    await page.click('.brief-item:first-child a');
    
    // Verify that the brief details page is loaded
    await expect(page.locator('h1')).toContainText('Brief Details');
  });
  
  test('should edit a brief successfully', async ({ page }) => {
    // Navigate to briefs list
    await page.click('a[href="/briefs"]');
    
    // Click on the first brief in the list
    await page.click('.brief-item:first-child a');
    
    // Click the edit button
    await page.click('a:has-text("Edit")');
    
    // Verify that the edit form is loaded
    await expect(page.locator('h1')).toContainText('Edit Brief');
    
    // Update the brief title
    const newTitle = `Updated Brief Title ${Date.now()}`;
    await page.fill('input[name="title"]', newTitle);
    
    // Submit the form
    await page.click('button:has-text("Update Brief")');
    
    // Verify that we're redirected to the brief details page
    await expect(page).toHaveURL(/\/briefs\/[a-zA-Z0-9-]+$/);
    
    // Verify that the brief title has been updated
    await expect(page.locator('h1')).toContainText(newTitle);
  });
  
  test('should handle non-existent brief gracefully', async ({ page }) => {
    // Navigate directly to a non-existent brief edit page
    await page.goto('/briefs/non-existent-id/edit');
    
    // Verify that an error message is displayed
    await expect(page.locator('text=Brief not found')).toBeVisible();
    
    // Verify that we're redirected to the briefs list after a delay
    await page.waitForURL('/briefs', { timeout: 5000 });
  });
}); 