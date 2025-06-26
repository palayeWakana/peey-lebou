import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardService } from '../service/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscriptions: Subscription = new Subscription();
  private isBrowser: boolean = false;
  private L: any;
  private map: any;
  private mapInitialized: boolean = false;

  stats = {
    totalUsers: 0,
    totalMen: 0,
    totalWomen: 0,
    totalCampaigns: 0
  };

  trafficSources = [
    { name: 'Opportunités', percentage: 0, color: '#065413', count: 0 },
    { name: 'Actualités', percentage: 0, color: '#20a439', count: 0 },
    { name: 'Vidéos', percentage: 0, color: '#60a5fa', count: 0 }
  ];

  monthlyData = [
    { month: 'Jan', value: 180 },
    { month: 'Fév', value: 160 },
    { month: 'Mar', value: 110 },
    { month: 'Avr', value: 80 },
    { month: 'Mai', value: 30 },
    { month: 'Jun', value: 140 },
    { month: 'Jul', value: 145 },
    { month: 'Août', value: 160 },
    { month: 'Sep', value: 170 },
    { month: 'Oct', value: 185 },
    { month: 'Nov', value: 180 },
    { month: 'Déc', value: 200 }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dashboardService: DashboardService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && !this.mapInitialized) {
      // Attendre que le DOM soit complètement rendu
      setTimeout(() => {
        this.loadLeafletAndInitMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Nettoyer la carte si elle existe
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private loadDashboardData(): void {
    // Chargement des statistiques utilisateurs et campagnes
    this.subscriptions.add(
      this.dashboardService.getDecompteUsers().subscribe({
        next: (data) => {
          this.stats.totalUsers = data.totalUsers;
          this.stats.totalMen = data.totalMen;
          this.stats.totalWomen = data.totalWomen;
        },
        error: (err) => console.error('Erreur chargement stats users:', err)
      })
    );

    this.subscriptions.add(
      this.dashboardService.getDecompteCampaign().subscribe({
        next: (data) => {
          this.stats.totalCampaigns = data.totalCampaigns;
        },
        error: (err) => console.error('Erreur chargement stats campagnes:', err)
      })
    );

    // Chargement des données pour les sources de trafic
    this.subscriptions.add(
      this.dashboardService.getDecompteOppor().subscribe({
        next: (data) => {
          this.trafficSources[0].count = data.totalOpportunites;
          this.updatePercentages();
        },
        error: (err) => console.error('Erreur chargement opportunités:', err)
      })
    );

    this.subscriptions.add(
      this.dashboardService.getDecompteActu().subscribe({
        next: (data) => {
          this.trafficSources[1].count = data.totalActus;
          this.updatePercentages();
        },
        error: (err) => console.error('Erreur chargement actualités:', err)
      })
    );

    this.subscriptions.add(
      this.dashboardService.getDecompteVideos().subscribe({
        next: (data) => {
          this.trafficSources[2].count = data.totalVideos;
          this.updatePercentages();
        },
        error: (err) => console.error('Erreur chargement vidéos:', err)
      })
    );
  }

  private updatePercentages(): void {
    const total = this.trafficSources.reduce((sum, item) => sum + item.count, 0);
    if (total > 0) {
      this.trafficSources.forEach(item => {
        item.percentage = Math.round((item.count / total) * 100);
      });
    }
  }

  /**
   * Charge Leaflet dynamiquement et initialise la carte
   */
  private async loadLeafletAndInitMap(): Promise<void> {
    if (!this.isBrowser || this.mapInitialized) {
      return;
    }

    try {
      // Vérifier que l'élément existe
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.warn('Élément carte non trouvé');
        return;
      }

      // SOLUTION 1: Import dynamique amélioré avec destructuration
      const leafletModule = await import('leaflet');
      
      // Vérifier si c'est un export par défaut ou nommé
      this.L = leafletModule.default || leafletModule;
      
      // Vérification supplémentaire
      if (!this.L || !this.L.map || !this.L.Icon) {
        console.error('Leaflet non correctement chargé', this.L);
        return;
      }

      console.log('Leaflet chargé avec succès:', this.L);
      
      // Configuration des icônes par défaut
      this.configureLeafletIcons();
      
      // Initialiser la carte
      this.initMap();
      this.mapInitialized = true;
      
    } catch (error) {
      console.error('Erreur lors du chargement de Leaflet:', error);
      
      // SOLUTION 2: Fallback avec chargement via CDN
      this.loadLeafletFromCDN();
    }
  }

  /**
   * SOLUTION 2: Chargement de Leaflet via CDN comme fallback
   */
  private loadLeafletFromCDN(): void {
    if (typeof window === 'undefined') return;

    // Vérifier si Leaflet est déjà disponible globalement
    if ((window as any).L) {
      this.L = (window as any).L;
      this.configureLeafletIcons();
      this.initMap();
      this.mapInitialized = true;
      return;
    }

    // Charger le CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    // Charger le JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      this.L = (window as any).L;
      if (this.L) {
        this.configureLeafletIcons();
        this.initMap();
        this.mapInitialized = true;
      }
    };
    script.onerror = (error) => {
      console.error('Erreur chargement Leaflet depuis CDN:', error);
    };
    document.head.appendChild(script);
  }

  /**
   * Configure les icônes par défaut de Leaflet
   */
  private configureLeafletIcons(): void {
    if (!this.L || !this.L.Icon || !this.L.Icon.Default) {
      console.error('L.Icon.Default non disponible:', this.L);
      return;
    }

    try {
      // Correction du problème d'icônes avec gestion d'erreur
      const iconDefault = this.L.Icon.Default.prototype;
      if (iconDefault._getIconUrl) {
        delete iconDefault._getIconUrl;
      }
      
      this.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    } catch (error) {
      console.error('Erreur configuration icônes Leaflet:', error);
    }
  }

  /**
   * Initialise la carte Leaflet
   */
  private initMap(): void {
    if (!this.L || !this.isBrowser) {
      console.error('Leaflet non disponible pour initialisation');
      return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Élément carte non trouvé');
      return;
    }

    try {
      // Nettoyer toute instance précédente
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Créer la carte
      this.map = this.L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      }).setView([14.6928, -17.4467], 13);

      // Ajouter la couche de tuiles
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 8
      }).addTo(this.map);

      // Données de localités
      const localities = [
        { name: 'Dakar Centre', lat: 14.6928, lng: -17.4467, members: 450 },
        { name: 'Plateau', lat: 14.6937, lng: -17.4441, members: 320 },
        { name: 'Medina', lat: 14.6889, lng: -17.4467, members: 280 },
        { name: 'Grand Yoff', lat: 14.7167, lng: -17.4667, members: 190 },
        { name: 'Parcelles Assainies', lat: 14.7333, lng: -17.4167, members: 650 }
      ];

      // Ajouter les marqueurs
      const markers: any[] = [];
      localities.forEach(locality => {
        const customIcon = this.createCustomIcon(locality.members);
        
        const marker = this.L.marker([locality.lat, locality.lng], { 
          icon: customIcon || undefined // Utiliser l'icône par défaut si customIcon échoue
        })
          .addTo(this.map)
          .bindPopup(`
            <div style="text-align: center; padding: 10px;">
              <h3 style="margin: 0 0 10px 0; color: #065413;">${locality.name}</h3>
              <p style="margin: 0; font-weight: bold;">Membres: ${locality.members}</p>
            </div>
          `);
        
        markers.push(marker);
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (markers.length > 0) {
        const group = new this.L.featureGroup(markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }

      // Forcer le redimensionnement de la carte
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      console.log('Carte initialisée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  /**
   * Crée une icône personnalisée basée sur le nombre de membres
   */
  private createCustomIcon(memberCount: number): any {
    if (!this.L || !this.L.divIcon) {
      console.warn('divIcon non disponible, utilisation icône par défaut');
      return null;
    }

    try {
      // Déterminer la couleur et la taille
      let color = '#065413';
      let size = 30;

      if (memberCount > 600) {
        color = '#dc2626';
        size = 35;
      } else if (memberCount > 400) {
        color = '#ea580c';
        size = 32;
      } else if (memberCount > 200) {
        color = '#ca8a04';
        size = 28;
      }

      // SVG personnalisé
      const svgIcon = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
      });
    } catch (error) {
      console.error('Erreur création icône personnalisée:', error);
      return null;
    }
  }

  // Méthodes utilitaires existantes
  getProgressPercentage(): number {
    return 75.5;
  }

  getMaxValue(): number {
    return Math.max(...this.monthlyData.map(item => item.value));
  }

  getBarHeight(value: number): number {
    const maxValue = this.getMaxValue();
    return (value / maxValue) * 100;
  }

  getRotationAngle(index: number): number {
    let angle = 0;
    for (let i = 0; i < index; i++) {
      angle += (this.trafficSources[i].percentage / 360);
    }
    return angle;
  }

  syncData(): void {
    console.log('Synchronisation des données...');
    this.loadDashboardData();
  }

  viewOverview(): void {
    console.log("Navigation vers vue d'ensemble...");
  }
}