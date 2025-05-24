import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { InfoService, ContentItem } from '../info.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-latest',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterOutlet],
  templateUrl: './latest.component.html',
  styleUrl: './latest.component.css'
})
export class LatestComponent implements OnInit {
  insights: ContentItem[] = [];
  allInsights: ContentItem[] = [];
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';
  
  initialDisplayCount = 3;
  showAllInsights = false;
  
  constructor(
    private infoService: InfoService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.fetchLatestInsights();
  }
  
  fetchLatestInsights(): void {
    this.loading = true;

    // Ancien appel : this.infoService.getActus(0, 12)
    this.infoService.getActuValid().subscribe({
      next: (items: ContentItem[]) => {
        this.allInsights = items;
        this.updateDisplayedInsights();
        this.loading = false;
        console.log('Actualités chargées:', this.allInsights);
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateDisplayedInsights(): void {
    this.insights = this.showAllInsights
      ? [...this.allInsights]
      : this.allInsights.slice(0, this.initialDisplayCount);
  }

  showAllContent(): void {
    this.showAllInsights = true;
    this.updateDisplayedInsights();
  }

  showLessContent(): void {
    this.showAllInsights = false;
    this.updateDisplayedInsights();
  }

  getFullImageUrl(imagePath: string): string {
    return imagePath ? this.imageBaseUrl + imagePath : 'assets/images/placeholder.jpg';
  }

  navigateToDetails(id: number): void {
    if (!id || isNaN(id)) {
      console.error('ID invalide:', id);
      return;
    }
    
    this.router.navigate(['/details', id]).then(success => {
      if (!success) {
        console.error('Échec de navigation');
      }
    }).catch(err => {
      console.error('Erreur de navigation:', err);
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
