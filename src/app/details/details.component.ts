import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InfoService, ContentItem } from '../info.service';
import { HttpClientModule } from '@angular/common/http';
import { filter, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {
  shareOnSocial(platform: string): void {
    if (!this.article) return;
    
    let shareUrl = '';
    const currentUrl = window.location.href;
    const text = `Découvrez cette opportunité: ${this.article.titre}`;
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + currentUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }
  article: ContentItem | null = null;
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private infoService: InfoService
  ) {
    // Écoute des changements de route pour recharger l'article si l'ID change
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadArticle();
    });
  }

  ngOnInit(): void {
  // this.infoService.getActus();
    this.loadArticle();
  }

  private loadArticle(): void {
    // Récupération de l'ID depuis l'URL
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && !isNaN(+id)) {
      this.fetchArticleDetails(+id);
    } else {
      console.error('ID non valide dans l\'URL');
      this.handleInvalidId();
    }
  }

  private fetchArticleDetails(id: number): void {
    this.resetStates();
    
    this.infoService.getActuById(id).subscribe({
      next: (data) => {
        this.article = data;
        this.loading = false;
        console.log('Article chargé:', this.article);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'article:', err);
        this.handleError();
      }
    });
  }

  private resetStates(): void {
    this.loading = true;
    this.error = false;
    this.article = null;
  }

  private handleError(): void {
    this.error = true;
    this.loading = false;
    // Redirection après erreur avec message utilisateur
    setTimeout(() => this.router.navigate(['/acceuil']), 4000);
  }

  private handleInvalidId(): void {
    console.error('ID d\'article invalide');
    this.error = true;
    this.loading = false;
    this.router.navigate(['/accueil']);
  }

  getFullImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.jpg';
    return this.imageBaseUrl + imagePath;
  }

  goBack(): void {
    this.router.navigate(['/accueil']);
  }

  openExternalLink(): void {
    if (this.article?.lien) {
      window.open(this.article.lien, '_blank');
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Format de date invalide:', dateString);
      return 'Date invalide';
    }
  }
}
//le html 
