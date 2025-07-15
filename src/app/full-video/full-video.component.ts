// full-video.component.ts
import { Component, OnInit } from '@angular/core';
import { Video, VideoService, VideoCategorie } from '../service/video.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { TrustUrlPipe } from "../trust-url.pipe";
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-full-video',
  standalone: true,
  templateUrl: './full-video.component.html',
  styleUrls: ['./full-video.component.css'],
  imports: [SidebarComponent, CommonModule, TrustUrlPipe, HttpClientModule, RouterOutlet, ReactiveFormsModule]
})
export class FullVideoComponent implements OnInit {
  videosList: Video[] = [];
  loading: boolean = true;
  error: boolean = false;
  baseUrl: string = 'http://peeyconnect.net/repertoire_upload/';
  imageBaseUrl: string = 'http://peeyconnect.net/repertoire_upload/';
  validationLoading: { [key: number]: boolean } = {};
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 3;
  totalPages: number = 0;
  paginatedVideos: Video[] = [];
  
  // Popup description
  showPopup: boolean = false;
  popupDescription: string = '';
  
  // Popup vidéo
  showVideoPopup: boolean = false;
  selectedVideo: Video | null = null;

  // Popup ajout vidéo
  showAddVideoPopup: boolean = false;
  videoForm: FormGroup;
  videoCategories: VideoCategorie[] = [];
  selectedImage: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  saveLoading: boolean = false;

  // Popup modification vidéo
  showEditVideoPopup: boolean = false;
  editVideoForm: FormGroup;
  editSelectedImage: File | null = null;
  editImagePreview: string | ArrayBuffer | null = null;
  editCurrentImage: string | null = null;
  editLoading: boolean = false;
  editErrorMessage: string | null = null;
  editSuccessMessage: string | null = null;
  currentEditVideo: Video | null = null;

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private videoService: VideoService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
    // Formulaire d'ajout
    this.videoForm = this.fb.group({
      titre: ['', [Validators.required]],
      descr: ['', [Validators.required]],
      videolink: ['', [Validators.required]],
      vcategorieId: ['', [Validators.required]],
      date: [new Date().toISOString().split('T')[0], [Validators.required]]
    });

