import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { OpportuniteService, OpportuniteItem } from '../opportinute.service';
import { HttpClientModule } from '@angular/common/http';
import { distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-opportunite-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './opportunite-details.component.html',
  styleUrl: './opportunite-details.component.css'
})
export class OpportuniteDetailsComponent implements OnInit {
  opportunite: OpportuniteItem | null = null;
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';
  constructor(
    private opportuniteService: OpportuniteService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Écoute des changements de route
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadOpportunite();
    });
  }

  ngOnInit(): void {
    this.loadOpportunite();
  }

  private loadOpportunite(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam && !isNaN(+idParam)) {
      this.fetchOpportuniteDetails(+idParam);
    } else {
      this.handleError('ID invalide ou manquant');
      this.router.navigate(['/']); // Redirection vers la page d'accueil
    }
  }

  private handleError(message: string): void {
    console.error(message);
    this.error = true;
    this.loading = false;
    this.cdr.detectChanges();
  }

  fetchOpportuniteDetails(id: number): void {
    this.loading = true;
    this.error = false;
    this.opportunite = null;
    
    console.log(`Tentative de récupération de l'opportunité avec ID: ${id}`);
    
    this.opportuniteService.getOpportuniteById(id).subscribe({
      next: (opportunite) => {
        if (opportunite) {
          this.opportunite = opportunite;
          document.title = `${opportunite.titre} | PeeyConnect`;
        } else {
          this.handleError('Opportunité non trouvée ou vide');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'opportunité:', err);
        this.handleError('Erreur de chargement');
      }
    });
  }

  // Helper method to construct full image URL
  getFullImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.jpg';
    return this.imageBaseUrl + imagePath;
  }

  // Helper function to format date
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  // Méthode pour retourner à la liste des opportunités
  goBack(): void {
    this.router.navigate(['/']);
  }

  // Méthode pour partager sur les réseaux sociaux
  shareOnSocial(platform: string): void {
    if (!this.opportunite) return;
    
    let shareUrl = '';
    const currentUrl = window.location.href;
    const text = `Découvrez cette opportunité: ${this.opportunite.titre}`;
    
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
}
// le html 
