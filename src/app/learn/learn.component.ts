// learn.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learn.component.html',
  styleUrl: './learn.component.css'
})
export class LearnComponent {
  headerText = {
    title: 'Nous sommes le leader mondial des services et investissements immobiliers commerciaux.',
    subtitle: 'Avec des services, des analyses et des données qui couvrent toutes les dimensions du secteur, nous créons des solutions pour des clients de toute taille, dans tous les secteurs et sur tous les territoires.'
  };

  sections = [
    {
      title: 'Notre Expertise',
      category: 'Études & Recherche',
      heading: 'Fournir des connaissances du marché ',
      description: 'Nos 500 chercheurs à travers le monde offrent des informations exploitables et une perspective multidimensionnelle inégalée dans le secteur immobilier.',
      link: 'Explorer nos Études & Recherche'
    },
    {
      title: 'Créer les solutions immobilières de demain',
      category: 'Services',
      services: [
        'Investir dans l\'immobilier',
        'Planifier, louer & occuper',
        'Concevoir & construire',
        'Gérer biens & portefeuilles',
      ],
      link: 'Explorer nos Services'
    }
  ];
}