import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LearnComponent } from '../learn/learn.component';
import { OurtakeComponent } from '../ourtake/ourtake.component';
import { LatestComponent } from '../latest/latest.component';
import { CommitmentComponent } from '../commitment/commitment.component';
import { OpportunitesComponent } from '../opportunites/opportunites.component';
import { FooterComponent } from "../footer/footer.component";
import { VideoComponent } from "../video/video.component";

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LearnComponent,
    OurtakeComponent,
    LatestComponent,
    CommitmentComponent,
    OpportunitesComponent,
    FooterComponent,
    VideoComponent
],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy {
  @ViewChild('mainHeader') mainHeader!: ElementRef;
  
  imagesPath: string[] = [
    'img/lebou.png',
    'img/evenement.png',
    'img/opportinute.png',
    'img/collaborer.png',
    'img/mobile.png'
  ];
  
  footerTexts: string[] = [
    'Découvrir notre assistant immobilier virtuel',
    'Consulter notre analyse du marché immobilier',
    'En savoir plus sur nos engagements écologiques',
    'Voir notre stratégie d\'investissement',
    'Explorez nos opportunités immobilières'
  ];
  
  texts: string[] = [
    'Présentation de la communauté Lébou',
    'Actualités et événements',
    'Opportunités',
    'Espace collaboratif et participatif',
    'Services numériques et accès mobile'
  ];
  
  // Menu state
  isMenuOpen = false;
  activeDropdown: string | null = null;
  isDropdownOpen = false;
  
  // Toggle mobile menu
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  // Dropdown management
  showDropdown(dropdownName: string) {
    this.activeDropdown = dropdownName;
    this.isDropdownOpen = true;
  }
  
  hideDropdown(dropdownName: string) {
    if (this.activeDropdown === dropdownName) {
      this.activeDropdown = null;
      this.isDropdownOpen = false;
    }
  }
  
  // Add click outside handler to close menu
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger-btn');
    
    if (this.isMenuOpen && menu && hamburger) {
      const clickedElement = event.target as HTMLElement;
      if (!menu.contains(clickedElement) && !hamburger.contains(clickedElement)) {
        this.isMenuOpen = false;
      }
    }
  }
  
  currentImageIndex: number = 0;
  private intervalId: any;
  
  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.startImageSlider();
    }
  }
  
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
  private startImageSlider() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.imagesPath.length;
    }, 3000);
  }
  
  setCurrentImage(index: number) {
    this.currentImageIndex = index;
  }
}