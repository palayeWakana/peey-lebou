import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-leaflet',
  standalone: true,
  imports: [],
  templateUrl: './leaflet.component.html',
  styleUrl: './leaflet.component.css'
})
export class LeafletComponent implements OnInit, AfterViewInit {
  private map: any;
  private markers: any[] = [
    [23.7771, 90.3994] // Dhaka, Bangladesh
  ];
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {}

  async ngAfterViewInit() {
    if (this.isBrowser) {
      const L = await import('leaflet');
      this.initMap(L);
      this.centerMap(L);
    }
  }

  private initMap(L: any) {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map').setView(this.markers[0], 13);
    L.tileLayer(baseMapURl, {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Ajouter les marqueurs
    this.markers.forEach((coords: [number, number]) => {
      L.marker(coords).addTo(this.map);
    });
  }

  private centerMap(L: any) {
    const bounds = L.latLngBounds(
      this.markers.map((coords: [number, number]) => L.latLng(coords[0], coords[1]))
    );
    this.map.fitBounds(bounds);
  }
}
