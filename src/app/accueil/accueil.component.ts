import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { FooterComponent } from "../footer/footer.component";
import { LearnComponent } from "../learn/learn.component";
import { OurtakeComponent } from "../ourtake/ourtake.component";
import { LatestComponent } from "../latest/latest.component";
import { OpportunitesComponent } from "../opportunites/opportunites.component";
import { VideoComponent } from "../video/video.component";

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, LearnComponent, OurtakeComponent, LatestComponent, OpportunitesComponent, VideoComponent ],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscriptions: Subscription = new Subscription();
  private isBrowser: boolean = false;
  private L: any; // Déclaration dynamique de Leaflet
  private mapInitialized: boolean = false;

  // Variables existantes pour le slider
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

  currentImageIndex = 0;
  isDropdownOpen = false;
  isMenuOpen = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Démarrer le slider d'images
    this.startImageSlider();
  }

  ngAfterViewInit(): void {
    // Charger la carte uniquement côté client et après l'initialisation de la vue
    if (this.isBrowser && !this.mapInitialized) {
      // Utiliser setTimeout pour s'assurer que le DOM est complètement rendu
      setTimeout(() => {
        this.loadLeafletAndInitMap();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Méthodes existantes pour le slider
  startImageSlider(): void {
    if (this.isBrowser) {
      const slider = interval(5000);
      this.subscriptions.add(
        slider.subscribe(() => {
          this.currentImageIndex = (this.currentImageIndex + 1) % this.imagesPath.length;
        })
      );
    }
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  // Méthodes pour le menu
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDropdown(menu: string): void {
    if (this.isBrowser) {
      this.isDropdownOpen = true;
    }
  }

  hideDropdown(menu: string): void {
    if (this.isBrowser) {
      this.isDropdownOpen = false;
    }
  }

  scrollToSection(sectionId: string): void {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // Fermer le menu mobile après la navigation
    this.isMenuOpen = false;
  }

  /**
   * Charge Leaflet dynamiquement et initialise la carte
   */
  private async loadLeafletAndInitMap(): Promise<void> {
  if (!this.isBrowser || this.mapInitialized) {
    return;
  }

  try {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      setTimeout(() => this.loadLeafletAndInitMap(), 1000);
      return;
    }

    const leafletModule = await import('leaflet');
    this.L = leafletModule.default || leafletModule;

    // Fix pour les icônes
    const iconRetinaUrl = '/leaflet/images/marker-icon-2x.png';
    const iconUrl = '/leaflet/images/marker-icon.png';
    const shadowUrl = '/leaflet/images/marker-shadow.png';

    const iconDefault = this.L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    this.L.Marker.prototype.options.icon = iconDefault;

    this.initMap();
    this.mapInitialized = true;

  } catch (error) {
    console.error('Erreur lors du chargement de Leaflet:', error);
    if (!this.mapInitialized) {
      setTimeout(() => this.loadLeafletAndInitMap(), 2000);
    }
  }
}

  /**
   * Initialise la carte Leaflet
   */
  private initMap(): void {
    if (!this.L || !this.isBrowser) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Élément carte non trouvé');
      return;
    }

    try {
      // Vérifier si la carte n'est pas déjà initialisée
      if (mapElement.hasChildNodes() && mapElement.children.length > 0) {
        console.log('Carte déjà initialisée');
        return;
      }

      const map = this.L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      }).setView([14.6928, -17.4467], 12); // Dakar

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 8
      }).addTo(map);

      // Données de localités au Sénégal
      const localities = [
        { name: 'Dakar Centre', lat: 14.6928, lng: -17.4467, members: 450 },
        { name: 'Plateau', lat: 14.6937, lng: -17.4441, members: 320 },
        { name: 'Medina', lat: 14.6889, lng: -17.4467, members: 280 },
        { name: 'Grand Yoff', lat: 14.7167, lng: -17.4667, members: 190 },
        { name: 'Parcelles Assainies', lat: 14.7333, lng: -17.4167, members: 650 },
        { name: 'Pikine', lat: 14.7500, lng: -17.4000, members: 380 },
        { name: 'Guédiawaye', lat: 14.7667, lng: -17.4167, members: 420 },
        { name: 'Rufisque', lat: 14.7167, lng: -17.2667, members: 290 }
      ];

      // Ajouter les marqueurs avec des icônes personnalisées
      const markers: any[] = [];
      localities.forEach(locality => {
        const customIcon = this.createCustomIcon(locality.members);
        
        const marker = this.L.marker([locality.lat, locality.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center; padding: 10px;">
              <h3 style="margin: 0 0 10px 0; color: #20a439;">${locality.name}</h3>
              <p style="margin: 0; font-weight: bold;">Membres actifs: ${locality.members}</p>
            </div>
          `);
        
        markers.push(marker);
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (markers.length > 0) {
        const group = new this.L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  /**
   * Crée une icône personnalisée basée sur le nombre de membres
   */
  private createCustomIcon(memberCount: number): any {
    if (!this.L) return null;

    // Déterminer la couleur et la taille basées sur le nombre de membres
    let color = '#20a439';
    let size = 30;

    if (memberCount > 600) {
      color = '#065413'; // Vert foncé pour les zones très actives
      size = 35;
    } else if (memberCount > 400) {
      color = '#20a439'; // Vert principal pour les zones moyennement actives
      size = 32;
    } else if (memberCount > 200) {
      color = '#46c333'; // Vert clair pour les zones peu actives
      size = 28;
    } else {
      color = '#877a6f'; // Gris pour les zones moins actives
      size = 25;
    }

    // Créer un SVG personnalisé
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" font-size="8" fill="white" font-weight="bold">
          ${memberCount > 999 ? '999+' : memberCount}
        </text>
      </svg>
    `;

    return this.L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }
}