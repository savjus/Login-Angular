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

  errorMsg: string = '';

  constructor(private router: Router, private http: HttpClient) {}
  onSignup(){
    this.router.navigateByUrl('signup');
  }
  onLogin() {
    this.http.post<any>('http://localhost:5184/login', this.userObj)
      .pipe(
        catchError(err => {
          this.errorMsg = 'Login failed. Please try again.';
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.token) {
          localStorage.setItem('jwt',response.token);
          localStorage.setItem('username',this.userObj.username);
          this.router.navigateByUrl('dashboard');
        } 
      });
  }
}