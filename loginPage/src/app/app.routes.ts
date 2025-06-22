import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Signup } from './signup/signup';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: Signup},
  {path: 'dashboard', component: Dashboard,canActivate: [authGuard]},
  {path: '', redirectTo: '/login', pathMatch: 'full'},

];
