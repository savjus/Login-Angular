import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {

  userObj: any = {
    "username": '',
    "password": '',
  };

  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
    this.http.post<any>('http://localhost:5184/login', this.userObj)
      .pipe(
        catchError(err => {
          alert('Login failed. Please try again.');
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.token) {
          alert('Login successful!');
          this.router.navigateByUrl('dashboard');
        } 
      });
  }
}