import { test, expect } from '@playwright/test';

test.describe('End-to-End Tests', () => {
  
  test('complete user journey: signup -> login -> dashboard -> notes', async ({ page }) => {
    // Clear all storage and state
    await page.context().clearCookies();
    
    // Step 1: Navigate to home (should redirect to login)
    await page.goto('http://localhost:4200/');
    
    // Clear localStorage after page loads
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await expect(page).toHaveURL(/.*login/);
    
    // Step 2: Go to signup page
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*signup/);
    
    // Step 3: Mock successful signup
    await page.route('http://localhost:5184/login/signup', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          message: 'User created successfully',
          username: 'e2e_testuser'
        })
      });
    });
    
    // Mock alert for signup success
    page.on('dialog', async dialog => {
      if (dialog.message() === 'Signup succesful! please log in.') {
        await dialog.accept();
      }
    });
    
    // Step 4: Sign up with new user
    await page.getByPlaceholder('Username').fill('e2e_testuser');
    await page.getByPlaceholder('Password').fill('e2e_password123');
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Step 5: Should redirect to login page
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
    
    // Step 6: Mock successful login
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'e2e-jwt-token-12345',
          username: 'e2e_testuser'
        })
      });
    });
    
    // Step 7: Mock notes API for dashboard
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            content: requestBody.content,
            editing: false
          })
        });
      }
    });
    
    // Step 8: Login with the same credentials
    await page.getByPlaceholder('Username').fill('e2e_testuser');
    await page.getByPlaceholder('Password').fill('e2e_password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Step 9: Should be on dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Step 10: Verify dashboard elements
    await expect(page.locator('div:has-text("Hello e2e_testuser!")')).toBeVisible();
    await expect(page.locator('div:has-text("No notes yet.")')).toBeVisible();
    
    // Step 11: Add a note
    await page.getByPlaceholder('Add a note...').fill('My first e2e note');
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Step 12: Verify note was added
    await expect(page.locator('ul li')).toContainText('My first e2e note');
    await expect(page.locator('div:has-text("No notes yet.")')).not.toBeVisible();
    
    // Step 13: Verify localStorage contains auth data
    const token = await page.evaluate(() => localStorage.getItem('jwt'));
    const username = await page.evaluate(() => localStorage.getItem('username'));
    
    expect(token).toBe('e2e-jwt-token-12345');
    expect(username).toBe('e2e_testuser');
  });

  test('authentication guard: unauthenticated user cannot access dashboard', async ({ page }) => {
    // Try to access dashboard directly without login
    await page.goto('http://localhost:4200/dashboard');
    
    // Should be redirected to login page due to auth guard
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('logout functionality (if implemented)', async ({ page }) => {
    // Setup: Login first
    await page.goto('http://localhost:4200/login');
    
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'logout-test-token',
          username: 'logout_testuser'
        })
      });
    });
    
    await page.route('http://localhost:5184/api/notes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Login
    await page.getByPlaceholder('Username').fill('logout_testuser');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('**/dashboard');
    
    // Verify login success
    const tokenBefore = await page.evaluate(() => localStorage.getItem('jwt'));
    expect(tokenBefore).toBe('logout-test-token');
    
    // If logout button exists, click it
    const logoutButton = page.getByRole('button', { name: /logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login and clear localStorage
      await page.waitForURL('**/login');
      const tokenAfter = await page.evaluate(() => localStorage.getItem('jwt'));
      expect(tokenAfter).toBeNull();
    }
  });

  test('persistent login: refresh should maintain authentication', async ({ page }) => {
    // Setup login
    await page.goto('http://localhost:4200/login');
    
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'persistent-test-token',
          username: 'persistent_user'
        })
      });
    });
    
    await page.route('http://localhost:5184/api/notes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Login
    await page.getByPlaceholder('Username').fill('persistent_user');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('**/dashboard');
    
    // Refresh the page
    await page.reload();
    
    // Should still be on dashboard (if auth persistence is implemented)
    // Note: This depends on how your auth guard handles localStorage tokens
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('div:has-text("Hello persistent_user!")')).toBeVisible();
  });

  test('navigation between different routes', async ({ page }) => {
    // Setup: Login to access protected routes
    await page.goto('http://localhost:4200/login');
    
    await page.route('http://localhost:5184/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          token: 'nav-test-token',
          username: 'nav_testuser'
        })
      });
    });
    
    await page.route('http://localhost:5184/api/notes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Login
    await page.getByPlaceholder('Username').fill('nav_testuser');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('**/dashboard');
    
    // Test navigation to search algorithms
    await page.getByRole('button', { name: 'search algorithms' }).click();
    await expect(page).toHaveURL(/.*search-algorithms/);
    
    // Navigate back to dashboard (if there's a way to do so)
    await page.goBack();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('form validation across all pages', async ({ page }) => {
    // Test login page validation
    await page.goto('http://localhost:4200/login');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*login/); // Should stay on login due to validation
    
    // Test signup page validation
    await page.goto('http://localhost:4200/signup');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*signup/); // Should stay on signup due to validation
    
    // Test partial form submission
    await page.getByPlaceholder('Username').fill('partial_user');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*signup/); // Should stay due to missing password
  });

});
