import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { VideoService, Video } from '../video.service';
import { HttpClientModule } from '@angular/common/http';
import { TrustUrlPipe } from "../trust-url.pipe";

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterOutlet, TrustUrlPipe],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css'
})
export class VideoComponent implements OnInit {
  videos: Video[] = [];
  allVideos: Video[] = [];
  loading = true;
  error = false;
  imageBaseUrl = 'http://peeyconnect.net/repertoire_upload/';
  
  initialDisplayCount = 3;
  showAllVideos = false;
  
  constructor(
    private videoService: VideoService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.fetchVideos();
  }
  
  fetchVideos(): void {
    this.loading = true;

    this.videoService.getVideoValid().subscribe({
      next: (items: Video[]) => {
        this.allVideos = items;
        this.updateDisplayedVideos();
        this.loading = false;
        console.log('Vidéos chargées:', this.allVideos);
      },
      error: (err) => {
        console.error('Erreur de chargement des vidéos:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateDisplayedVideos(): void {
    this.videos = this.showAllVideos
      ? [...this.allVideos]
      : this.allVideos.slice(0, this.initialDisplayCount);
  }

  showAllContent(): void {
    this.showAllVideos = true;
    this.updateDisplayedVideos();
  }

  showLessContent(): void {
    this.showAllVideos = false;
    this.updateDisplayedVideos();
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
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}