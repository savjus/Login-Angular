import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear all storage and state
    await page.context().clearCookies();
    
    // Setup: Mock login and navigate to dashboard
    await page.goto('http://localhost:4200/login');
    
    // Clear localStorage after page loads
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Mock successful login
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

    // Mock notes API endpoints - GET (empty notes initially)
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Login to access dashboard
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard elements correctly', async ({ page }) => {
    // Check user greeting
    await expect(page.locator('div').filter({ hasText: /^Hello testuser!$/ })).toBeVisible();
    
    // Check search algorithms button
    await expect(page.getByRole('button', { name: 'search algorithms' })).toBeVisible();
    
    // Check notes section
    await expect(page.locator('div').filter({ hasText: /^Notes:$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).toBeVisible();
    
    // Check add note input and button
    await expect(page.getByPlaceholder('Add a note...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  test('should handle search algorithms button click', async ({ page }) => {
    // Click search algorithms button - this should navigate to search-algorithms route
    await page.getByRole('button', { name: 'search algorithms' }).click();
    
    // Check if it navigates to search algorithms page
    await expect(page).toHaveURL(/.*search-algorithms/);
  });

  test('should add a new note successfully', async ({ page }) => {
    const noteContent = 'My first test note';
    
    // Mock API response for adding note
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            content: noteContent,
            editing: false
          })
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Add a note
    await page.getByPlaceholder('Add a note...').fill(noteContent);
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Check that note appears in the list - be more specific
    await expect(page.locator('ul li').first()).toContainText(noteContent);
    await expect(page.locator('ul li').first().getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.locator('ul li').first().getByRole('button', { name: 'Delete' })).toBeVisible();
    
    // Check that input is cleared
    await expect(page.getByPlaceholder('Add a note...')).toHaveValue('');
    
    // Check that "No notes yet" message is hidden
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).not.toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    const originalContent = 'Original note content';
    const editedContent = 'Edited note content';
    
    // Setup: Mock GET request to return existing note
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 1,
            content: originalContent,
            editing: false
          }])
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            content: editedContent,
            editing: false
          })
        });
      }
    });

    // Reload to get the note
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click edit button - be specific about which one
    await page.locator('ul li').first().getByRole('button', { name: 'Edit' }).click();
    
    // Check that input field appears
    await expect(page.locator('ul li').first().locator('input')).toBeVisible();
    await expect(page.locator('ul li').first().getByRole('button', { name: 'Save' })).toBeVisible();
    
    // Edit the note content
    await page.locator('ul li').first().locator('input').clear();
    await page.locator('ul li').first().locator('input').fill(editedContent);
    
    // Save the changes
    await page.locator('ul li').first().getByRole('button', { name: 'Save' }).click();
    
    // Check that note is updated
    await expect(page.locator('ul li').first().locator('span')).toContainText(editedContent);
    await expect(page.locator('ul li').first().getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    const noteContent = 'Note to be deleted';
    
    // Setup: Mock GET request to return existing note
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 1,
            content: noteContent,
            editing: false
          }])
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Note deleted' })
        });
      }
    });

    // Reload to get the note
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Confirm note exists
    await expect(page.locator('ul li').first()).toContainText(noteContent);
    
    // Delete the note
    await page.locator('ul li').first().getByRole('button', { name: 'Delete' }).click();
    
    // Check that note is removed
    await expect(page.locator('ul li')).not.toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).toBeVisible();
  });

  test('should handle multiple notes correctly', async ({ page }) => {
    const notes = [
      { id: 1, content: 'First note', editing: false },
      { id: 2, content: 'Second note', editing: false },
      { id: 3, content: 'Third note', editing: false }
    ];
    
    // Mock API with multiple notes
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes)
        });
      }
    });

    // Reload to get the notes
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that all notes are displayed
    for (let i = 0; i < notes.length; i++) {
      await expect(page.locator('ul li').nth(i)).toContainText(notes[i].content);
    }
    
    // Check that each note has edit and delete buttons
    await expect(page.locator('ul li')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(3);
    
    // Check that "No notes yet" message is hidden
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).not.toBeVisible();
  });

  test('should handle empty note submission', async ({ page }) => {
    // Try to add empty note
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Should not make API call or add empty note
    // Note list should remain empty
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).toBeVisible();
    await expect(page.locator('ul li')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error for adding note
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Try to add a note
    await page.getByPlaceholder('Add a note...').fill('Test note');
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Check that error is handled gracefully
    // Note should not be added and UI should remain stable
    await expect(page.locator('div').filter({ hasText: /^No notes yet\.$/ })).toBeVisible();
  });

  test('should maintain user session and display correct username', async ({ page }) => {
    // Check that username from login is displayed correctly
    await expect(page.locator('div').filter({ hasText: /^Hello testuser!$/ })).toBeVisible();
    
    // Check that it's positioned correctly (text-align: right)
    const userGreeting = page.locator('div[style*="text-align: right"]');
    await expect(userGreeting).toContainText('Hello testuser!');
  });

  test('should cancel note editing by refreshing', async ({ page }) => {
    const originalContent = 'Original content';
    
    // Setup: Add a note first
    await page.route('http://localhost:5184/api/notes', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 1,
            content: originalContent,
            editing: false
          }])
        });
      }
    });

    // Reload to get the note
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Start editing
    await page.locator('ul li').first().getByRole('button', { name: 'Edit' }).click();
    
    // Change content but don't save
    await page.locator('ul li').first().locator('input').clear();
    await page.locator('ul li').first().locator('input').fill('Changed but not saved');
    
    // Navigate away or refresh (simulating cancel)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that original content is preserved
    await expect(page.locator('ul li').first().locator('span')).toContainText(originalContent);
  });

});
