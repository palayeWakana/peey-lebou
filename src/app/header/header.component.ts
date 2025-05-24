import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Tab {
  label: string;
   icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  tabs: Tab[] = [
    {
      label: 'Nos projets',
      icon: 'projets',
      route: '/projets',
      active: true
    },
    {
      label: 'Gestion des lots',
      icon: 'lots',
      route: '/lots',
      active: false
    },
    {
      label: 'Gestion des sous-traitants',
      icon: 'sous-traitants',
      route: '/sous-traitants',
      active: false
    },
    {
      label: 'Documents',
      icon: 'documents',
      route: '/documents',
      active: false
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}