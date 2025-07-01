import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Signup } from './signup/signup';
import { authGuard } from './auth-guard';
import { SearchAlgorithms } from './dashboard/search-algorithms/search-algorithms';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: Signup},
  {path: 'dashboard', component: Dashboard,canActivate: [authGuard]},
  {path: 'search-algorithms', component: SearchAlgorithms,canActivate: [authGuard]},
  {path: '', redirectTo: '/login', pathMatch: 'full'},

];
