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

  // Pagination
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
    this.fetchVideos();

    // Recharge lors du retour sur la route
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.resetPagination();
        this.fetchVideos();
      });
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
  }

  resetPagination(): void {
    this.currentPage = 0;
    this.isLastPage = false;
    this.videos = [];
  }

  fetchVideos(page: number = 0): void {
    console.log(`Chargement des vidéos - Page: ${page}, Size: ${this.pageSize}`);

    if (page === 0) {
      this.loading = true;
      this.videos = [];
    } else {
      this.loadingMore = true;
    }

    this.error = false;

    this.videoService.getVideos(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('Réponse API reçue:', response);

        let newVideos: Video[] = [];

        if (Array.isArray(response)) {
          newVideos = response;
          this.isLastPage = response.length < this.pageSize;
        } else if (response?.content) {
          newVideos = response.content;
          this.isLastPage = response.last || false;
        } else if (response) {
          newVideos = response;
          this.isLastPage = response.length < this.pageSize;
        } else {
          this.error = true;
          return;
        }

        if (page === 0) {
          this.videos = newVideos;
        } else {
          this.videos = [...this.videos, ...newVideos];
        }

        this.currentPage = page;
        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
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
    if (!id || isNaN(id)) return;
    this.router.navigate(['/video-details', id]).catch(err => {
      console.error('Erreur navigation:', err);
    });
  }

  getYoutubeEmbedUrl(videoLink: string): string {
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
