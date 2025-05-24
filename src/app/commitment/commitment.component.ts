// commitment.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CommitmentCard {
  title: string;
  content: string;
}

@Component({
  selector: 'app-commitment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commitment.component.html',
  styleUrl: './commitment.component.css'
})
export class CommitmentComponent {
  commitments: CommitmentCard[] = [
    {
      title: "Notre Histoire",
      content: "Nous mettons à profit les connaissances diversifiées de nos collaborateurs, clients et partenaires pour réaliser le potentiel de chaque entreprise et de chaque personne dans le secteur immobilier."
    },
    {
      title: "Responsabilité d'Entreprise",
      content: "Nous sommes fiers de notre réputation pour le maintien des normes les plus élevées dans notre façon de faire des affaires immobilières."
    },
    {
      title: "Développement Durable",
      content: "Accélération du développement durable par la décarbonisation de nos propres opérations et l'influence sur la façon dont les bâtiments sont construits, approvisionnés, gérés, occupés et vendus."
    },
    {
      title: "Diversité, Équité et Inclusion",
      content: "Chez notre agence immobilière, nous prenons à cœur notre rôle de leader dans l'industrie immobilière. C'est pourquoi nous avons fait des pratiques responsables le fondement de nos opérations immobilières mondiales."
    }
  ];
}