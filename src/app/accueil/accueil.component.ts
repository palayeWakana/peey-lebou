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
  imports: [CommonModule, RouterModule, FooterComponent, LearnComponent, OurtakeComponent, LatestComponent, OpportunitesComponent, VideoComponent],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscriptions: Subscription = new Subscription();
  private isBrowser: boolean = false;
  private L: any;
  private map: any;
  private mapInitialized: boolean = false;

  // Variables pour le slider
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
    this.startImageSlider();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && !this.mapInitialized) {
      // Délai plus long pour s'assurer que tous les composants sont chargés
      setTimeout(() => {
        this.loadLeafletAndInitMap();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Nettoyer la carte
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Méthodes pour le slider
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
    this.isMenuOpen = false;
  }

  /**
   * Charge Leaflet dynamiquement et initialise la carte
   */
  private async loadLeafletAndInitMap(): Promise<void> {
    if (!this.isBrowser || this.mapInitialized) {
      return;
    }

    // Vérifications multiples pour s'assurer que l'élément existe
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkAndInit = async () => {
      const mapElement = document.getElementById('map');
      if (!mapElement && attempts < maxAttempts) {
        attempts++;
        console.warn(`Tentative ${attempts}: Élément carte non trouvé, retry...`);
        setTimeout(checkAndInit, 1000);
        return;
      }
      
      if (!mapElement) {
        console.error('Impossible de trouver l\'élément carte après plusieurs tentatives');
        return;
      }

      try {
        // Import dynamique de Leaflet
        this.L = await import('leaflet');
        
        // Configuration des icônes
        this.configureLeafletIcons();
        
        // Initialiser la carte
        this.initMap();
        this.mapInitialized = true;
        
      } catch (error) {
        console.error('Erreur lors du chargement de Leaflet:', error);
      }
    };

    await checkAndInit();
  }

  /**
   * Configure les icônes par défaut de Leaflet
   */
  private configureLeafletIcons(): void {
    if (!this.L) return;

    // Fix pour les icônes par défaut
    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'leaflet/marker-icon-2x.png',
      iconUrl: 'leaflet/marker-icon.png',
      shadowUrl: 'leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  /**
   * Initialise la carte Leaflet
   */
  private initMap(): void {
    if (!this.L || !this.isBrowser) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Élément carte non trouvé lors de l\'initialisation');
      return;
    }

    try {
      // Vérifier si la carte n'est pas déjà initialisée
      if (mapElement.hasChildNodes() && mapElement.children.length > 0) {
        console.log('Carte déjà initialisée, nettoyage...');
        mapElement.innerHTML = '';
      }

      // Créer la carte
      this.map = this.L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        attributionControl: true
      }).setView([14.6928, -17.4467], 12);

      // Ajouter la couche de tuiles
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 8
      }).addTo(this.map);

      // Données de localités étendues
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

      // Ajouter les marqueurs
      const markers: any[] = [];
      localities.forEach(locality => {
        const customIcon = this.createCustomIcon(locality.members);
        
        const marker = this.L.marker([locality.lat, locality.lng], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(`
            <div style="text-align: center; padding: 10px; min-width: 150px;">
              <h3 style="margin: 0 0 10px 0; color: #20a439; font-size: 16px;">${locality.name}</h3>
              <p style="margin: 0; font-weight: bold; color: #065413;">Membres actifs: ${locality.members}</p>
            </div>
          `);
        
        markers.push(marker);
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (markers.length > 0) {
        const group = new this.L.featureGroup(markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }

      // Forcer le redimensionnement après initialisation
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);

      console.log('Carte initialisée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  /**
   * Crée une icône personnalisée basée sur le nombre de membres
   */
  private createCustomIcon(memberCount: number): any {
    if (!this.L) return null;

    // Palette de couleurs cohérente avec le thème
    let color = '#20a439';
    let size = 30;

    if (memberCount > 600) {
      color = '#065413'; // Vert foncé pour les zones très actives
      size = 35;
    } else if (memberCount > 400) {
      color = '#20a439'; // Vert principal
      size = 32;
    } else if (memberCount > 200) {
      color = '#46c333'; // Vert clair
      size = 28;
    } else {
      color = '#877a6f'; // Gris pour les zones moins actives
      size = 25;
    }

    // SVG optimisé
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
        <text x="12" y="16" text-anchor="middle" font-size="8" fill="white" font-weight="bold">
          ${memberCount > 999 ? '999+' : memberCount}
        </text>
      </svg>
    `;

    return this.L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  }
}