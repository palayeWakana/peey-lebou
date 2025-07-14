import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { OpportuniteService, OpportuniteItem, OpportuniteResponse } from '../service/opportinute.service';
import { HttpClientModule } from '@angular/common/http';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-opportunites',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './opportunites.component.html',
  styleUrl: './opportunites.component.css'
})
export class OpportunitesComponent implements OnInit, OnDestroy {
  opportunites: OpportuniteItem[] = [];
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
    private opportuniteService: OpportuniteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Chargement initial
    this.fetchOpportunites();

    // Recharger les opportunités à chaque retour sur cette route
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.resetPagination();
        this.fetchOpportunites();
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
    this.opportunites = [];
  }

  fetchOpportunites(page: number = 0): void {
    console.log(`Chargement des opportunités - Page: ${page}, Size: ${this.pageSize}`);
    
    // Si c'est la première page, afficher le loading principal
    if (page === 0) {
      this.loading = true;
      this.opportunites = [];
    } else {
      this.loadingMore = true;
    }
    
    this.error = false;

    this.opportuniteService.getOpportunites(page, this.pageSize).subscribe({
      next: (response: OpportuniteResponse) => {
        console.log('Réponse API reçue:', response);

        if (response && response.content) {
          if (page === 0) {
            // Première page : remplacer le contenu
            this.opportunites = response.content;
          } else {
            // Pages suivantes : ajouter au contenu existant
            this.opportunites = [...this.opportunites, ...response.content];
          }
          
          this.currentPage = page;
          this.isLastPage = response.last || false;
          
          console.log('Opportunités chargées:', this.opportunites);
          console.log('Page actuelle:', this.currentPage);
          console.log('Dernière page:', this.isLastPage);
        } else {
          console.error('Format de réponse invalide:', response);
          this.error = true;
        }

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
      this.fetchOpportunites(this.currentPage + 1);
    }
  }

  showLessContent(): void {
    this.resetPagination();
    this.fetchOpportunites(0);
  }

  shouldShowVoirPlus(): boolean {
    return !this.loading && !this.error && !this.isLastPage && this.opportunites.length > 0;
  }

  shouldShowVoirMoins(): boolean {
    return !this.loading && !this.error && this.currentPage > 0 && this.opportunites.length > 0;
  }

  getFullImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.jpg';
    return this.imageBaseUrl + imagePath;
  }

  navigateToDetails(id: number): void {
    if (!id || isNaN(id)) {
      console.error('ID invalide:', id);
      return;
    }

    this.router.navigate(['/opportunite-details', id]).then(success => {
      if (!success) {
        console.error('La navigation a échoué');
      }
    }).catch(err => {
      console.error('Erreur lors de la navigation:', err);
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
    this.fetchOpportunites();
  }
}