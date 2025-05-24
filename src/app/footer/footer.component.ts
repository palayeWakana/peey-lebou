// footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterLink {
  text: string;
  url: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  mainLinks: FooterLink[] = [
    { text: "À propos de notre agence", url: "#" },
    { text: "Carrières", url: "#" },
    { text: "Responsabilité d'entreprise", url: "#" },
    { text: "Relations investisseurs", url: "#" },
    { text: "Actualités immobilières", url: "#" },
  ];

  bottomLinks: FooterLink[] = [
    { text: "Nous contacter", url: "#" },
    { text: "Politique de confidentialité et cookies", url: "#" },
    { text: "Conditions d'utilisation", url: "#" },
    { text: "Notre réponse à Schrems II", url: "#" },
    { text: "Avis de confidentialité France", url: "#" },
    { text: "Mentions légales immobilières", url: "#" },
    { text: "Intranet", url: "#" },
    { text: "Paramètres des cookies", url: "#" }
  ];
}