    // Formulaire de modification
    this.editVideoForm = this.fb.group({
      titre: ['', [Validators.required]],
      descr: ['', [Validators.required]],
      videolink: ['', [Validators.required]],
      vcategorieId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      isvalid: [false]
    });
  }

  ngOnInit(): void {
    this.loadVideos();
    this.loadVideoCategories();
  }

  loadVideoCategories(): void {
    this.videoService.getVideoCategories().subscribe({
      next: (categories) => {
        this.videoCategories = categories;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
        this.showErrorMessage('Erreur lors du chargement des catégories');
      }
    });
  }

  loadVideos(): void {
    this.loading = true;
    this.error = false;
    
    this.videoService.getAllVideo().subscribe({
      next: (videos) => {
        this.videosList = videos;
        this.totalPages = Math.ceil(this.videosList.length / this.pageSize);
        this.updatePaginatedVideos();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des vidéos:', err);
        this.error = true;
        this.loading = false;
        this.showErrorMessage('Erreur lors du chargement des vidéos');
      }
    });
  }

  updatePaginatedVideos(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedVideos = this.videosList.slice(start, end);
  }

  handleCardClick(event: Event, video: Video): void {
    if (!(event.target as HTMLElement).closest('button')) {
      this.selectedVideo = video;
      this.showVideoPopup = true;
    }
  }

  isDescriptionLong(description?: string): boolean {
    return description ? description.length > 150 : false;
  }

  openDescriptionPopup(description: string): void {
    this.popupDescription = description;
    this.showPopup = true;
  }

  closeDescriptionPopup(): void {
    this.showPopup = false;
  }

  openVideoPopup(video: Video): void {
    this.selectedVideo = video;
    this.showVideoPopup = true;
  }

  closeVideoPopup(): void {
    this.showVideoPopup = false;
    this.selectedVideo = null;
  }

  getFullImageUrl(imagePath?: string): string {
    return imagePath ? this.imageBaseUrl + imagePath : 'assets/images/placeholder.jpg';
  }

  getYoutubeEmbedUrl(videoLink?: string): string {
    if (!videoLink) return '';
    
    let videoId = '';
    
    try {
      if (videoLink.includes('youtube.com')) {
        const urlParams = new URL(videoLink).searchParams;
        videoId = urlParams.get('v') || '';
      } else if (videoLink.includes('youtu.be')) {
        videoId = videoLink.split('/').pop() || '';
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'URL vidéo:', error);
      return '';
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  }

  sanitizeVideoUrl(url?: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  toggleValidation(video: Video): void {
    if (!video || this.validationLoading[video.id]) return;
    
    this.validationLoading[video.id] = true;
    const newStatus = !video.isvalid;
    
    this.videoService.updateVideoValidation(video.id, newStatus).subscribe({
      next: () => {
        video.isvalid = newStatus;
        this.validationLoading[video.id] = false;
        this.showSuccessMessage(`Vidéo ${newStatus ? 'validée' : 'invalidée'} avec succès`);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la validation:', err);
        this.validationLoading[video.id] = false;
        this.showErrorMessage('Erreur lors de la modification du statut');
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePaginatedVideos();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePaginatedVideos();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedVideos();
    }
  }

  getPageNumbers(): number[] {
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  // Méthodes pour l'ajout de vidéo
  openAddVideoPopup(): void {
    this.showAddVideoPopup = true;
    this.resetForm();
    document.body.style.overflow = 'hidden';
  }

  closeAddVideoPopup(): void {
    this.showAddVideoPopup = false;
    this.resetForm();
    document.body.style.overflow = '';
  }

  resetForm(): void {
    this.videoForm.reset({
      date: new Date().toISOString().split('T')[0]
    });
    this.selectedImage = null;
    this.imagePreview = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  saveVideo(): void {
    if (this.videoForm.invalid || this.saveLoading) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.saveLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = new FormData();
    
    // Ajout des champs du formulaire
    formData.append('titre', this.videoForm.get('titre')?.value);
    formData.append('descr', this.videoForm.get('descr')?.value);
    formData.append('videolink', this.videoForm.get('videolink')?.value);
    formData.append('vcategorieId', this.videoForm.get('vcategorieId')?.value);
    formData.append('date', this.videoForm.get('date')?.value);
    
    // Valeurs par défaut
    formData.append('isvalid', 'false');
    formData.append('idauteur', '1');
    formData.append('auteur', 'Admin');
    formData.append('role', 'ADMIN');
    
    if (this.selectedImage) {
      formData.append('file', this.selectedImage);
    }

    this.videoService.createVideo(formData).subscribe({
      next: (response) => {
        this.saveLoading = false;
        this.showSuccessMessage('Vidéo ajoutée avec succès');
        this.closeAddVideoPopup();
        this.loadVideos();
      },
      error: (err) => {
        this.saveLoading = false;
        console.error('Erreur lors de l\'ajout de la vidéo:', err);
        this.showErrorMessage('Erreur lors de l\'ajout de la vidéo');
      }
    });
  }

  // Méthodes pour la modification de vidéo
  openEditVideoPopup(video: Video): void {
    this.currentEditVideo = video;
    this.editCurrentImage = video.img;
    
    // Formater la date pour l'input date
    const dateFormatted = new Date(video.date).toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    this.editVideoForm.patchValue({
      titre: video.titre,
      descr: video.descr,
      videolink: video.videolink,
      vcategorieId: video.vcategorie?.id || '',
      date: dateFormatted,
      isvalid: video.isvalid
    });
    
    // Réinitialiser les variables d'image
    this.editSelectedImage = null;
    this.editImagePreview = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    
    this.showEditVideoPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditVideoPopup(): void {
    this.showEditVideoPopup = false;
    this.currentEditVideo = null;
    this.editCurrentImage = null;
    this.editSelectedImage = null;
    this.editImagePreview = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    this.editVideoForm.reset();
    document.body.style.overflow = '';
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files[0]) {
      this.editSelectedImage = input.files[0];
      
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreview = reader.result;
      };
      reader.readAsDataURL(this.editSelectedImage);
    }
  }

  removeEditImage(): void {
    this.editSelectedImage = null;
    this.editImagePreview = null;
    // Réinitialiser l'input file
    const input = document.getElementById('edit-image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  submitEditVideo(): void {
    if (!this.currentEditVideo || this.editLoading) {
      return;
    }

    if (this.editVideoForm.invalid) {
      this.editVideoForm.markAllAsTouched();
      this.editErrorMessage = 'Veuillez remplir correctement tous les champs obligatoires';
      return;
    }

    this.editLoading = true;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;

    const formData = new FormData();
    
    // Ajouter les champs du formulaire à FormData avec validation
    Object.keys(this.editVideoForm.controls).forEach(key => {
      const value = this.editVideoForm.get(key)?.value;
      
      // Convertir les booléens en string pour FormData
      if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Ajouter l'ID de la vidéo
    formData.append('id', this.currentEditVideo.id.toString());

    // Ajouter les champs obligatoires manquants
    formData.append('idauteur', this.currentEditVideo.idauteur?.toString() || '1');
    formData.append('auteur', this.currentEditVideo.auteur || 'Admin');
    formData.append('role', this.currentEditVideo.role || 'ADMIN');

    // Ajouter l'image seulement si une nouvelle image a été sélectionnée
    if (this.editSelectedImage) {
      formData.append('file', this.editSelectedImage, this.editSelectedImage.name);
    }

    // Debug: Afficher le contenu de FormData
    console.log('FormData content:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    
    // Envoyer la requête de modification
    this.videoService.updateVideo(this.currentEditVideo.id, formData).subscribe({
      next: (response) => {
        // Recharger les vidéos pour obtenir les données mises à jour
        this.loadVideos();
        
        this.editLoading = false;
        this.editSuccessMessage = 'Vidéo modifiée avec succès!';
        
        // Fermer le formulaire après 2 secondes
        setTimeout(() => {
          this.closeEditVideoPopup();
        }, 2000);
      },
      error: (err) => {
        this.editLoading = false;
        console.error('Erreur lors de la modification de la vidéo', err);
        console.error('Détails de l\'erreur:', err.error);
        
        let errorMsg = 'Erreur lors de la modification de la vidéo';
        if (err.status === 400) {
          errorMsg = 'Données invalides. Vérifiez les champs saisis.';
        } else if (err.status === 415) {
          errorMsg = 'Format de données non supporté par le serveur';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        
        this.editErrorMessage = errorMsg;
      }
    });
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 5000);
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000);
  }
}