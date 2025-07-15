import { SidebarComponent } from './../sidebar/sidebar.component';
import { Component, OnInit } from '@angular/core';
import { OpportuniteService, OpportuniteResponse, OpportuniteItem } from '../service/opportinute.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oppor',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './oppor.component.html',
  styleUrls: ['./oppor.component.css']
})
export class OpporComponent implements OnInit {
toggleAddForm() {
throw new Error('Method not implemented.');
}
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

  // Propriétés pour le popup de modification
  showEditPopup = false;
  editOpportuniteForm: FormGroup;
  editSelectedImage: File | null = null;
  editPreviewImage: string | null = null;
  editCurrentImage: string | null = null;
  editLoading = false;
  editErrorMessage: string | null = null;
  editSuccessMessage: string | null = null;
  currentEditOpportunite: OpportuniteItem | null = null;

  // URL de base pour les images provenant du backend
  imageBaseUrl = 'https://peeyconnect.net/repertoire_upload/';
formSubmitting: any;

  constructor(
    private opportuniteService: OpportuniteService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Formulaire d'ajout
    this.opportuniteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: ['', Validators.required],
      categorie: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });

    // Formulaire de modification
    this.editOpportuniteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: ['', Validators.required],
      categorie: ['', Validators.required],
      date: ['', Validators.required],
      isvalid: [false],
      alaune: [false]
    });
  }

  ngOnInit(): void {
    this.loadOpportunites(this.currentPage);
  }

  loadOpportunites(page: number): void {
    this.loading = true;
    
    this.opportuniteService.getAllOpportunite().subscribe({
      next: (opportunites: OpportuniteItem[]) => {
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

  toggleValidation(event: Event, oppor: OpportuniteItem): void {
    event.stopPropagation();
    this.processingId = oppor.id;
    const newStatus = !oppor.isvalid;
    
    this.opportuniteService.toggleValidation(oppor.id, newStatus).subscribe({
      next: (updatedOppor) => {
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
  openEditPopup(oppor: OpportuniteItem): void {
    this.openEditOpportunitePopup(oppor);
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
      this.selectedImage = file;
      
      // Aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveOpportunite(): void {
    if (this.opportuniteForm.invalid || this.saveLoading) {
      this.opportuniteForm.markAllAsTouched();
      return;
    }

    this.saveLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

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

  // Méthodes pour la gestion du popup de modification
  openEditOpportunitePopup(opportunite: OpportuniteItem): void {
    this.currentEditOpportunite = opportunite;
    this.editCurrentImage = opportunite.img;
    
    // Formater la date pour l'input date
    const dateFormatted = new Date(opportunite.date).toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    this.editOpportuniteForm.patchValue({
      titre: opportunite.titre,
      descr: opportunite.descr,
      lien: opportunite.lien || '',
      categorie: opportunite.categorie,
      date: dateFormatted,
      isvalid: opportunite.isvalid,
      alaune: opportunite.alaune
    });
    
    // Réinitialiser les variables d'image
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    
    this.showEditPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditOpportunitePopup(): void {
    this.showEditPopup = false;
    this.currentEditOpportunite = null;
    this.editCurrentImage = null;
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    this.editOpportuniteForm.reset();
    document.body.style.overflow = '';
  }

  onEditImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editSelectedImage = file;
      
      // Aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.editPreviewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeEditImage(): void {
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    // Réinitialiser l'input file
    const input = document.getElementById('edit-image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }
// Méthode corrigée pour submitEditOpportunite
submitEditOpportunite(): void {
  if (!this.currentEditOpportunite || this.editLoading) {
    return;
  }

  if (this.editOpportuniteForm.invalid) {
    this.editOpportuniteForm.markAllAsTouched();
    this.editErrorMessage = 'Veuillez remplir correctement tous les champs obligatoires';
    return;
  }

  this.editLoading = true;
  this.editErrorMessage = null;
  this.editSuccessMessage = null;

  const formData = new FormData();
  
  // Ajouter les champs du formulaire à FormData avec validation
  Object.keys(this.editOpportuniteForm.controls).forEach(key => {
    const value = this.editOpportuniteForm.get(key)?.value;
    
    // Convertir les booléens en string pour FormData
    if (typeof value === 'boolean') {
      formData.append(key, value.toString());
    } else if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value.toString());
    }
  });

  // Ajouter l'ID de l'opportunité
  formData.append('id', this.currentEditOpportunite.id.toString());

  // Ajouter les champs obligatoires manquants
  formData.append('idauteur', this.currentEditOpportunite.idauteur?.toString() || '1');
  formData.append('auteur', this.currentEditOpportunite.auteur || 'Admin');
  formData.append('role', this.currentEditOpportunite.role || 'ADMIN');
  formData.append('auteurimg', this.currentEditOpportunite.auteurimg || '');

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
  this.opportuniteService.updateOpportunite(this.currentEditOpportunite.id, formData).subscribe({
    next: (updatedOpportunite) => {
      // Mettre à jour l'opportunité dans la liste
      const index = this.opporList.findIndex(o => o.id === this.currentEditOpportunite!.id);
      if (index !== -1) {
        this.opporList[index] = {
          ...updatedOpportunite,
          img: updatedOpportunite.img ? `${this.imageBaseUrl}${updatedOpportunite.img}` : 'assets/images/placeholder.jpg',
          auteurimg: updatedOpportunite.auteurimg ? `${this.imageBaseUrl}${updatedOpportunite.auteurimg}` : 'assets/images/user-placeholder.jpg'
        };
      }
      
      this.editLoading = false;
      this.editSuccessMessage = 'Opportunité modifiée avec succès!';
      
      // Fermer le formulaire après 2 secondes
      setTimeout(() => {
        this.closeEditOpportunitePopup();
      }, 2000);
    },
    error: (err) => {
      this.editLoading = false;
      console.error('Erreur lors de la modification de l\'opportunité', err);
      console.error('Détails de l\'erreur:', err.error);
      
      let errorMsg = 'Erreur lors de la modification de l\'opportunité';
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

  getTruncatedDescription(description: string, maxLength: number = 150): string {
    if (!description) return '';
    
    if (description.length <= maxLength) {
      return description;
    }
    
    const truncated = description.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  shouldShowSeeMore(description: string, maxLength: number = 150): boolean {
    if (!description) return false;
    return description.length > maxLength;
  }
}