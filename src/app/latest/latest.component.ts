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

  // Pagination
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
    this.fetchLatestInsights();

    // Écouter les changements de navigation pour recharger les données
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('🔄 Navigation détectée, rechargement des actualités...');
        this.resetPagination();
        this.fetchLatestInsights();
      });
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
  }

  /**
   * Réinitialise la pagination
   */
  resetPagination(): void {
    this.currentPage = 0;
    this.isLastPage = false;
    this.insights = [];
  }

  /**
   * Charge les actualités validées depuis le serveur
   * Utilise getActualites() qui retourne uniquement les actualités validées (isvalid=true)
   */
  fetchLatestInsights(page: number = 0): void {
    console.log(`📥 Chargement des actualités - Page: ${page}, Size: ${this.pageSize}`);

    if (page === 0) {
      this.loading = true;
      this.insights = [];
    } else {
      this.loadingMore = true;
    }

    this.error = false;

    // Utiliser getActualites() qui filtre côté serveur les actualités validées
    this.infoService.getActualites(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('📊 Réponse du serveur:', response);

        let newItems: ContentItem[] = [];

        // Gérer différents formats de réponse
        if (Array.isArray(response)) {
          newItems = response;
          this.isLastPage = newItems.length < this.pageSize;
        } else if (response && response.content) {
          newItems = response.content;
          this.isLastPage = response.last || false;
        } else if (response) {
          newItems = response;
          this.isLastPage = newItems.length < this.pageSize;
        } else {
          console.error('❌ Format de réponse invalide:', response);
          this.error = true;
          this.loading = false;
          this.loadingMore = false;
          return;
        }

        console.log(`✅ ${newItems.length} actualités reçues`);

        // Filtrer côté client aussi pour être sûr (sécurité supplémentaire)
        newItems = newItems.filter(item => item.isvalid === true);
        console.log(`✅ ${newItems.length} actualités validées après filtrage`);

        // Trier par ID décroissant (du plus récent au plus ancien)
        newItems = this.sortItemsByIdDescending(newItems);

        // Ajouter ou remplacer les données
        if (page === 0) {
          this.insights = newItems;
        } else {
          // Éviter les doublons lors du chargement de plus d'actualités
          const existingIds = new Set(this.insights.map(item => item.id));
          const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
          
          const combinedItems = [...this.insights, ...uniqueNewItems];
          // Trier à nouveau pour maintenir l'ordre global
          this.insights = this.sortItemsByIdDescending(combinedItems);
        }

        this.currentPage = page;
        this.loading = false;
        this.loadingMore = false;

        console.log('✅ Actualités affichées:', this.insights.length);
        console.log('📄 Page actuelle:', this.currentPage);
        console.log('🏁 Dernière page:', this.isLastPage);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.error = true;
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  /**
   * Trie un tableau d'actualités par ID décroissant
   * @param items - Le tableau d'actualités à trier
   * @returns Le tableau trié par ID décroissant
   */
  private sortItemsByIdDescending(items: ContentItem[]): ContentItem[] {
    return items.sort((a, b) => {
      const idA = Number(a.id);
      const idB = Number(b.id);
      return idB - idA; // Tri décroissant
    });
  }

  /**
   * Charge plus d'actualités (pagination)
   */
  showMoreContent(): void {
    if (!this.isLastPage && !this.loadingMore) {
      console.log('📥 Chargement de plus d\'actualités...');
      this.fetchLatestInsights(this.currentPage + 1);
    }
  }

  /**
   * Retourne au début de la liste
   */
  showLessContent(): void {
    console.log('🔄 Retour au début de la liste...');
    this.resetPagination();
    this.fetchLatestInsights(0);
  }

  /**
   * Vérifie si le bouton "Voir plus" doit être affiché
   */
  shouldShowVoirPlus(): boolean {
    return !this.loading && !this.error && !this.isLastPage && this.insights.length > 0;
  }

  /**
   * Vérifie si le bouton "Voir moins" doit être affiché
   */
  shouldShowVoirMoins(): boolean {
    return !this.loading && !this.error && this.currentPage > 0 && this.insights.length > 0;
  }

  /**
   * Construit l'URL complète de l'image
   */
  getFullImageUrl(imagePath: string): string {
    if (!imagePath) {
      return 'assets/placeholder.jpg'; // Image par défaut si pas d'image
    }
    return this.imageBaseUrl + imagePath;
  }

  /**
   * Navigue vers les détails d'une actualité
   */
  navigateToDetails(id: number): void {
    if (!id || isNaN(id)) {
      console.error('❌ ID invalide:', id);
      return;
    }

    console.log('🔗 Navigation vers l\'actualité ID:', id);
    this.router.navigate(['/details', id]).then(success => {
      if (!success) {
        console.error('❌ Échec de navigation');
      }
    }).catch(err => {
      console.error('❌ Erreur de navigation:', err);
    });
  }

  /**
   * Formate une date en français
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('❌ Erreur de formatage de date:', error);
      return dateString;
    }
  }

  /**
   * Réessaie le chargement en cas d'erreur
   */
  retryLoading(): void {
    console.log('🔄 Nouvelle tentative de chargement...');
    this.resetPagination();
    this.fetchLatestInsights();
  }

  /**
   * Force le rechargement des données depuis le serveur
   * Utile après une suppression ou modification
   */
  forceReload(): void {
    console.log('🔄 Rechargement forcé des actualités...');
    this.resetPagination();
    this.fetchLatestInsights();
  }
}