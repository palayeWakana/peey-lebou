import { Component, OnInit } from '@angular/core';
import { OpportuniteService, OpportuniteResponse, OpportuniteItem } from './../opportinute.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
  selector: 'app-oppor',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './oppor.component.html',
  styleUrls: ['./oppor.component.css']
})
export class OpporComponent implements OnInit {
  opporList: OpportuniteItem[] = [];
  currentPage = 0;
  pageSize = 4;
  totalPages = 0;
  totalItems = 0;
  loading = true;
  error = false;
  processingId: number | null = null;

  // Propriétés pour le popup de description
  showPopup = false;
  popupDescription = '';

  // Propriétés pour le popup d'ajout
  showAddPopup = false;
  opportuniteForm: FormGroup;
  selectedImage: File | null = null;
  previewImage: string | null = null;
  saveLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // URL de base pour les images provenant du backend
  imageBaseUrl = 'https://peeyconnect.net/repertoire_upload/';

  constructor(
    private opportuniteService: OpportuniteService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.opportuniteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: ['', Validators.required],
      categorie: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOpportunites(this.currentPage);
  }

  // MÉTHODE PRINCIPALE: Utilise getAllOpportunite comme demandé
  loadOpportunites(page: number): void {
    this.loading = true;
    
    this.opportuniteService.getAllOpportunite().subscribe({
      next: (opportunites: OpportuniteItem[]) => {
        console.log('Réponse API (toutes les opportunités)', opportunites);
        
        // Traiter les images
        const processedOpportunites = opportunites.map(oppor => ({
          ...oppor,
          img: oppor.img ? `${this.imageBaseUrl}${oppor.img}` : 'assets/images/placeholder.jpg',
          auteurimg: oppor.auteurimg ? `${this.imageBaseUrl}${oppor.auteurimg}` : 'assets/images/user-placeholder.jpg'
        }));
        
        // Calculer la pagination côté client
        this.totalItems = processedOpportunites.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Paginer les résultats côté client
        const startIndex = page * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.opporList = processedOpportunites.slice(startIndex, endIndex);
        
        this.currentPage = page;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des opportunités', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // MÉTHODE ALTERNATIVE: Utilise getOpportunites avec pagination serveur (si besoin)
  loadOpportunitesWithServerPagination(page: number): void {
    this.loading = true;
    
    this.opportuniteService.getOpportunites(page, this.pageSize).subscribe({
      next: (response: OpportuniteResponse) => {
        console.log('Réponse API avec pagination serveur', response);
        this.opporList = response.content.map(oppor => ({
          ...oppor,
          img: oppor.img ? `${this.imageBaseUrl}${oppor.img}` : 'assets/images/placeholder.jpg',
          auteurimg: oppor.auteurimg ? `${this.imageBaseUrl}${oppor.auteurimg}` : 'assets/images/user-placeholder.jpg'
        }));
        this.totalPages = response.totalPages;
        this.totalItems = response.totalElements;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des opportunités', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  toggleValidation(event: Event, oppor: OpportuniteItem): void {
    event.stopPropagation();
    this.processingId = oppor.id;
    const newStatus = !oppor.isvalid;
    
    this.opportuniteService.toggleValidation(oppor.id, newStatus).subscribe({
      next: (updatedOppor) => {
        console.log('Opportunité mise à jour:', updatedOppor);
        const index = this.opporList.findIndex(o => o.id === oppor.id);
        if (index !== -1) {
          this.opporList[index].isvalid = updatedOppor.isvalid;
        }
        this.processingId = null;
      },
      error: (err) => {
        console.error('Erreur lors de la validation/invalidation:', err);
        this.processingId = null;
      }
    });
  }

  // Méthodes pour la gestion du popup d'ajout
  openAddOpportunitePopup(): void {
    this.showAddPopup = true;
    this.resetForm();
    document.body.style.overflow = 'hidden';
  }

  closeAddOpportunitePopup(): void {
    this.showAddPopup = false;
    this.resetForm();
    document.body.style.overflow = '';
  }

  resetForm(): void {
    this.opportuniteForm.reset({
      date: new Date().toISOString().split('T')[0]
    });
    this.selectedImage = null;
    this.previewImage = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Utiliser les méthodes utilitaires du service
      if (!this.opportuniteService.isValidImageFile(file)) {
        this.showErrorMessage('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.');
        return;
      }

      if (!this.opportuniteService.isValidFileSize(file, 5)) {
        this.showErrorMessage('Le fichier est trop volumineux. Taille maximale: 5MB.');
        return;
      }

      this.selectedImage = file;
      
      // Aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // MÉTHODE AMÉLIORÉE: Utilise createOpportuniteAuto pour une gestion automatique
  saveOpportunite(): void {
    if (this.opportuniteForm.invalid || this.saveLoading) {
      this.opportuniteForm.markAllAsTouched();
      return;
    }

    this.saveLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Créer l'objet de données
    const opportuniteData = {
      titre: this.opportuniteForm.get('titre')?.value || '',
      descr: this.opportuniteForm.get('descr')?.value || '',
      lien: this.opportuniteForm.get('lien')?.value || '',
      categorie: this.opportuniteForm.get('categorie')?.value || '',
      date: this.opportuniteForm.get('date')?.value || '',
      isvalid: false,
      alaune: false,
      idauteur: 1,
      auteur: 'Admin',
      role: 'ADMIN',
      auteurimg: ''
    };

    console.log('Données envoyées:', {
      ...opportuniteData,
      hasFile: !!this.selectedImage
    });

    // Utiliser la méthode automatique du service
    this.opportuniteService.createOpportuniteAuto(opportuniteData, this.selectedImage || undefined).subscribe({
      next: (response) => {
        this.saveLoading = false;
        this.showSuccessMessage('Opportunité ajoutée avec succès');
        this.closeAddOpportunitePopup();
        this.loadOpportunites(this.currentPage);
      },
      error: (err) => {
        this.saveLoading = false;
        console.error('Erreur lors de l\'ajout de l\'opportunité:', err);
        console.error('Détails de l\'erreur:', err.error);
        
        let errorMsg = 'Erreur lors de l\'ajout de l\'opportunité';
        if (err.status === 415) {
          errorMsg = 'Format de données non supporté par le serveur';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        
        this.showErrorMessage(errorMsg);
      }
    });
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  // Méthodes pour la pagination
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOpportunites(page);
      window.scrollTo(0, 0);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToOpporDetail(id: number): void {
    this.router.navigate(['/opportunites', id]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Méthodes pour le popup de description
  openDescriptionPopup(description: string): void {
    this.popupDescription = description;
    this.showPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeDescriptionPopup(): void {
    this.showPopup = false;
    document.body.style.overflow = '';
  }

  shouldShowSeeMore(description: string): boolean {
    const lineHeight = 1.4;
    const fontSize = 14;
    const maxHeight = 3 * lineHeight * fontSize;
    
    const temp = document.createElement('div');
    temp.style.fontSize = fontSize + 'px';
    temp.style.lineHeight = lineHeight + 'em';
    temp.style.width = '200px';
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre-wrap';
    temp.innerText = description;
    
    document.body.appendChild(temp);
    const needsMore = temp.offsetHeight > maxHeight;
    document.body.removeChild(temp);
    
    return needsMore;
  }
}