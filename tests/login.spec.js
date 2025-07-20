import { test, expect } from '@playwright/test';

test.describe('Login Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear all storage and state
    await page.context().clearCookies();
    
    // Navigate to the login page
    await page.goto('http://localhost:4200/');
    
    // Clear localStorage after page loads
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display login form elements', async ({ page }) => {
    // Check that all form elements are present
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('should navigate to signup page when signup button is clicked', async ({ page }) => {
    // Click the signup button
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Wait for navigation and check URL
    await page.waitForURL('**/signup');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should show validation for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check that form validation prevents submission
    // Angular form validation should prevent submission
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Mock the API response for invalid credentials
          await page.route('http://localhost:5184/login', async route => {
            await route.fulfill({
              status: 401,
              contentType: 'application/json',
              body: JSON.stringify({ message: 'Invalid credentials' })
            });
          });

    // Fill in invalid credentials
    await page.getByPlaceholder('Username').fill('invalid_user');
    await page.getByPlaceholder('Password').fill('wrong_password');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check that error message is displayed
    await expect(page.locator('p[style*="color: red"]')).toBeVisible();
    await expect(page.locator('p[style*="color: red"]')).toHaveText('Login failed. Please try again.');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Mock successful API response
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-jwt-token-12345',
          username: 'testuser'
        })
      });
    });

    // Fill in valid credentials
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('validpassword');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check that JWT token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('jwt'));
    const username = await page.evaluate(() => localStorage.getItem('username'));
    
    expect(token).toBe('mock-jwt-token-12345');
    expect(username).toBe('testuser');
  });

  test('should clear form fields after successful login', async ({ page }) => {
    // Mock successful API response
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-jwt-token-12345',
          username: 'testuser'
        })
      });
    });

    // Fill in credentials
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('validpassword');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
    
    // Navigate back to login (simulate logout or direct navigation)
    await page.goto('http://localhost:4200/login');
    
    // Check that form fields are empty
    await expect(page.getByPlaceholder('Username')).toHaveValue('');
    await expect(page.getByPlaceholder('Password')).toHaveValue('');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('http://localhost:5184/login', async route => {
      await route.abort('failed');
    });

    // Fill in credentials
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('password123');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check that error message is displayed
    await expect(page.locator('p[style*="color: red"]')).toBeVisible();
    await expect(page.locator('p[style*="color: red"]')).toHaveText('Login failed. Please try again.');
  });

  test('should validate form fields are required', async ({ page }) => {
    // Try to submit with only username
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Form should not submit due to required validation
    await expect(page).toHaveURL(/.*login/);
    
    // Clear username and try with only password
    await page.getByPlaceholder('Username').clear();
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Form should not submit due to required validation
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle special characters in credentials', async ({ page }) => {
    // Mock successful API response
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'mock-jwt-token-special',
          username: 'user@test.com'
        })
      });
    });

    // Test with email as username and special characters in password
    await page.getByPlaceholder('Username').fill('user@test.com');
    await page.getByPlaceholder('Password').fill('P@ssw0rd!123');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

});