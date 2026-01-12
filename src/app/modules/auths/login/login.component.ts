import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: `./login.component.html`,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {

  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      credential: new FormControl("", [
        Validators.required,
        Validators.minLength(3),
      ]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
      ]),
      // rememberMe: new FormControl(false, []),
    });
  }

  login(): void {
    
  }

}
