import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccueilComponent } from './accueil/accueil.component';
import { FooterComponent } from './footer/footer.component';
import { LearnComponent } from "./learn/learn.component";
import { OurtakeComponent } from "./ourtake/ourtake.component";
import { LatestComponent } from "./latest/latest.component";
import { OpportunitesComponent } from "./opportunites/opportunites.component";
import { LoginComponent } from './login/login.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AccueilComponent, 
    FooterComponent, 
    RouterOutlet, 
    LearnComponent, 
    OurtakeComponent, 
    LatestComponent, 
    OpportunitesComponent,
    LoginComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Peey Lebou';
}