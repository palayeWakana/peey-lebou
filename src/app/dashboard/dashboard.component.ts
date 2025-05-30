import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardService } from '../service/dashboard.service'; // Import du service

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private isBrowser: boolean = false;
  private L: any; // Déclaration dynamique de Leaflet

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
    private dashboardService: DashboardService // Injection du service
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    this.loadDashboardData();

    if (this.isBrowser) {
      await this.loadLeafletAndInitMap();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

    // Chargement des données pour les sources de trafic (opportunités, actualités, vidéos)
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
    try {
      // Import dynamique de Leaflet uniquement côté client
      this.L = await import('leaflet');
      
      // Fix pour les icônes par défaut de Leaflet
      const iconRetinaUrl = 'assets/marker-icon-2x.png';
      const iconUrl = 'assets/marker-icon.png';
      const shadowUrl = 'assets/marker-shadow.png';
      
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
    } catch (error) {
      console.error('Erreur lors du chargement de Leaflet:', error);
    }
  }

  /**
   * Initialise la carte Leaflet
   */
  private initMap(): void {
    if (!this.L) return;

    const map = this.L.map('map').setView([14.6928, -17.4467], 13); // Dakar

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Exemple avec des données de localités
    const localities = [
      { name: 'Dakar Centre', lat: 14.6928, lng: -17.4467, members: 450 },
      { name: 'Plateau', lat: 14.6937, lng: -17.4441, members: 320 },
      { name: 'Medina', lat: 14.6889, lng: -17.4467, members: 280 },
      { name: 'Grand Yoff', lat: 14.7167, lng: -17.4667, members: 190 },
      { name: 'Parcelles Assainies', lat: 14.7333, lng: -17.4167, members: 650 }
    ];

    // Ajouter les marqueurs avec des icônes personnalisées
    localities.forEach(locality => {
      const customIcon = this.createCustomIcon(locality.members);
      
      this.L.marker([locality.lat, locality.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div>
            <h3>${locality.name}</h3>
            <p>Membres: ${locality.members}</p>
          </div>
        `);
    });
  }

  /**
   * Crée une icône personnalisée basée sur le nombre de membres
   */
  private createCustomIcon(memberCount: number): any {
    if (!this.L) return null;

    // Déterminer la couleur et la taille basées sur le nombre de membres
    let color = '#065413';
    let size = 30;

    if (memberCount > 600) {
      color = '#dc2626'; // Rouge pour les zones très actives
      size = 35;
    } else if (memberCount > 400) {
      color = '#ea580c'; // Orange pour les zones moyennement actives
      size = 32;
    } else if (memberCount > 200) {
      color = '#ca8a04'; // Jaune pour les zones peu actives
      size = 28;
    }

    // Créer un SVG personnalisé
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" font-size="10" fill="white" font-weight="bold">
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
    this.loadDashboardData(); // Recharge les données
  }

  viewOverview(): void {
    console.log("Navigation vers vue d'ensemble...");
  }
}