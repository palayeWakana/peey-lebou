import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { OpportuniteService, OpportuniteItem, OpportuniteResponse } from '../opportinute.service';
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
  allOpportunites: OpportuniteItem[] = [];
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';

  initialDisplayCount = 3;
  showAllOpportunites = false;

  private navigationSubscription?: Subscription;

  constructor(
    private opportuniteService: OpportuniteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Chargement initial
    this.fetchLatestOpportunites();

    // Recharger les opportunités à chaque retour sur cette route
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.fetchLatestOpportunites();
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  fetchLatestOpportunites(): void {
    console.log('Chargement des opportunités...');
    this.loading = true;
    this.error = false;

    this.opportuniteService.getOpportunites(0, 12).subscribe({
      next: (response: OpportuniteResponse) => {
        console.log('Réponse API reçue:', response);

        if (response && response.content) {
          this.allOpportunites = response.content;
          console.log('Opportunités chargées:', this.allOpportunites);
          this.updateDisplayedOpportunites();
        } else {
          console.error('Format de réponse invalide:', response);
          this.error = true;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Type d\'erreur:', err.status, err.statusText);
        console.error('Message d\'erreur:', err.message);
        console.error('Erreur complète:', err);
        this.error = true;
        this.loading = false;
      
      }
    });
  }

  updateDisplayedOpportunites(): void {
    this.opportunites = this.showAllOpportunites
      ? [...this.allOpportunites]
      : this.allOpportunites.slice(0, this.initialDisplayCount);
  }

  showAllContent(): void {
    this.showAllOpportunites = true;
    this.updateDisplayedOpportunites();
  }

  showLessContent(): void {
    this.showAllOpportunites = false;
    this.updateDisplayedOpportunites();
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
    this.fetchLatestOpportunites();
  }
}
