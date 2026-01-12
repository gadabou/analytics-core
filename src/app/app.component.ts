import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  constructor(private router: Router) {
    this.initializeComponent();
  }
  ngOnInit(): void {

  }

  private async initializeComponent(){

    if (![4200, '4200'].includes(location.port)) {
      
    }

  }

}

