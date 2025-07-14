import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { InfoService, ContentItem } from '../service/info.service';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-latest',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterOutlet],
  templateUrl: './latest.component.html',
  styleUrl: './latest.component.css'
})
export class LatestComponent implements OnInit, OnDestroy {
  insights: ContentItem[] = [];
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';
  
  // Variables pour la pagination
  currentPage = 0;
  pageSize = 3;
  isLastPage = false;
  loadingMore = false;

  private navigationSubscription?: Subscription;
  
  constructor(
    private infoService: InfoService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Chargement initial
    this.fetchLatestInsights();

    // Recharger les actualités à chaque retour sur cette route
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.resetPagination();
        this.fetchLatestInsights();
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  resetPagination(): void {
    this.currentPage = 0;
    this.isLastPage = false;
  }
  
  fetchLatestInsights(page: number = 0): void {
    console.log(`Chargement des actualités - Page: ${page}, Size: ${this.pageSize}`);
    
    // Si c'est la première page, afficher le loading principal
    if (page === 0) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }
    
    this.error = false;

    this.infoService.getActualites(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('Réponse API reçue:', response);

        // Adaptez selon la structure de votre réponse
        if (Array.isArray(response)) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.insights = response;
          this.currentPage = page;
          this.isLastPage = response.length < this.pageSize;
        } 
        else if (response && response.content) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.insights = response.content;
          this.currentPage = page;
          this.isLastPage = response.last || false;
        } 
        else if (response) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.insights = response;
          this.currentPage = page;
          this.isLastPage = response.length < this.pageSize;
        } else {
          console.error('Format de réponse invalide:', response);
          this.error = true;
        }

        console.log('Actualités chargées:', this.insights);
        console.log('Page actuelle:', this.currentPage);
        console.log('Dernière page:', this.isLastPage);

        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Type d\'erreur:', err.status, err.statusText);
        console.error('Message d\'erreur:', err.message);
        console.error('Erreur complète:', err);
        this.error = true;
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  showMoreContent(): void {
    if (!this.isLastPage && !this.loadingMore) {
      this.fetchLatestInsights(this.currentPage + 1);
    }
  }

  showLessContent(): void {
    this.resetPagination();
    this.fetchLatestInsights(0);
  }

  shouldShowVoirPlus(): boolean {
    return !this.loading && !this.error && !this.isLastPage && this.insights.length > 0;
  }

  shouldShowVoirMoins(): boolean {
    return !this.loading && !this.error && this.isLastPage && this.currentPage > 0 && this.insights.length > 0;
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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  retryLoading(): void {
    this.resetPagination();
    this.fetchLatestInsights();
  }
}