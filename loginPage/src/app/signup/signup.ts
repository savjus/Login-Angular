import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { response} from 'express';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';


@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  signupObj: any = {
    username: '',
    password: '',
  };
  constructor(private router:Router, private http:HttpClient) {}

  onSignup(){
    this.http.post<any>('http://localhost:5184/login/signup',this.signupObj)
    .pipe(
      catchError(err => {
        alert('Signup failed. Username may already exist');
        return of(null);
      })
    )
    .subscribe(response => {
      if(response && response.success){
        alert('Signup succesful! please log in.');
        this.router.navigateByUrl('login');
      }
    });
  }
}
