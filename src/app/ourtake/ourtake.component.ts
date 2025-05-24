// ourtake.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ourtake',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ourtake.component.html',
  styleUrl: './ourtake.component.css'
})
export class OurtakeComponent {
  ourTakeContent = {
    title: 'Téléchargez Peey Connect',
    subtitle: 'Disponible dès maintenant sur le Play Store et l’Apple Store pour rester connecté partout',    
    image: {
      src: 'img/iphone.png',
      alt: 'Newsletter sur téléphone'
    }
  };
}