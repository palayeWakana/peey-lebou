import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { VideoService, Video } from '../service/video.service';
import { HttpClientModule } from '@angular/common/http';
import { TrustUrlPipe } from "../trust-url.pipe";
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterOutlet, TrustUrlPipe],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css'
})
export class VideoComponent implements OnInit, OnDestroy {
  videos: Video[] = [];
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
    private videoService: VideoService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Chargement initial
    this.fetchVideos();

    // Recharger les vidéos à chaque retour sur cette route
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.resetPagination();
        this.fetchVideos();
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
  
  fetchVideos(page: number = 0): void {
    console.log(`Chargement des vidéos - Page: ${page}, Size: ${this.pageSize}`);
    
    // Si c'est la première page, afficher le loading principal
    if (page === 0) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }
    
    this.error = false;

    this.videoService.getVideos(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('Réponse API reçue:', response);

        // Adaptez selon la structure de votre réponse
        if (Array.isArray(response)) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.videos = response;
          this.currentPage = page;
          this.isLastPage = response.length < this.pageSize;
        } 
        else if (response && response.content) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.videos = response.content;
          this.currentPage = page;
          this.isLastPage = response.last || false;
        } 
        else if (response) {
          // Toujours remplacer le contenu par celui de la page actuelle
          this.videos = response;
          this.currentPage = page;
          this.isLastPage = response.length < this.pageSize;
        } else {
          console.error('Format de réponse invalide:', response);
          this.error = true;
        }

        console.log('Vidéos chargées:', this.videos);
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
      this.fetchVideos(this.currentPage + 1);
    }
  }

  showLessContent(): void {
    this.resetPagination();
    this.fetchVideos(0);
  }

  shouldShowVoirPlus(): boolean {
    return !this.loading && !this.error && !this.isLastPage && this.videos.length > 0;
  }

  shouldShowVoirMoins(): boolean {
    return !this.loading && !this.error && this.isLastPage && this.currentPage > 0 && this.videos.length > 0;
  }

  getFullImageUrl(imagePath: string): string {
    return imagePath ? this.imageBaseUrl + imagePath : 'assets/images/placeholder.jpg';
  }

  navigateToVideoDetails(id: number): void {
    if (!id || isNaN(id)) {
      console.error('ID invalide:', id);
      return;
    }
    
    this.router.navigate(['/video-details', id]).then(success => {
      if (!success) {
        console.error('Échec de navigation');
      }
    }).catch(err => {
      console.error('Erreur de navigation:', err);
    });
  }

  getYoutubeEmbedUrl(videoLink: string): string {
    // Extraction de l'ID de la vidéo YouTube
    let videoId = '';
    
    if (videoLink.includes('youtube.com')) {
      const urlParams = new URL(videoLink).searchParams;
      videoId = urlParams.get('v') || '';
    } else if (videoLink.includes('youtu.be')) {
      videoId = videoLink.split('/').pop() || '';
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
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
    this.fetchVideos();
  }
}