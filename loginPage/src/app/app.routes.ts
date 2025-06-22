import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Signup } from './signup/signup';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: Signup},
  {path: 'dashboard', component: Dashboard},
  {path: '', redirectTo: '/login', pathMatch: 'full'},

];
