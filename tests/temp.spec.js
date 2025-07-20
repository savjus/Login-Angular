import { expect } from "playwright/test";
import { test } from "playwright/test";

test.describe("temp",() =>{

  // test.beforeEach(async ({page}) => {

  //   await page.goto('http://localhost:4200/login');

  // });

  test('should display login  correctly',async ({page}) => {
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button',{name: 'Login'})).toBeVisible();
    await expect(page.getByRole('button',{name: 'Sign up'})).toBeVisible();
  });
  test('Incorrect login',async ({page}) =>{
    await page.getByPlaceholder('Username').fill('wrong');
    await page.getByPlaceholder('Password').fill('wrong');
    
    await page.getByRole('button',{name:'Login'}).click();
  
    await expect(page).toHaveURL(/.*login/);  
  });
});